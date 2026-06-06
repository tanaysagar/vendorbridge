import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrder: {
          include: {
            quotation: {
              include: {
                vendor: true,
                rfq: true,
                items: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ message: 'Error fetching Invoice' }, { status: 500 });
  }
}