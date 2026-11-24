import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Challan } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { DataTable } from '../../components/DataTable';

export function ChallanDetail() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: challan, isLoading } = useQuery({
    queryKey: ['challan', id],
    queryFn: async () => (await api.get<Challan>(`/challans/${id}`)).data,
  });

  const confirm = useMutation({
    mutationFn: () => api.post(`/challans/${id}/confirm`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challan', id] }),
  });

  const cancel = useMutation({
    mutationFn: () => api.post(`/challans/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challan', id] }),
  });

  if (isLoading || !challan) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-sm text-gray-400">
        Loading challan record…
      </div>
    );
  }

  const grandTotal = challan.items.reduce((s, it) => s + Number(it.unitPrice) * it.quantity, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={`Challan ${challan.challanNumber}`}
        subtitle={`Delivery document for ${challan.customer?.name} · Created on ${new Date(challan.createdAt).toLocaleDateString('en-IN')}`}
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/challans"
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
            >
              ← All Challans
            </Link>
            <StatusBadge value={challan.status} />
          </div>
        }
      />

      {/* Recipient Details Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consignee Customer</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{challan.customer?.name}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Dispatch Quantity</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{challan.totalQuantity} items</p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Dispatched Line Items</h2>
        <DataTable
          columns={[
            {
              header: 'Product Details',
              render: (it) => (
                <div>
                  <p className="font-bold text-gray-900">{it.productName}</p>
                  <p className="text-xs text-gray-400 font-mono">SKU: {it.productSku}</p>
                </div>
              ),
            },
            {
              header: 'Unit Rate',
              render: (it) => <span className="font-medium text-xs text-gray-700">₹{Number(it.unitPrice).toFixed(2)}</span>,
            },
            {
              header: 'Dispatched Qty',
              render: (it) => <span className="font-bold text-xs text-gray-900">{it.quantity} units</span>,
            },
            {
              header: 'Line Total',
              align: 'right',
              render: (it) => (
                <span className="font-bold text-xs text-gray-900">
                  ₹{(Number(it.unitPrice) * it.quantity).toFixed(2)}
                </span>
              ),
            },
          ]}
          rows={challan.items}
        />
      </div>

      {/* Summary box & Action buttons */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 font-medium">Estimated Goods Value</p>
          <p className="text-xl font-extrabold text-gray-900">₹{grandTotal.toFixed(2)}</p>
        </div>

        {challan.status === 'draft' && (
          <div className="flex items-center gap-3">
            <button
              disabled={confirm.isPending || cancel.isPending}
              onClick={() => confirm.mutate()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
            >
              {confirm.isPending ? 'Confirming…' : '✓ Confirm & Deduct Stock'}
            </button>
            <button
              disabled={confirm.isPending || cancel.isPending}
              onClick={() => cancel.mutate()}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel Challan
            </button>
          </div>
        )}
      </div>

      {confirm.isError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          Confirmation failed: insufficient stock available in warehouse for one or more requested line items.
        </div>
      )}
    </div>
  );
}
