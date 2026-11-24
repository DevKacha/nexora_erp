import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Customer, Product, Paginated } from '../../types';

export interface ChallanInput {
  customerId: string;
  items: { productId: string; quantity: number }[];
}

export function ChallanForm({ onSubmit }: { onSubmit: (v: ChallanInput) => void }) {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);

  const { data: customers } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get<Paginated<Customer>>('/customers', { params: { limit: 100 } })).data,
  });

  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => (await api.get<Paginated<Product>>('/products', { params: { limit: 100 } })).data,
  });

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all';
  const labelClass = 'block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1';

  const update = (i: number, patch: Partial<{ productId: string; quantity: number }>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const removeItem = (i: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== i));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Customer Recipient *</label>
        <select className={inputClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select recipient customer</option>
          {customers?.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.businessName ? `(${c.businessName})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Challan Line Items *</label>
          <button
            type="button"
            onClick={() => setItems([...items, { productId: '', quantity: 1 }])}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            + Add Another Item
          </button>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
              <div className="flex-1">
                <select
                  className={inputClass}
                  value={it.productId}
                  onChange={(e) => update(i, { productId: e.target.value })}
                >
                  <option value="">Choose product</option>
                  {products?.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Available stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  value={it.quantity}
                  placeholder="Qty"
                  onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                />
              </div>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                  title="Remove row"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          disabled={!customerId || items.some((i) => !i.productId || i.quantity <= 0)}
          onClick={() => onSubmit({ customerId, items })}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white font-semibold text-xs py-3 rounded-xl shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
        >
          Generate Draft Challan
        </button>
      </div>
    </div>
  );
}
