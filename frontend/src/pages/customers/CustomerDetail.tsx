import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Customer } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';

export function CustomerDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get<Customer>(`/customers/${id}`)).data,
  });

  const addNote = useMutation({
    mutationFn: () => api.post(`/customers/${id}/notes`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', id] });
      setNote('');
    },
  });

  if (isLoading || !customer) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-sm text-gray-400">
        Loading customer record…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={customer.name}
        subtitle={`Customer Account Details · Registered ${new Date(customer.createdAt).toLocaleDateString('en-IN')}`}
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/customers"
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
            >
              ← Back to list
            </Link>
            <StatusBadge value={customer.status} />
          </div>
        }
      />

      {/* Customer Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100 mb-4">
          Profile Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
          <div className="p-3 bg-gray-50/70 rounded-xl space-y-1">
            <p className="text-gray-400 font-medium">Mobile Contact</p>
            <p className="text-sm font-bold text-gray-900">{customer.mobile}</p>
          </div>
          <div className="p-3 bg-gray-50/70 rounded-xl space-y-1">
            <p className="text-gray-400 font-medium">Email Address</p>
            <p className="text-sm font-bold text-gray-900">{customer.email ?? '—'}</p>
          </div>
          <div className="p-3 bg-gray-50/70 rounded-xl space-y-1">
            <p className="text-gray-400 font-medium">Account Type</p>
            <p className="text-sm font-bold text-gray-900 capitalize">{customer.type}</p>
          </div>
          <div className="p-3 bg-gray-50/70 rounded-xl space-y-1">
            <p className="text-gray-400 font-medium">Business / Trade Name</p>
            <p className="text-sm font-bold text-gray-900">{customer.businessName ?? '—'}</p>
          </div>
          <div className="p-3 bg-gray-50/70 rounded-xl space-y-1">
            <p className="text-gray-400 font-medium">GSTIN</p>
            <p className="text-sm font-bold text-gray-900 font-mono">{customer.gstNumber ?? 'Unregistered'}</p>
          </div>
          <div className="p-3 bg-gray-50/70 rounded-xl space-y-1">
            <p className="text-gray-400 font-medium">Next Follow-Up</p>
            <p className="text-sm font-bold text-gray-900">
              {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString('en-IN') : 'None scheduled'}
            </p>
          </div>
          <div className="p-3 bg-gray-50/70 rounded-xl space-y-1 sm:col-span-2 md:col-span-3">
            <p className="text-gray-400 font-medium">Registered Address</p>
            <p className="text-sm font-medium text-gray-800">{customer.address ?? 'No address provided'}</p>
          </div>
        </div>
      </div>

      {/* Follow-up Notes & CRM Log */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">CRM Follow-Up Notes</h2>
          <p className="text-xs text-gray-500 mt-0.5">Log conversations, customer requirements, and interaction history</p>
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Type follow-up summary or meeting notes..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && note.trim()) addNote.mutate();
            }}
          />
          <button
            disabled={!note.trim() || addNote.isPending}
            onClick={() => addNote.mutate()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {addNote.isPending ? 'Adding…' : 'Add Note'}
          </button>
        </div>

        <div className="space-y-2.5 pt-2">
          {!customer.notes || customer.notes.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 bg-gray-50/50 rounded-xl">
              No notes logged yet. Use the input above to add the first log.
            </div>
          ) : (
            customer.notes.map((n) => (
              <div key={n.id} className="p-3.5 rounded-xl bg-gray-50/60 border border-gray-100 flex items-start justify-between gap-4">
                <p className="text-xs text-gray-800 font-medium leading-relaxed">{n.note}</p>
                <span className="text-[11px] text-gray-400 font-mono flex-shrink-0">
                  {new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
