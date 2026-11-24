import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Product, Paginated, StockMovement } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';

export function StockMovements() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: 1, type: 'in' as 'in' | 'out', reason: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', page],
    queryFn: async () =>
      (await api.get<Paginated<StockMovement>>('/stock-movements', { params: { page } })).data,
  });

  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => (await api.get<Paginated<Product>>('/products', { params: { limit: 100 } })).data,
  });

  const create = useMutation({
    mutationFn: () => api.post('/stock-movements', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      setOpen(false);
      setForm({ productId: '', quantity: 1, type: 'in', reason: '' });
    },
  });

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all';
  const labelClass = 'block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Stock Movements & Ledger"
        subtitle="Track warehouse inbound stock receipts and outbound dispatches"
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Record Movement
          </button>
        }
      />

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
          Loading movement records…
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: 'Product / SKU',
              render: (m) => (
                <div>
                  <p className="font-bold text-gray-900">{m.product?.name}</p>
                  <p className="text-xs text-gray-400 font-mono">SKU: {m.product?.sku}</p>
                </div>
              ),
            },
            {
              header: 'Flow Type',
              render: (m) => {
                const isIn = m.type === 'in_';
                return (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isIn
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <span>{isIn ? '↓ IN (Received)' : '↑ OUT (Issued)'}</span>
                  </span>
                );
              },
            },
            {
              header: 'Quantity',
              render: (m) => (
                <span className="font-bold text-xs text-gray-900">{m.quantity} units</span>
              ),
            },
            {
              header: 'Reason / Reference',
              render: (m) => <span className="text-xs text-gray-600">{m.reason ?? '—'}</span>,
            },
            {
              header: 'Timestamp',
              align: 'right',
              render: (m) => (
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(m.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              ),
            },
          ]}
          rows={data?.data ?? []}
          page={page}
          totalPages={data?.meta.totalPages}
          onPageChange={setPage}
          emptyMessage="No stock movements recorded yet"
        />
      )}

      {/* Movement Modal */}
      <Modal
        open={open}
        title="Record Stock Movement"
        subtitle="Log incoming purchase stock or inventory write-offs"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Target Product *</label>
            <select
              className={inputClass}
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Select a product to adjust</option>
              {products?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available stock: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>Movement Direction *</label>
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'in' | 'out' })}
              >
                <option value="in">IN (Add Stock)</option>
                <option value="out">OUT (Deduct Stock)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Units Quantity *</label>
              <input
                className={inputClass}
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Reason / Note</label>
            <input
              className={inputClass}
              placeholder="e.g. Supplier PO receipt, damaged goods, audit adjustment"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          {create.isError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              Movement failed. Ensure there is sufficient stock if issuing outbound.
            </div>
          )}

          <div className="pt-2">
            <button
              disabled={!form.productId || form.quantity <= 0 || create.isPending}
              onClick={() => create.mutate()}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white font-semibold text-xs py-3 rounded-xl shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              {create.isPending ? 'Logging Movement…' : 'Record Stock Adjustment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
