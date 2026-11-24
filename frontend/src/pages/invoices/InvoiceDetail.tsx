import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';

interface InvoiceFull {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  gstPercent: string;
  gstAmount: string;
  totalAmount: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  customer: { name: string };
  challan: { items: { id: string; productName: string; productSku: string; unitPrice: string; quantity: number }[] };
}

export function InvoiceDetail() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: inv, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => (await api.get<InvoiceFull>(`/invoices/${id}`)).data,
  });

  const setStatus = useMutation({
    mutationFn: (paymentStatus: string) => api.put(`/invoices/${id}/payment-status`, { paymentStatus }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice', id] }),
  });

  function downloadPdf() {
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/invoices/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => window.open(URL.createObjectURL(blob)));
  }

  if (isLoading || !inv) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-sm text-gray-400">
        Loading invoice document…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Invoice ${inv.invoiceNumber}`}
        subtitle={`Billed to ${inv.customer.name}`}
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/invoices"
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
            >
              ← All Invoices
            </Link>
            <StatusBadge value={inv.paymentStatus} />
          </div>
        }
      />

      {/* Invoice Card / Printable Document Shell */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                NX
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Nexora ERP Solutions</h2>
            </div>
            <p className="text-xs text-gray-400">Official GST Tax Invoice</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Billed Customer</p>
            <p className="text-base font-bold text-gray-900">{inv.customer.name}</p>
          </div>
        </div>

        {/* Billed Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                <th className="pb-3 px-2">Description</th>
                <th className="pb-3 px-2">Rate (₹)</th>
                <th className="pb-3 px-2">Quantity</th>
                <th className="pb-3 px-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inv.challan.items.map((it) => (
                <tr key={it.id} className="text-xs text-gray-700">
                  <td className="py-3 px-2 font-semibold text-gray-900">{it.productName}</td>
                  <td className="py-3 px-2 font-mono">₹{Number(it.unitPrice).toFixed(2)}</td>
                  <td className="py-3 px-2">{it.quantity}</td>
                  <td className="py-3 px-2 text-right font-mono font-bold">
                    ₹{(Number(it.unitPrice) * it.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Subtotal & GST Breakdown */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono">₹{Number(inv.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST ({Number(inv.gstPercent)}%):</span>
              <span className="font-mono">₹{Number(inv.gstAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total Due:</span>
              <span className="font-mono text-blue-600">₹{Number(inv.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Toolbar & Payment Status Update */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-gray-100">
          <button
            onClick={downloadPdf}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download PDF Invoice
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Update Payment:</span>
            <select
              className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              value={inv.paymentStatus}
              onChange={(e) => setStatus.mutate(e.target.value)}
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial Payment</option>
              <option value="paid">Mark as Paid</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
