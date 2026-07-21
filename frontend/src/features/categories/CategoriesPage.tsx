import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FolderPlus,
  FolderTree,
  Layers,
  ListTree,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  SearchInput,
  Select,
  Skeleton,
} from '@/components/ui';
import { StatCard } from '@/components/common/StatCard';
import { cn } from '@/utils/cn';
import { useMutation } from '@/hooks/useMutation';
import { useAuth } from '@/features/auth/AuthContext';
import { deleteCategory, reorderCategory, useCategoryTree, type CategoryNode } from './api';
import { CategoryEditorDrawer } from './components/CategoryEditorDrawer';

// Tone rotation for the placeholder thumbnails, keyed by depth.
const DEPTH_TONES = [
  'bg-indigo-500/10 text-indigo-500',
  'bg-emerald-500/10 text-emerald-500',
  'bg-amber-500/10 text-amber-600',
  'bg-sky-500/10 text-sky-500',
  'bg-violet-500/10 text-violet-500',
];

export function CategoriesPage() {
  const { can } = useAuth();
  const canWrite = can('categories.write');
  const { data: tree, loading, error, reload } = useCategoryTree();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [defaultParent, setDefaultParent] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CategoryNode | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const del = useMutation();
  const move = useMutation();

  const term = search.trim().toLowerCase();
  const isFiltering = term !== '' || statusFilter !== 'ALL';

  // ── Derived stats (computed client-side from the tree) ──────────────────
  const stats = useMemo(() => {
    let total = 0;
    let active = 0;
    let products = 0;
    let maxDepth = 0;
    const walk = (nodes: CategoryNode[], depth: number) => {
      if (nodes.length) maxDepth = Math.max(maxDepth, depth);
      for (const n of nodes) {
        total += 1;
        if (n.isActive) active += 1;
        products += n.productCount ?? 0;
        walk(n.children, depth + 1);
      }
    };
    walk(tree, 1);
    return { total, active, products, roots: tree.length, maxDepth };
  }, [tree]);

  // ── Filtered tree (keep a node if it or any descendant matches) ─────────
  const visibleTree = useMemo(() => {
    if (!isFiltering) return tree;
    const matchesSelf = (n: CategoryNode) => {
      const searchOk =
        !term || n.name.toLowerCase().includes(term) || n.slug.toLowerCase().includes(term);
      const statusOk =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && n.isActive) ||
        (statusFilter === 'INACTIVE' && !n.isActive);
      return searchOk && statusOk;
    };
    const prune = (nodes: CategoryNode[]): CategoryNode[] =>
      nodes
        .map((n) => ({ ...n, children: prune(n.children) }))
        .filter((n) => matchesSelf(n) || n.children.length > 0);
    return prune(tree);
  }, [tree, term, statusFilter, isFiltering]);

  const allParentIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (nodes: CategoryNode[]) =>
      nodes.forEach((n) => {
        if (n.children.length) {
          ids.push(n.id);
          walk(n.children);
        }
      });
    walk(tree);
    return ids;
  }, [tree]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openCreate = (parent?: string) => {
    setEditing(null);
    setDefaultParent(parent ?? null);
    setDrawerOpen(true);
  };
  const openEdit = (c: CategoryNode) => {
    setEditing(c);
    setDefaultParent(c.parent ?? null);
    setDrawerOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    void del.run(() => deleteCategory(toDelete.id), {
      success: 'Category deleted',
      error: 'Delete failed',
      onSuccess: () => {
        setToDelete(null);
        void reload();
      },
    });
  };

  const doMove = (id: string, direction: 'up' | 'down') =>
    void move.run(() => reorderCategory(id, direction), {
      error: 'Reorder failed',
      onSuccess: () => void reload(),
    });

  const renderNode = (
    node: CategoryNode,
    depth: number,
    index: number,
    siblings: CategoryNode[],
  ) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = !isFiltering && collapsed.has(node.id);
    const tone = DEPTH_TONES[depth % DEPTH_TONES.length];

    return (
      <div key={node.id} className="relative">
        <div
          className="group flex items-center gap-3 border-b border-border px-3 py-2.5 transition-colors hover:bg-row-hover"
          style={{ paddingLeft: depth * 24 + 12 }}
        >
          {/* Expand / collapse */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggle(node.id)}
              className="flex size-5 shrink-0 items-center justify-center rounded text-text-secondary transition-colors hover:bg-border hover:text-text"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              disabled={isFiltering}
            >
              {isCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          ) : (
            <span className="inline-flex size-5 shrink-0 items-center justify-center">
              <span className="size-1.5 rounded-full bg-border" />
            </span>
          )}

          {/* Thumbnail */}
          {node.image ? (
            <img
              src={node.image}
              alt=""
              className="size-9 shrink-0 rounded-md border border-border object-cover"
            />
          ) : (
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-bold',
                tone,
              )}
            >
              {node.name.charAt(0).toUpperCase()}
            </span>
          )}

          {/* Name + slug + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-text">{node.name}</span>
              <span className="font-mono text-[11px] text-text-secondary">/{node.slug}</span>
              {node.metaTitle && (
                <span
                  className="hidden items-center gap-1 text-[11px] text-indigo-500 sm:inline-flex"
                  title={`SEO: ${node.metaTitle}`}
                >
                  <Tag className="size-3" />
                  SEO
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                <Boxes className="size-3" />
                {node.productCount ?? 0} {node.productCount === 1 ? 'product' : 'products'}
              </span>
              {hasChildren && (
                <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                  <Layers className="size-3" />
                  {node.children.length} sub
                </span>
              )}
            </div>
          </div>

          {/* Status */}
          <Badge tone={node.isActive ? 'success' : 'warning'} className="shrink-0 text-[10px]">
            {node.isActive ? 'Active' : 'Inactive'}
          </Badge>

          {/* Actions */}
          {canWrite && (
            <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Move up"
                disabled={isFiltering || index === 0 || move.saving}
                onClick={() => doMove(node.id, 'up')}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Move down"
                disabled={isFiltering || index === siblings.length - 1 || move.saving}
                onClick={() => doMove(node.id, 'down')}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Add subcategory"
                onClick={() => openCreate(node.id)}
              >
                <FolderPlus className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Edit"
                onClick={() => openEdit(node)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Delete"
                onClick={() => setToDelete(node)}
              >
                <Trash2 className="size-4 text-danger" />
              </Button>
            </div>
          )}
        </div>
        {hasChildren &&
          !isCollapsed &&
          node.children.map((c, i) => renderNode(c, depth + 1, i, node.children))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-text">
            <FolderTree className="h-5 w-5 text-indigo-500" />
            <span>Categories</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Organize the catalog into a nested tree — nest subcategories, reorder siblings, and
            attach images &amp; SEO metadata.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => openCreate()} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Categories"
          value={stats.total}
          icon={<FolderTree className="h-5 w-5" />}
        />
        <StatCard
          label="Top-level"
          value={stats.roots}
          icon={<ListTree className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Products Categorized"
          value={stats.products}
          icon={<Boxes className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search categories by name or slug..."
            containerClassName="w-full max-w-sm"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className="w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={isFiltering || allParentIds.length === 0}
            onClick={() => setCollapsed(new Set())}
          >
            <ChevronsUpDown className="size-4" />
            Expand all
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={isFiltering || allParentIds.length === 0}
            onClick={() => setCollapsed(new Set(allParentIds))}
          >
            <ChevronsDownUp className="size-4" />
            Collapse all
          </Button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Tree */}
      {loading ? (
        <div className="space-y-2 rounded-md border border-border bg-surface p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3" style={{ paddingLeft: (i % 3) * 24 }}>
              <Skeleton className="size-9 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : tree.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="size-8" />}
          title="No categories yet"
          description="Create your first category to start organizing the catalog into a nested tree."
          action={
            canWrite && (
              <Button onClick={() => openCreate()} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Create Category</span>
              </Button>
            )
          }
        />
      ) : visibleTree.length === 0 ? (
        <div className="rounded-md border border-border bg-surface px-4 py-10 text-center text-sm text-text-secondary">
          No categories matched your filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          {visibleTree.map((n, i) => renderNode(n, 0, i, visibleTree))}
        </div>
      )}

      {/* Create / edit — side drawer (matches Brands & Vendors) */}
      <CategoryEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        category={editing}
        defaultParent={defaultParent}
        tree={tree}
        onSaved={() => void reload()}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete category"
        danger
        confirmLabel="Delete"
        loading={del.saving}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        message={
          <>
            Delete <span className="font-medium text-text">{toDelete?.name}</span>? Its
            subcategories and {toDelete?.productCount ?? 0} product(s) move up to its parent.
          </>
        }
      />
    </div>
  );
}
