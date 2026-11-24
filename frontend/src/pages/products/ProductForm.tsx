import { useForm } from 'react-hook-form';

export interface ProductInput {
  name: string;
  sku: string;
  category?: string;
  unitPrice: number;
  currentStock?: number;
  minStockQty?: number;
  warehouseLocation?: string;
}

export function ProductForm({
  defaultValues,
  isEdit,
  onSubmit,
}: {
  defaultValues?: Partial<ProductInput>;
  isEdit?: boolean;
  onSubmit: (v: ProductInput) => void;
}) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProductInput>({ defaultValues });

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all';
  const labelClass = 'block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelClass}>Product Name *</label>
          <input className={inputClass} placeholder="e.g. Copper Wire 2mm" {...register('name', { required: true })} />
        </div>
        <div>
          <label className={labelClass}>SKU Code *</label>
          <input className={inputClass} placeholder="e.g. CW-2MM" {...register('sku', { required: true })} disabled={isEdit} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelClass}>Category</label>
          <input className={inputClass} placeholder="e.g. Electrical, Hardware" {...register('category')} />
        </div>
        <div>
          <label className={labelClass}>Unit Price (₹) *</label>
          <input
            className={inputClass}
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('unitPrice', { required: true, valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {!isEdit && (
          <div>
            <label className={labelClass}>Opening Stock</label>
            <input className={inputClass} type="number" placeholder="0" {...register('currentStock', { valueAsNumber: true })} />
          </div>
        )}
        <div>
          <label className={labelClass}>Min Stock Alert Level</label>
          <input className={inputClass} type="number" placeholder="50" {...register('minStockQty', { valueAsNumber: true })} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Warehouse Shelf / Location</label>
        <input className={inputClass} placeholder="e.g. Aisle 3, Rack B" {...register('warehouseLocation')} />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
        >
          {isSubmitting ? 'Saving Product…' : 'Save Product to Inventory'}
        </button>
      </div>
    </form>
  );
}
