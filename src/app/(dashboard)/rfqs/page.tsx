"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

type RFQ = {
  id: string;
  title: string;
  deadline: string;
  status: string;
  createdAt: string;
  _count?: {
    quotations: number;
  };
};

export default function RFQsPage() {
  const { data: session } = useSession();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        const res = await fetch("/api/rfqs");
        if (res.ok) {
          const data = await res.json();
          setRfqs(data);
        }
      } catch (err) {
        console.error("Failed to fetch RFQs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRfqs();
  }, []);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Request for Quotations (RFQs)</h1>
          <p className="mt-2 text-sm text-gray-700">Manage all active and past procurement requests.</p>
        </div>
        {session?.user?.role === "PROCUREMENT_OFFICER" && (
          <div className="mt-4 sm:mt-0">
            <Link
              href="/rfqs/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Create RFQ
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col shadow sm:rounded-lg">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Loading...</td>
                    </tr>
                  ) : rfqs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No RFQs found.</td>
                    </tr>
                  ) : (
                    rfqs.map((rfq) => (
                      <tr key={rfq.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{rfq.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{format(new Date(rfq.createdAt), 'MMM dd, yyyy')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{format(new Date(rfq.deadline), 'MMM dd, yyyy')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              rfq.status === "OPEN"
                                ? "bg-green-100 text-green-800"
                                : rfq.status === "CLOSED"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {rfq.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {session?.user?.role === "PROCUREMENT_OFFICER" ? (
                            <Link href={`/rfqs/${rfq.id}/compare`} className="text-blue-600 hover:text-blue-900">
                              View Responses
                            </Link>
                          ) : (
                            <Link href={`/quotations/${rfq.id}/submit`} className="text-blue-600 hover:text-blue-900">
                              View RFQ
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}