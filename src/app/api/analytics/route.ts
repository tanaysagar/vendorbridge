import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Basic Spending Data (Using Purchase Orders total amounts by month)
    const pos = await prisma.purchaseOrder.findMany({
      where: { status: { in: ['ISSUED', 'COMPLETED'] } },
      select: { totalAmount: true, createdAt: true }
    });

    const monthlySpending: { [key: string]: number } = {};
    pos.forEach(po => {
      const month = po.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlySpending[month]) monthlySpending[month] = 0;
      monthlySpending[month] += po.totalAmount;
    });

    const formattedMonthly = Object.keys(monthlySpending).sort().map(month => ({
      name: month,
      total: monthlySpending[month]
    }));

    // Overview Stats
    const totalRfqs = await prisma.rFQ.count();
    const activeVendors = await prisma.vendor.count({ where: { status: 'ACTIVE' } });
    const totalSpend = pos.reduce((sum, po) => sum + po.totalAmount, 0);

    return NextResponse.json({
      monthlySpending: formattedMonthly,
      overview: {
        totalRfqs,
        activeVendors,
        totalSpend
      }
    });

  } catch {
    return NextResponse.json({ message: 'Error fetching analytics' }, { status: 500 });
  }
}