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
    const approvals = await prisma.approval.findMany({
      include: {
        quotation: {
          include: {
            rfq: true,
            vendor: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(approvals);
  } catch {
    return NextResponse.json({ message: 'Error fetching approvals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'PROCUREMENT_OFFICER' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { quotationId, status, remarks } = await req.json();

    if (status === "APPROVED" || status === "REJECTED") {
      // This is a manager updating an existing approval request
      if (session.user.role !== 'MANAGER') {
        return NextResponse.json({ message: 'Only Managers can approve/reject' }, { status: 403 });
      }

      const existingApproval = await prisma.approval.findUnique({
        where: { quotationId }
      });

      if (!existingApproval) {
        return NextResponse.json({ message: 'Approval request not found' }, { status: 404 });
      }

      const approval = await prisma.approval.update({
        where: { id: existingApproval.id },
        data: {
          status,
          remarks,
          approvedBy: session.user.id
        }
      });

      await prisma.quotation.update({
        where: { id: quotationId },
        data: { status }
      });

      await prisma.activityLog.create({
        data: {
          action: `Quotation ${status}`,
          details: `Manager ${status.toLowerCase()} quotation ${quotationId}`,
          userId: session.user.id
        }
      });

      return NextResponse.json(approval, { status: 200 });

    } else {
      // This is a procurement officer initiating a new approval request
      if (session.user.role !== 'PROCUREMENT_OFFICER') {
        return NextResponse.json({ message: 'Only Procurement Officers can initiate approvals' }, { status: 403 });
      }

      const approval = await prisma.approval.create({
        data: {
          quotationId,
          status: "PENDING",
          remarks: remarks || "Initiated from comparison view"
        }
      });

      await prisma.activityLog.create({
        data: {
          action: "Approval Requested",
          details: `Approval requested for quotation ${quotationId}`,
          userId: session.user.id
        }
      });

      return NextResponse.json(approval, { status: 201 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error processing approval' }, { status: 500 });
  }
}