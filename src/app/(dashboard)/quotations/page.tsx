"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

type Quotation = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  rfq: {
    title: string;
  };
  vendor: {
    name: string;
  };
};

export default function QuotationsPage() {
  const { data: session } = useSession();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await fetch("/api/quotations");
        if (res.ok) {
          const data = await res.json();
          setQuotations(data);
        }
      } catch (err) {
        console.error("Failed to fetch Quotations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotations();
  }, []);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quotations</h1>
          <p className="mt-2 text-sm text-gray-700">Manage submitted quotations for procurement requests.</p>
        </div>
      </div>

      <div className="flex flex-col shadow sm:rounded-lg">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFQ Title</th>
                    {session?.user?.role !== "VENDOR" && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Loading...</td>
                    </tr>
                  ) : quotations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No quotations found.</td>
                    </tr>
                  ) : (
                    quotations.map((quotation) => (
                      <tr key={quotation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{quotation.rfq.title}</div>
                        </td>
                        {session?.user?.role !== "VENDOR" && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{quotation.vendor.name}</div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${quotation.totalAmount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{format(new Date(quotation.createdAt), 'MMM dd, yyyy')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              quotation.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : quotation.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {quotation.status}
                          </span>
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