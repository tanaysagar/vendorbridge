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
    const rfq = await prisma.rFQ.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        vendors: {
          include: { vendor: true }
        },
        quotations: {
          include: {
            vendor: true,
            items: true
          }
        }
      }
    });

    if (!rfq) {
      return NextResponse.json({ message: 'RFQ not found' }, { status: 404 });
    }

    return NextResponse.json(rfq);
  } catch {
    return NextResponse.json({ message: 'Error fetching RFQ' }, { status: 500 });
  }
}