import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Invoice, Paginated, Challan } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';

export function InvoicesList() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [challanId, setChallanId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page],
    queryFn: async () => (await api.get<Paginated<Invoice>>('/invoices', { params: { page } })).data,
  });

  const { data: challans } = useQuery({
    queryKey: ['challans', 'confirmed'],
    queryFn: async () =>
      (await api.get<Paginated<Challan>>('/challans', { params: { status: 'confirmed', limit: 100 } })).data,
  });

  const create = useMutation({
    mutationFn: () => api.post<Invoice>('/invoices', { challanId }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      setOpen(false);
      nav(`/invoices/${res.data.id}`);
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Tax Invoices & GST Billing"
        subtitle="Generate GST invoices from confirmed challans and track customer payments"
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Generate Invoice
          </button>
        }
      />

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
          Loading tax invoices…
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: 'Invoice Number',
              render: (i) => (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold font-mono">
                    INV
                  </div>
                  <span className="font-bold text-xs text-blue-600 hover:underline">{i.invoiceNumber}</span>
                </div>
              ),
            },
            {
              header: 'Customer Recipient',
              render: (i) => <span className="font-semibold text-xs text-gray-800">{i.customer?.name ?? '—'}</span>,
            },
            {
              header: 'Invoice Amount',
              render: (i) => (
                <span className="font-extrabold text-xs text-gray-900">
                  ₹{Number(i.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              ),
            },
            {
              header: 'Payment Status',
              render: (i) => <StatusBadge value={i.paymentStatus} />,
            },
            {
              header: 'Issued Date',
              align: 'right',
              render: (i) => (
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(i.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              ),
            },
          ]}
          rows={data?.data ?? []}
          onRowClick={(i) => nav(`/invoices/${i.id}`)}
          page={page}
          totalPages={data?.meta.totalPages}
          onPageChange={setPage}
          emptyMessage="No invoices generated yet"
        />
      )}

      {/* Invoice Generation Modal */}
      <Modal
        open={open}
        title="Generate Tax Invoice"
        subtitle="Select an eligible confirmed challan to bill"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Confirmed Sales Challan *
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={challanId}
              onChange={(e) => setChallanId(e.target.value)}
            >
              <option value="">Select a confirmed challan</option>
              {challans?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.challanNumber} — {c.customer?.name} ({c.totalQuantity} items)
                </option>
              ))}
            </select>
          </div>

          {create.isError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              Generation failed: an invoice may already exist for this challan.
            </div>
          )}

          <div className="pt-2">
            <button
              disabled={!challanId || create.isPending}
              onClick={() => create.mutate()}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white font-semibold text-xs py-3 rounded-xl shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              {create.isPending ? 'Generating Invoice…' : 'Generate Tax Invoice with 18% GST'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
