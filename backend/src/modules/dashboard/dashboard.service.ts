import { prisma } from '../../lib/prisma';
import { AuthUser } from '../../types/express';

export async function summary(role: AuthUser['role']) {
  const [
    customerCount,
    productCount,
    lowStock,
    unpaid,
    recentChallans,
    paidInvoices,
    recentInvoices,
    topProducts,
    customersByType,
    stockMovements,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.product.count(),
    prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::int AS count FROM products WHERE current_stock <= min_stock_qty`,
    prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: { in: ['unpaid', 'partial'] } } }),
    prisma.challan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    }),
    prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'paid' } }),
    prisma.invoice.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: { currentStock: 'desc' },
      select: { id: true, name: true, sku: true, currentStock: true, minStockQty: true, unitPrice: true },
    }),
    prisma.customer.groupBy({
      by: ['type'],
      _count: { _all: true },
    }),
    prisma.stockMovement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, sku: true } } },
    }),
  ]);

  const base = {
    customerCount,
    productCount,
    lowStockCount: Number((lowStock as any)[0]?.count ?? 0),
    unpaidInvoiceTotal: Number(unpaid._sum.totalAmount ?? 0),
    paidInvoiceTotal: Number(paidInvoices._sum.totalAmount ?? 0),
    recentChallans,
    recentInvoices: recentInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.name ?? '—',
      totalAmount: Number(inv.totalAmount),
      paymentStatus: inv.paymentStatus,
      createdAt: inv.createdAt,
    })),
    topProducts: topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.currentStock,
      minStock: p.minStockQty,
      price: Number(p.unitPrice),
    })),
    customerDistribution: customersByType.map((c) => ({
      type: c.type,
      count: c._count._all,
    })),
    recentStockMovements: stockMovements.map((m) => ({
      id: m.id,
      productName: m.product?.name ?? 'Unknown',
      sku: m.product?.sku ?? '',
      quantity: m.quantity,
      type: m.type,
      createdAt: m.createdAt,
    })),
  };

  return { role, ...base };
}
