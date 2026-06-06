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
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      }
    });
    return NextResponse.json(vendors);
  } catch {
    return NextResponse.json({ message: 'Error fetching vendors' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'PROCUREMENT_OFFICER')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, category, gstNumber, contactName, email, phone } = await req.json();

    const vendor = await prisma.vendor.create({
      data: {
        name,
        category,
        gstNumber,
        contactName,
        email,
        phone,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Error creating vendor' }, { status: 500 });
  }
}