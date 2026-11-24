import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Challan, Paginated } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { ChallanForm } from './ChallanForm';
import type { ChallanInput } from './ChallanForm';

export function ChallansList() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['challans', status, page],
    queryFn: async () =>
      (await api.get<Paginated<Challan>>('/challans', { params: { status: status || undefined, page } })).data,
  });

  const create = useMutation({
    mutationFn: (v: ChallanInput) => api.post<Challan>('/challans', v),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['challans'] });
      setOpen(false);
      nav(`/challans/${res.data.id}`);
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Delivery Challans"
        subtitle="Manage dispatch documentation and warehouse stock deduction"
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Challan
          </button>
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter Status:</label>
          <select
            className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft Only</option>
            <option value="confirmed">Confirmed Only</option>
            <option value="cancelled">Cancelled Only</option>
          </select>
        </div>
        <p className="text-xs text-gray-500 font-medium">
          Total: <span className="font-bold text-gray-800">{data?.meta.total ?? 0}</span> challans
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
          Loading challans…
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: 'Challan Number',
              render: (c) => (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold font-mono">
                    CH
                  </div>
                  <span className="font-bold text-xs text-blue-600 hover:underline">{c.challanNumber}</span>
                </div>
              ),
            },
            {
              header: 'Customer Recipient',
              render: (c) => <span className="font-semibold text-xs text-gray-800">{c.customer?.name ?? '—'}</span>,
            },
            {
              header: 'Units Quantity',
              render: (c) => (
                <span className="inline-block text-xs font-bold bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                  {c.totalQuantity} items
                </span>
              ),
            },
            {
              header: 'Status',
              render: (c) => <StatusBadge value={c.status} />,
            },
            {
              header: 'Created Date',
              align: 'right',
              render: (c) => (
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              ),
            },
          ]}
          rows={data?.data ?? []}
          onRowClick={(c) => nav(`/challans/${c.id}`)}
          page={page}
          totalPages={data?.meta.totalPages}
          onPageChange={setPage}
          emptyMessage="No delivery challans recorded"
        />
      )}

      {/* Modal */}
      <Modal
        open={open}
        title="Draft Delivery Challan"
        subtitle="Prepare dispatch items for customer shipment"
        onClose={() => setOpen(false)}
      >
        <ChallanForm onSubmit={(v) => create.mutate(v)} />
      </Modal>
    </div>
  );
}
