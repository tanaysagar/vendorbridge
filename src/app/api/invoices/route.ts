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
      whereClause = { purchaseOrder: { quotation: { vendorId: session.user.vendorId } } };
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        purchaseOrder: {
          include: {
            quotation: {
              include: {
                vendor: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ message: 'Error fetching Invoices' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PROCUREMENT_OFFICER') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { purchaseOrderId } = await req.json();

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { quotation: { include: { rfq: true } } }
    });

    if (!po) {
      return NextResponse.json({ message: 'Purchase Order not found' }, { status: 404 });
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { purchaseOrderId }
    });

    if (existingInvoice) {
      return NextResponse.json({ message: 'Invoice already exists for this PO' }, { status: 400 });
    }

    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        purchaseOrderId,
        status: "GENERATED",
        dueDate
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "Invoice Generated",
        details: `Invoice ${invoiceNumber} generated for PO ${po.poNumber}`,
        rfqId: po.quotation.rfqId,
        userId: session.user.id
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating Invoice' }, { status: 500 });
  }
}