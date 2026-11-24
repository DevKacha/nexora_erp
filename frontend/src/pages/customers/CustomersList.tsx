import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Customer, Paginated } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { CustomerForm } from './CustomerForm';
import type { CustomerInput } from './CustomerForm';

export function CustomersList() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: async () =>
      (await api.get<Paginated<Customer>>('/customers', { params: { search, page } })).data,
  });

  const create = useMutation({
    mutationFn: (v: CustomerInput) => api.post('/customers', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setOpen(false);
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Customer Directory"
        subtitle="Manage wholesale, retail, and distributor accounts"
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Customer
          </button>
        }
      />

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
            placeholder="Search customer name, mobile, business..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <p className="text-xs text-gray-500 font-medium">
          Total: <span className="font-bold text-gray-800">{data?.meta.total ?? 0}</span> accounts
        </p>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
          Loading accounts…
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: 'Customer Details',
              render: (c) => (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs shadow-inner">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 hover:text-blue-600 transition-colors">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.businessName || 'Individual'}</p>
                  </div>
                </div>
              ),
            },
            {
              header: 'Contact Info',
              render: (c) => (
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-gray-700">{c.mobile}</p>
                  <p className="text-gray-400">{c.email || 'No email'}</p>
                </div>
              ),
            },
            {
              header: 'Type',
              render: (c) => (
                <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 capitalize">
                  {c.type}
                </span>
              ),
            },
            {
              header: 'Status',
              render: (c) => <StatusBadge value={c.status} />,
            },
            {
              header: 'Follow Up',
              align: 'right',
              render: (c) => (
                <span className="text-xs text-gray-500 font-medium">
                  {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                </span>
              ),
            },
          ]}
          rows={data?.data ?? []}
          onRowClick={(c) => nav(`/customers/${c.id}`)}
          page={page}
          totalPages={data?.meta.totalPages}
          onPageChange={setPage}
          emptyMessage="No customer accounts match your search"
        />
      )}

      {/* Add Modal */}
      <Modal
        open={open}
        title="Add New Customer"
        subtitle="Create a customer account for billing and challans"
        onClose={() => setOpen(false)}
      >
        <CustomerForm onSubmit={(v) => create.mutate(v)} />
      </Modal>
    </div>
  );
}
