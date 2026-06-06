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
      whereClause = { quotation: { vendorId: session.user.vendorId } };
    }

    const pos = await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        quotation: {
          include: {
            rfq: true,
            vendor: true
          }
        },
        invoice: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(pos);
  } catch {
    return NextResponse.json({ message: 'Error fetching POs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PROCUREMENT_OFFICER') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { quotationId } = await req.json();

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { rfq: true }
    });

    if (!quotation) {
      return NextResponse.json({ message: 'Quotation not found' }, { status: 404 });
    }

    if (quotation.status !== "APPROVED") {
      return NextResponse.json({ message: 'Quotation must be approved first' }, { status: 400 });
    }

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { quotationId }
    });

    if (existingPO) {
      return NextResponse.json({ message: 'PO already exists for this quotation' }, { status: 400 });
    }

    // Calculations
    const subtotal = quotation.totalAmount;
    const tax = subtotal * 0.10; // 10% example tax
    const totalAmount = subtotal + tax;

    const poNumber = `PO-${Math.floor(100000 + Math.random() * 900000)}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        quotationId,
        subtotal,
        tax,
        totalAmount,
        status: "ISSUED"
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "Purchase Order Generated",
        details: `PO ${poNumber} generated for RFQ ${quotation.rfq.title}`,
        rfqId: quotation.rfqId,
        userId: session.user.id
      }
    });

    return NextResponse.json(po, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating PO' }, { status: 500 });
  }
}