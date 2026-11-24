import { useForm } from 'react-hook-form';
import type { Customer } from '../../types';

export type CustomerInput = Omit<Customer, 'id' | 'status' | 'notes' | 'createdAt'> & {
  status?: Customer['status'];
};

export function CustomerForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<CustomerInput>;
  onSubmit: (v: CustomerInput) => void;
}) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<CustomerInput>({ defaultValues });

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all';
  const labelClass = 'block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelClass}>Customer Name *</label>
          <input className={inputClass} placeholder="e.g. Acme Traders" {...register('name', { required: true })} />
        </div>
        <div>
          <label className={labelClass}>Mobile Number *</label>
          <input className={inputClass} placeholder="e.g. 9876543210" {...register('mobile', { required: true })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelClass}>Email Address</label>
          <input className={inputClass} type="email" placeholder="contact@domain.com" {...register('email')} />
        </div>
        <div>
          <label className={labelClass}>Business Legal Name</label>
          <input className={inputClass} placeholder="Registered Pvt Ltd name" {...register('businessName')} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className={labelClass}>GST Number</label>
          <input className={inputClass} placeholder="22AAAAA0000A1Z5" {...register('gstNumber')} />
        </div>
        <div>
          <label className={labelClass}>Client Type *</label>
          <select className={inputClass} {...register('type', { required: true })}>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="distributor">Distributor</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>CRM Status</label>
          <select className={inputClass} {...register('status')}>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Follow-Up Date</label>
        <input className={inputClass} type="date" {...register('followUpDate')} />
      </div>

      <div>
        <label className={labelClass}>Billing / Shipping Address</label>
        <textarea
          rows={3}
          className={inputClass}
          placeholder="Street address, city, state and pincode"
          {...register('address')}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
        >
          {isSubmitting ? 'Saving Customer…' : 'Save Customer Profile'}
        </button>
      </div>
    </form>
  );
}
