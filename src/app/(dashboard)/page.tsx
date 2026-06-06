import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { FileText, Users, ShoppingCart, CheckSquare, History } from "lucide-react";

export default async function Dashboard() {
  await getServerSession(authOptions);

  // Stats
  const activeRfqsCount = await prisma.rFQ.count({ where: { status: "OPEN" } });
  const pendingApprovalsCount = await prisma.approval.count({ where: { status: "PENDING" } });
  const totalVendors = await prisma.vendor.count();
  const recentPOsCount = await prisma.purchaseOrder.count({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
  });

  // Recent Activity
  const recentLogs = await prisma.activityLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard overview</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">Active RFQs</dt>
              <dd className="text-2xl font-semibold text-gray-900">{activeRfqsCount}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <CheckSquare className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">Pending Approvals</dt>
              <dd className="text-2xl font-semibold text-gray-900">{pendingApprovalsCount}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">New POs (30d)</dt>
              <dd className="text-2xl font-semibold text-gray-900">{recentPOsCount}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Vendors</dt>
              <dd className="text-2xl font-semibold text-gray-900">{totalVendors}</dd>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link href="/rfqs/new" className="block w-full text-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Create New RFQ
            </Link>
            <Link href="/vendors/new" className="block w-full text-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Register New Vendor
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentLogs.map((log, logIdx) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {logIdx !== recentLogs.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          <History className="h-4 w-4 text-gray-500" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {log.action} <span className="font-medium text-gray-900">{log.details}</span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {recentLogs.length === 0 && (
                <p className="text-sm text-gray-500">No recent activity.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}