import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { User, Role } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';

interface UserInput {
  name: string;
  email: string;
  password: string;
  role: User['role'];
}

const roleBadges: Record<Role, { bg: string; text: string; border: string }> = {
  admin: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  sales: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  warehouse: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  accounts: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

export function UsersList() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<UserInput>();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<User[]>('/users')).data,
  });

  const create = useMutation({
    mutationFn: (v: UserInput) => api.post('/users', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      reset();
    },
  });

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all';
  const labelClass = 'block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="User & Staff Administration"
        subtitle="Manage employee portal access, roles, and administrative permissions"
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Team Member
          </button>
        }
      />

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
          Loading users…
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: 'Staff Member',
              render: (u) => (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
              ),
            },
            {
              header: 'Assigned Role',
              render: (u) => {
                const badge = roleBadges[u.role] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                return (
                  <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border capitalize ${badge.bg} ${badge.text} ${badge.border}`}>
                    {u.role}
                  </span>
                );
              },
            },
            {
              header: 'Access Scope',
              align: 'right',
              render: (u) => (
                <span className="text-xs font-medium text-gray-500">
                  {u.role === 'admin'
                    ? 'Full Administrator'
                    : u.role === 'sales'
                    ? 'CRM & Dispatch'
                    : u.role === 'warehouse'
                    ? 'Catalog & Inventory'
                    : 'GST Invoicing'}
                </span>
              ),
            },
          ]}
          rows={data ?? []}
          emptyMessage="No staff users configured"
        />
      )}

      {/* Add User Modal */}
      <Modal
        open={open}
        title="Add Staff Member"
        subtitle="Create credentials for employee portal access"
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input className={inputClass} placeholder="e.g. Rahul Sharma" {...register('name', { required: true })} />
          </div>

          <div>
            <label className={labelClass}>Corporate Email Address *</label>
            <input className={inputClass} type="email" placeholder="name@erp.local" {...register('email', { required: true })} />
          </div>

          <div>
            <label className={labelClass}>Login Password *</label>
            <input
              className={inputClass}
              type="password"
              placeholder="Min 6 characters"
              {...register('password', { required: true })}
            />
          </div>

          <div>
            <label className={labelClass}>Department Role *</label>
            <select className={inputClass} {...register('role', { required: true })}>
              <option value="sales">Sales (Customers & Challans)</option>
              <option value="warehouse">Warehouse (Products & Stock Movements)</option>
              <option value="accounts">Accounts (Invoices & Payments)</option>
              <option value="admin">Admin (All Access & User Management)</option>
            </select>
          </div>

          {create.isError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              User creation failed: this email address may already be registered.
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Creating Profile…' : 'Create Staff Credentials'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
