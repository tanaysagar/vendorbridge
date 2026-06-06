"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

type RFQ = {
  id: string;
  title: string;
  description: string;
  status: string;
  items: { id: string; description: string; quantity: number }[];
  quotations: {
    id: string;
    totalAmount: number;
    deliveryTimeline: string;
    notes: string;
    status: string;
    vendor: { name: string };
    items: { description: string; unitPrice: number; totalPrice: number }[];
  }[];
};

export default function CompareQuotationsPage() {
  const { rfqId } = useParams();
  const router = useRouter();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    const fetchRfq = async () => {
      try {
        const res = await fetch(`/api/rfqs/${rfqId}`);
        if (res.ok) {
          const data = await res.json();
          setRfq(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (rfqId) fetchRfq();
  }, [rfqId]);

  const handleApprove = async (quotationId: string) => {
    setApproving(quotationId);
    try {
      const res = await fetch(`/api/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId, status: "PENDING", remarks: "Initiated from comparison view" }),
      });
      if (res.ok) {
        router.push("/approvals");
        router.refresh();
      } else {
        alert("Failed to initiate approval");
      }
    } catch {
      alert("Error initiating approval");
    } finally {
      setApproving(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!rfq) return <div className="p-8 text-center text-red-500">RFQ not found.</div>;

  const lowestPrice = Math.min(...rfq.quotations.map((q) => q.totalAmount));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Compare Quotations
          </h2>
          <p className="mt-1 text-sm text-gray-500">RFQ: <span className="font-medium text-gray-900">{rfq.title}</span></p>
        </div>
        <Link
          href="/rfqs"
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to RFQs
        </Link>
      </div>

      {rfq.quotations.length === 0 ? (
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 text-center text-gray-500">
          No quotations have been submitted for this RFQ yet.
        </div>
      ) : (
        <div className="bg-white shadow overflow-x-auto sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Criteria
                </th>
                {rfq.quotations.map((quotation, idx) => (
                  <th key={quotation.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider border-r border-gray-200">
                    Vendor {idx + 1}: {quotation.vendor.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Total Amount Row */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                  Total Amount
                </td>
                {rfq.quotations.map((quotation) => (
                  <td key={`total-${quotation.id}`} className={`px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 ${quotation.totalAmount === lowestPrice ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center">
                      <span className={`font-bold ${quotation.totalAmount === lowestPrice ? 'text-green-700' : 'text-gray-900'}`}>
                        ${quotation.totalAmount.toFixed(2)}
                      </span>
                      {quotation.totalAmount === lowestPrice && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Lowest Price
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Delivery Timeline Row */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                  Delivery Timeline
                </td>
                {rfq.quotations.map((quotation) => (
                  <td key={`delivery-${quotation.id}`} className="px-6 py-4 text-sm text-gray-700 border-r border-gray-200">
                    {quotation.deliveryTimeline || "-"}
                  </td>
                ))}
              </tr>

              {/* Notes Row */}
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50 align-top">
                  Notes
                </td>
                {rfq.quotations.map((quotation) => (
                  <td key={`notes-${quotation.id}`} className="px-6 py-4 text-sm text-gray-700 border-r border-gray-200 whitespace-pre-wrap">
                    {quotation.notes || "-"}
                  </td>
                ))}
              </tr>

              {/* Action Row */}
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                  Action
                </td>
                {rfq.quotations.map((quotation) => (
                  <td key={`action-${quotation.id}`} className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200">
                    {quotation.status === "APPROVED" ? (
                      <span className="inline-flex items-center text-green-600 font-medium">
                        <CheckCircle className="w-5 h-5 mr-1" /> Approved
                      </span>
                    ) : quotation.status === "REJECTED" ? (
                      <span className="text-red-600 font-medium">Rejected</span>
                    ) : (
                      <button
                        onClick={() => handleApprove(quotation.id)}
                        disabled={approving === quotation.id || rfq.status === "CLOSED"}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {approving === quotation.id ? "Processing..." : "Select for Approval"}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}