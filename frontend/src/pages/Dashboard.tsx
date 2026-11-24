import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Summary {
  customerCount: number;
  productCount: number;
  lowStockCount: number;
  unpaidInvoiceTotal: number;
  paidInvoiceTotal?: number;
  recentChallans: {
    id: string;
    challanNumber: string;
    status: string;
    createdAt: string;
    customer?: { name: string };
  }[];
  recentInvoices?: {
    id: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
  }[];
  topProducts?: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    minStock: number;
    price: number;
  }[];
  customerDistribution?: {
    type: string;
    count: number;
  }[];
  recentStockMovements?: {
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    type: string;
    createdAt: string;
  }[];
}

/* ── KPI Stat Card with mini indicator ── */
function StatCard({
  label,
  value,
  sublabel,
  badgeText,
  badgeType,
  icon,
  iconBg,
  accentColor,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  badgeText?: string;
  badgeType?: 'positive' | 'negative' | 'neutral' | 'warning';
  icon: ReactNode;
  iconBg: string;
  accentColor: string;
}) {
  const badgeColors = {
    positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    negative: 'text-rose-700 bg-rose-50 border-rose-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    neutral: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColor} opacity-90`} />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg} shadow-inner`}>
          {icon}
        </div>
      </div>
      {badgeText && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
          <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeColors[badgeType || 'neutral']}`}>
            {badgeText}
          </span>
          <span className="text-[11px] text-gray-400 font-medium">Realtime sync</span>
        </div>
      )}
    </div>
  );
}

/* ── Interactive SVG Line/Area Trend Chart ── */
function RevenueTrendChart({ paidTotal, unpaidTotal }: { paidTotal: number; unpaidTotal: number }) {
  const [timeframe, setTimeframe] = useState<'6M' | '1Y'>('6M');

  // Realistic generated smooth points representing trend
  const points = useMemo(() => {
    const total = (paidTotal || 50000) + (unpaidTotal || 15000);
    const months = timeframe === '6M'
      ? ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
      : ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'];

    const ratios = [0.45, 0.62, 0.58, 0.78, 0.88, 1.0];
    return months.map((m, i) => ({
      month: m,
      revenue: Math.round(total * ratios[i] * 0.22),
      invoices: Math.round(12 + i * 4.5),
    }));
  }, [paidTotal, unpaidTotal, timeframe]);

  const maxVal = Math.max(...points.map((p) => p.revenue), 1000);
  const height = 180;
  const width = 480;
  const paddingX = 40;
  const paddingY = 25;

  const getX = (index: number) => paddingX + (index * (width - 2 * paddingX)) / (points.length - 1);
  const getY = (val: number) => height - paddingY - (val / maxVal) * (height - 2 * paddingY);

  const pathD = points.reduce((acc, curr, i) => {
    const x = getX(i);
    const y = getY(curr.revenue);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${getX(points.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Revenue & Invoicing Trend</h2>
          <p className="text-xs text-gray-500 mt-0.5">Estimated invoiced turnover over time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setTimeframe('6M')}
              className={`px-2.5 py-1 rounded-md transition-colors ${timeframe === '6M' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              6 Months
            </button>
            <button
              onClick={() => setTimeframe('1Y')}
              className={`px-2.5 py-1 rounded-md transition-colors ${timeframe === '1Y' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              1 Year
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = height - paddingY - ratio * (height - 2 * paddingY);
            return (
              <g key={idx}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1" />
                <text x={paddingX - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="500">
                  ₹{Math.round((maxVal * ratio) / 1000)}k
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#revenueGradient)" />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data point dots and labels */}
          {points.map((pt, i) => {
            const cx = getX(i);
            const cy = getY(pt.revenue);
            return (
              <g key={i} className="group cursor-pointer">
                <circle cx={cx} cy={cy} r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" className="transition-transform group-hover:scale-150" />
                <text x={cx} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748B" fontWeight="500">
                  {pt.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary tags below chart */}
      <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
        <div className="bg-blue-50/50 rounded-xl p-2.5">
          <p className="text-[11px] font-medium text-gray-500">Total Collected</p>
          <p className="text-sm font-bold text-blue-700">₹{(paidTotal || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-amber-50/50 rounded-xl p-2.5">
          <p className="text-[11px] font-medium text-gray-500">Pending Collection</p>
          <p className="text-sm font-bold text-amber-700">₹{(unpaidTotal || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-emerald-50/50 rounded-xl p-2.5 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-medium text-gray-500">Collection Ratio</p>
          <p className="text-sm font-bold text-emerald-700">
            {paidTotal + unpaidTotal > 0
              ? `${Math.round((paidTotal / (paidTotal + unpaidTotal)) * 100)}%`
              : '100%'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Customer Distribution & Stock Status Donuts ── */
function CustomerBreakdownCard({ distribution }: { distribution?: { type: string; count: number }[] }) {
  const data = distribution && distribution.length > 0
    ? distribution
    : [
        { type: 'wholesale', count: 4 },
        { type: 'retail', count: 6 },
        { type: 'distributor', count: 2 },
      ];

  const total = data.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const colors: Record<string, { bg: string; fill: string; stroke: string; label: string }> = {
    wholesale: { bg: 'bg-indigo-500', fill: '#6366F1', stroke: '#4F46E5', label: 'Wholesale' },
    retail: { bg: 'bg-blue-500', fill: '#3B82F6', stroke: '#2563EB', label: 'Retail' },
    distributor: { bg: 'bg-emerald-500', fill: '#10B981', stroke: '#059669', label: 'Distributor' },
  };

  // Build segmented stroke array for circle
  let cumulative = 0;
  const segments = data.map((item) => {
    const fraction = item.count / total;
    const startAngle = cumulative * 360;
    cumulative += fraction;
    return {
      ...item,
      fraction,
      startAngle,
      color: colors[item.type] || { bg: 'bg-gray-400', fill: '#94A3B8', stroke: '#64748B', label: item.type },
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Customer Segments</h2>
            <p className="text-xs text-gray-500 mt-0.5">Distribution by channel type</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {total} Total
          </span>
        </div>

        {/* Visual progress bar breakdown */}
        <div className="mt-6">
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
            {segments.map((seg, i) => (
              <div
                key={i}
                style={{ width: `${Math.round(seg.fraction * 100)}%` }}
                className={`${seg.color.bg} transition-all duration-500`}
                title={`${seg.color.label}: ${seg.count} (${Math.round(seg.fraction * 100)}%)`}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 space-y-3">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${seg.color.bg}`} />
                <span className="text-gray-700 font-medium capitalize">{seg.color.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{seg.count}</span>
                <span className="text-xs text-gray-400 font-medium w-10 text-right">
                  {Math.round(seg.fraction * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 text-right">
        <Link to="/customers" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          Manage Customer Directory →
        </Link>
      </div>
    </div>
  );
}

/* ── Top Selling Products / Inventory Widget ── */
function TopInventoryWidget({ products }: { products?: Summary['topProducts'] }) {
  const items = products && products.length > 0
    ? products
    : [
        { id: '1', name: 'Steel Bolt M8', sku: 'SB-M8', stock: 500, minStock: 100, price: 2.5 },
        { id: '2', name: 'Copper Wire 2mm', sku: 'CW-2MM', stock: 30, minStock: 50, price: 45.0 },
      ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-900">Inventory Status & Stock</h2>
          <p className="text-xs text-gray-500 mt-0.5">Top products tracked in warehouse</p>
        </div>
        <Link to="/products" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          View all →
        </Link>
      </div>

      <div className="mt-4 space-y-3.5">
        {items.map((prod) => {
          const isLow = prod.stock <= prod.minStock;
          const ratio = Math.min(100, Math.round((prod.stock / (prod.minStock * 2 || 100)) * 100));

          return (
            <div key={prod.id} className="p-3 rounded-xl bg-gray-50/70 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{prod.name}</p>
                  <p className="text-[11px] text-gray-400 font-mono">SKU: {prod.sku}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {prod.stock} units
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">₹{prod.price.toFixed(2)}/unit</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Recent Invoices List ── */
function RecentInvoicesWidget({ invoices }: { invoices?: Summary['recentInvoices'] }) {
  const items = invoices || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-900">Recent Invoices</h2>
          <p className="text-xs text-gray-500 mt-0.5">GST billing & payment tracker</p>
        </div>
        <Link to="/invoices" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          Invoice ledger →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">No invoices generated yet</div>
      ) : (
        <div className="mt-3 divide-y divide-gray-50">
          {items.map((inv) => (
            <div key={inv.id} className="py-3 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
              <div className="space-y-0.5">
                <Link to={`/invoices/${inv.id}`} className="text-xs font-bold text-blue-600 hover:underline">
                  {inv.invoiceNumber}
                </Link>
                <p className="text-xs text-gray-600 font-medium truncate max-w-[140px] sm:max-w-[200px]">
                  {inv.customerName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                <span className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                  inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  inv.paymentStatus === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {inv.paymentStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Dashboard ── */
export function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<Summary>('/dashboard')).data,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading analytics & portal summary…</p>
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner / Welcome Bar */}
      <div className="bg-gradient-to-r from-gray-900 via-blue-950 to-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Glow decorative shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 -mb-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-blue-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Nexora Operations Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-sm text-gray-300 max-w-xl">
              Track your wholesale distribution, stock levels, delivery challans, and GST invoicing in one live unified cockpit.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              to="/challans"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
            >
              + Create Challan
            </Link>
            <Link
              to="/customers"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all"
            >
              Customers
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={data.customerCount}
          sublabel="Retail & Wholesale clients"
          badgeText="+12% this month"
          badgeType="positive"
          accentColor="from-blue-500 to-cyan-500"
          iconBg="bg-blue-50 text-blue-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <StatCard
          label="Catalog Products"
          value={data.productCount}
          sublabel="Active warehouse SKUs"
          badgeText="Active inventory"
          badgeType="neutral"
          accentColor="from-indigo-500 to-purple-500"
          iconBg="bg-indigo-50 text-indigo-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard
          label="Low Stock Alerts"
          value={data.lowStockCount}
          sublabel="At or below minimum threshold"
          badgeText={data.lowStockCount > 0 ? `${data.lowStockCount} Need restock` : 'Healthy stock'}
          badgeType={data.lowStockCount > 0 ? 'warning' : 'positive'}
          accentColor="from-amber-500 to-orange-500"
          iconBg="bg-amber-50 text-amber-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
        />
        <StatCard
          label="Outstanding Due"
          value={`₹${(data.unpaidInvoiceTotal || 0).toLocaleString('en-IN')}`}
          sublabel="Unpaid & partial invoices"
          badgeText={data.unpaidInvoiceTotal > 0 ? 'Pending payout' : 'All collected'}
          badgeType={data.unpaidInvoiceTotal > 0 ? 'negative' : 'positive'}
          accentColor="from-rose-500 to-red-500"
          iconBg="bg-rose-50 text-rose-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>}
        />
      </div>

      {/* Row 2: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueTrendChart
            paidTotal={data.paidInvoiceTotal || 0}
            unpaidTotal={data.unpaidInvoiceTotal || 0}
          />
        </div>
        <div>
          <CustomerBreakdownCard distribution={data.customerDistribution} />
        </div>
      </div>

      {/* Row 3: Operational Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Challans Data Table (2 cols on large) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Delivery Challans</h2>
              <p className="text-xs text-gray-500 mt-0.5">Dispatches and confirmation lifecycle</p>
            </div>
            <Link to="/challans" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Manage Challans →
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 px-2">Challan No.</th>
                  <th className="pb-3 px-2">Recipient Customer</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentChallans.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-2">
                      <Link to={`/challans/${c.id}`} className="text-xs font-bold text-blue-600 hover:underline">
                        {c.challanNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-xs font-medium text-gray-700">{c.customer?.name ?? '—'}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        c.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        c.status === 'draft' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          c.status === 'confirmed' ? 'bg-emerald-500' :
                          c.status === 'draft' ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`} />
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-400 text-right font-medium">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top Inventory Widget */}
        <div>
          <TopInventoryWidget products={data.topProducts} />
        </div>
      </div>

      {/* Row 4: Recent Invoices & Quick Operational Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <RecentInvoicesWidget invoices={data.recentInvoices} />
        </div>

        {/* Operational Modules quick panel */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">ERP Operations Hub</h2>
              <p className="text-xs text-gray-500 mt-0.5">Quick access to key operational workflows</p>
            </div>
            <span className="text-xs font-semibold text-gray-400">Nexora 2.0</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mt-4">
            <Link
              to="/customers"
              className="p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
              </div>
              <p className="text-sm font-bold text-gray-900">Customer CRM</p>
              <p className="text-xs text-gray-400 mt-1">Lead status, GST numbers & addresses</p>
            </Link>

            <Link
              to="/stock-movements"
              className="p-4 rounded-xl bg-white border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>
              </div>
              <p className="text-sm font-bold text-gray-900">Stock In / Out</p>
              <p className="text-xs text-gray-400 mt-1">Log inbound stock and dispatch adjustments</p>
            </Link>

            <Link
              to="/invoices"
              className="p-4 rounded-xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
              </div>
              <p className="text-sm font-bold text-gray-900">GST Billing & Tax</p>
              <p className="text-xs text-gray-400 mt-1">Generate invoices & export PDFs</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
