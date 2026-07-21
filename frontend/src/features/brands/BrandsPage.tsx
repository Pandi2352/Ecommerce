import { useCallback, useEffect, useState } from 'react';
import { Award, Plus, Star, Tag, Layers } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
} from '@/components/ui';
import { StatCard } from '@/components/common/StatCard';
import type { Meta } from '@/lib/types';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { deleteBrand, fetchBrands, fetchBrandStats, updateBrand } from './api';
import { BrandCard } from './components/BrandCard';
import { BrandEditorDrawer } from './components/BrandEditorDrawer';
import type { BrandItem, BrandStats } from './types';

export function BrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [featuredFilter, setFeaturedFilter] = useState<string>('ALL');
  const [sort, setSort] = useState('name:asc');
  const [page, setPage] = useState(1);

  // Drawer & Modals
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<BrandItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        fetchBrands({
          page,
          pageSize: 12,
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          featured: featuredFilter === 'YES' ? true : featuredFilter === 'NO' ? false : undefined,
          sort,
        }),
        fetchBrandStats(),
      ]);
      setBrands(res.data);
      setMeta(res.meta);
      setStats(statsRes);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load brands'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, featuredFilter, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNew = () => {
    setEditingBrand(null);
    setDrawerOpen(true);
  };

  const handleEdit = (b: BrandItem) => {
    setEditingBrand(b);
    setDrawerOpen(true);
  };

  const handleToggleFeatured = async (b: BrandItem) => {
    try {
      await updateBrand(b.id, { isFeatured: !b.isFeatured });
      toast.success(
        b.isFeatured ? `Unmarked "${b.name}" as featured` : `Marked "${b.name}" as featured ⭐`,
      );
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update brand'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBrand) return;
    setDeleting(true);
    try {
      const res = await deleteBrand(deletingBrand.id);
      if (res.detachedProducts > 0) {
        toast.success(
          `Deleted brand "${deletingBrand.name}" and detached ${res.detachedProducts} products`,
        );
      } else {
        toast.success(`Deleted brand "${deletingBrand.name}"`);
      }
      setDeletingBrand(null);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete brand'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-500" />
            <span>Brands</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Manage manufacturer labels, brand logos, featured banners, and storefront filters.
          </p>
        </div>

        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Brand</span>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Brands" value={stats.total} icon={<Award className="h-5 w-5" />} />
          <StatCard
            label="Active Brands"
            value={stats.active}
            icon={<Tag className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            label="Featured Brands"
            value={stats.featured}
            icon={<Star className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            label="Products Attached"
            value={stats.totalProductsAttached}
            icon={<Layers className="h-5 w-5" />}
            tone="indigo"
          />
        </div>
      )}

      {/* Toolbar / Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-md border border-border bg-surface p-3">
        <div className="flex flex-1 items-center gap-3">
          <SearchInput
            value={search}
            onValueChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search brands by name, slug or description..."
            containerClassName="w-full max-w-sm"
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </Select>

          <Select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPage(1);
            }}
            className="w-36"
          >
            <option value="ALL">All Brands</option>
            <option value="YES">Featured Only ⭐</option>
            <option value="NO">Non-Featured</option>
          </Select>
        </div>

        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44">
          <option value="name:asc">Sort: Name (A-Z)</option>
          <option value="name:desc">Sort: Name (Z-A)</option>
          <option value="productCount:desc">Sort: Most Products</option>
          <option value="createdAt:desc">Sort: Newest First</option>
        </Select>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-md border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : brands.length === 0 ? (
        <EmptyState
          icon={<Award className="size-8" />}
          title="No brands found"
          description={
            search || statusFilter !== 'ALL' || featuredFilter !== 'ALL'
              ? 'No brands matched your current filters. Try resetting search parameters.'
              : 'Create your first brand to start categorizing products by manufacturer.'
          }
          action={
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Brand</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((b) => (
            <BrandCard
              key={b.id}
              brand={b}
              onEdit={handleEdit}
              onDelete={setDeletingBrand}
              onToggleFeatured={handleToggleFeatured}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && <Pagination meta={meta} onPageChange={(p) => setPage(p)} />}

      {/* Drawer Editor */}
      <BrandEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        brand={editingBrand}
        onSaved={loadData}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingBrand}
        title={`Delete brand "${deletingBrand?.name}"?`}
        message={
          deletingBrand && deletingBrand.productCount > 0
            ? `Warning: This brand is currently assigned to ${deletingBrand.productCount} product(s). Deleting it will detach the brand reference from those products.`
            : 'Are you sure you want to delete this brand? This action cannot be undone.'
        }
        confirmLabel="Delete Brand"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingBrand(null)}
      />
    </div>
  );
}
