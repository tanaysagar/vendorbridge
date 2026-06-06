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
    const rfqs = await prisma.rFQ.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        vendors: {
          include: { vendor: true }
        }
      }
    });
    return NextResponse.json(rfqs);
  } catch {
    return NextResponse.json({ message: 'Error fetching RFQs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PROCUREMENT_OFFICER') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { title, description, deadline, items, vendorIds } = await req.json();

    const rfq = await prisma.rFQ.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        status: "OPEN",
        items: {
          create: items.map((item: { description: string, quantity: number, unit: string }) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit
          }))
        },
        vendors: {
          create: vendorIds.map((vendorId: string) => ({
            vendor: { connect: { id: vendorId } }
          }))
        }
      },
      include: {
        items: true,
        vendors: true
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "RFQ Created",
        details: `RFQ "${title}" was created.`,
        rfqId: rfq.id,
        userId: session.user.id
      }
    });

    return NextResponse.json(rfq, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating RFQ' }, { status: 500 });
  }
}