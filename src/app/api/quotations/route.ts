import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    let whereClause = {};

    if (session.user.role === 'VENDOR') {
      whereClause = { vendorId: session.user.vendorId };
    }

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      include: {
        rfq: true,
        vendor: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(quotations);
  } catch {
    return NextResponse.json({ message: 'Error fetching quotations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'VENDOR') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { rfqId, deliveryTimeline, notes, items } = await req.json();

    const vendorId = session.user.vendorId;

    if (!vendorId) {
      return NextResponse.json({ message: 'User is not associated with a vendor' }, { status: 400 });
    }

    let totalAmount = 0;
    const quotationItems = items.map((item: { description: string, quantity: number, unitPrice: number }) => {
      const totalPrice = item.quantity * item.unitPrice;
      totalAmount += totalPrice;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      };
    });

    const quotation = await prisma.quotation.create({
      data: {
        rfqId,
        vendorId,
        status: "SUBMITTED",
        deliveryTimeline,
        notes,
        totalAmount,
        items: {
          create: quotationItems
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "Quotation Submitted",
        details: `Quotation for RFQ submitted by vendor ${vendorId}.`,
        rfqId: rfqId,
        userId: session.user.id
      }
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error submitting quotation' }, { status: 500 });
  }
}