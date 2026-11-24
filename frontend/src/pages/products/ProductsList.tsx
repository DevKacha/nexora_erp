import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Product, Paginated } from '../../types';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { LowStockBanner } from '../../components/LowStockBanner';
import { ProductForm } from './ProductForm';
import type { ProductInput } from './ProductForm';

export function ProductsList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user?.role === 'admin' || user?.role === 'warehouse';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, page],
    queryFn: async () =>
      (await api.get<Paginated<Product>>('/products', { params: { search, page } })).data,
  });

  const create = useMutation({
    mutationFn: (v: ProductInput) => api.post('/products', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      setOpen(false);
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Product Inventory"
        subtitle="Catalog, warehouse locations, and stock levels"
        action={
          canEdit && (
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Product
            </button>
          )
        }
      />

      <LowStockBanner />

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Search product name, category, or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <p className="text-xs text-gray-500 font-medium">
          Total: <span className="font-bold text-gray-800">{data?.meta.total ?? 0}</span> products cataloged
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
          Loading catalog…
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: 'Product Details',
              render: (p) => (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shadow-inner">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400 font-mono">SKU: {p.sku}</p>
                  </div>
                </div>
              ),
            },
            {
              header: 'Category',
              render: (p) => (
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                  {p.category || 'General'}
                </span>
              ),
            },
            {
              header: 'Unit Price',
              render: (p) => (
                <span className="font-bold text-xs text-gray-900">
                  ₹{Number(p.unitPrice).toFixed(2)}
                </span>
              ),
            },
            {
              header: 'Stock Status',
              render: (p) => {
                const isLow = p.currentStock <= p.minStockQty;
                return (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {p.currentStock} in stock
                      </span>
                      {isLow && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                          Low (Min: {p.minStockQty})
                        </span>
                      )}
                    </div>
                  </div>
                );
              },
            },
            {
              header: 'Aisle / Location',
              align: 'right',
              render: (p) => (
                <span className="text-xs font-mono font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                  {p.warehouseLocation ?? '—'}
                </span>
              ),
            },
          ]}
          rows={data?.data ?? []}
          page={page}
          totalPages={data?.meta.totalPages}
          onPageChange={setPage}
          emptyMessage="No products match your search"
        />
      )}

      {/* Add Modal */}
      <Modal
        open={open}
        title="Add New Catalog Product"
        subtitle="Register new SKU into inventory tracking"
        onClose={() => setOpen(false)}
      >
        <ProductForm onSubmit={(v) => create.mutate(v)} />
      </Modal>
    </div>
  );
}
