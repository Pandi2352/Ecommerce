import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Star, MapPin, Mail, Phone, Edit2, Trash2 } from 'lucide-react';
import { Badge, Button, ConfirmDialog, EmptyState, Skeleton } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { deleteWarehouse, fetchWarehouses, setPrimaryWarehouse } from './api';
import { WarehouseEditorDrawer } from './components/WarehouseEditorDrawer';
import type { WarehouseItem } from './types';

export function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseItem | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWarehouses();
      setWarehouses(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load warehouses'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNew = () => {
    setEditingWarehouse(null);
    setDrawerOpen(true);
  };

  const handleEdit = (w: WarehouseItem) => {
    setEditingWarehouse(w);
    setDrawerOpen(true);
  };

  const handleSetPrimary = async (w: WarehouseItem) => {
    if (w.isPrimary) return;
    try {
      await setPrimaryWarehouse(w._id);
      toast.success(`"${w.name}" set as Primary Warehouse 🌟`);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update primary warehouse'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWarehouse) return;
    setDeleting(true);
    try {
      await deleteWarehouse(deletingWarehouse._id);
      toast.success(`Deleted warehouse "${deletingWarehouse.name}"`);
      setDeletingWarehouse(null);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete warehouse'));
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
            <Building2 className="h-5 w-5 text-indigo-500" />
            <span>Fulfilment Centers & Warehouses</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Manage physical stock locations, primary fulfillment hub, and distribution addresses.
          </p>
        </div>

        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Warehouse</span>
        </Button>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-8" />}
          title="No warehouses found"
          description="Create your first warehouse or fulfilment hub to start tracking localized stock."
          action={
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Warehouse</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {warehouses.map((w) => (
            <div
              key={w._id}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all bg-surface ${
                w.isPrimary
                  ? 'border-indigo-500/50 bg-indigo-500/5 dark:bg-indigo-950/10'
                  : 'border-border hover:border-slate-350 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text">{w.name}</h4>
                      {w.isPrimary && (
                        <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-500 border border-indigo-500/20">
                          <Star className="h-3 w-3 fill-indigo-500" />
                          <span>Primary Hub</span>
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block mt-1">
                      {w.code}
                    </span>
                  </div>

                  <Badge tone={w.isActive ? 'success' : 'neutral'}>
                    {w.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-text-secondary">
                  {w.contactName && (
                    <div className="font-medium text-text">
                      Contact: {w.contactName}
                    </div>
                  )}

                  {w.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{w.email}</span>
                    </div>
                  )}

                  {w.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{w.phone}</span>
                    </div>
                  )}

                  {w.address && (
                    <div className="flex items-start gap-1.5 pt-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span className="line-clamp-2">{w.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                {!w.isPrimary ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-indigo-500 hover:text-indigo-600 px-1"
                    onClick={() => handleSetPrimary(w)}
                  >
                    Set as Primary
                  </Button>
                ) : (
                  <span className="text-[11px] font-medium text-indigo-500 italic">Default Fulfillment</span>
                )}

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Edit Warehouse"
                    onClick={() => handleEdit(w)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  {!w.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-danger hover:text-danger"
                      title="Delete Warehouse"
                      onClick={() => setDeletingWarehouse(w)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Drawer */}
      <WarehouseEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        warehouse={editingWarehouse}
        onSaved={loadData}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deletingWarehouse}
        title={`Delete warehouse "${deletingWarehouse?.name}"?`}
        message="Are you sure you want to delete this warehouse location? This action cannot be undone."
        confirmLabel="Delete Warehouse"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingWarehouse(null)}
      />
    </div>
  );
}
