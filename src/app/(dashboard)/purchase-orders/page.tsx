"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";

type PurchaseOrder = {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  quotation: {
    rfq: { title: string };
    vendor: { name: string };
  };
  invoice: { id: string } | null;
};

export default function PurchaseOrdersPage() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPOs = async () => {
      try {
        const res = await fetch("/api/purchase-orders");
        if (res.ok) {
          const data = await res.json();
          setPos(data);
        }
      } catch (err) {
        console.error("Failed to fetch POs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPOs();
  }, []);

  const handleGenerateInvoice = async (poId: string) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseOrderId: poId }),
      });
      if (res.ok) {
        // Refresh POs
        const fetchPOs = async () => {
          const res = await fetch("/api/purchase-orders");
          if (res.ok) setPos(await res.json());
        };
        fetchPOs();
      } else {
        alert("Failed to generate invoice");
      }
    } catch {
      alert("An unexpected error occurred");
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Purchase Orders</h1>
          <p className="mt-2 text-sm text-gray-700">View and manage issued purchase orders.</p>
        </div>
      </div>

      <div className="flex flex-col shadow sm:rounded-lg">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFQ</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Loading...</td>
                    </tr>
                  ) : pos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No Purchase Orders found.</td>
                    </tr>
                  ) : (
                    pos.map((po) => (
                      <tr key={po.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {po.poNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.quotation.rfq.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.quotation.vendor.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${po.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(po.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {po.invoice ? (
                            <Link href={`/invoices/${po.invoice.id}`} className="text-green-600 hover:text-green-900">
                              View Invoice
                            </Link>
                          ) : (
                            session?.user?.role === "PROCUREMENT_OFFICER" ? (
                              <button
                                onClick={() => handleGenerateInvoice(po.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Generate Invoice
                              </button>
                            ) : (
                              <span className="text-gray-400">Pending Invoice</span>
                            )
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