"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

type Approval = {
  id: string;
  status: string;
  remarks: string | null;
  createdAt: string;
  quotation: {
    id: string;
    totalAmount: number;
    rfq: { title: string };
    vendor: { name: string };
  };
};

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [remarks, setRemarks] = useState("");
  const [processingStatus, setProcessingStatus] = useState<"APPROVED" | "REJECTED" | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await fetch("/api/approvals");
      if (res.ok) {
        const data = await res.json();
        setApprovals(data);
      }
    } catch (err) {
      console.error("Failed to fetch approvals", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedApproval) return;
    setProcessingStatus(status);

    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId: selectedApproval.quotation.id,
          status,
          remarks
        })
      });

      if (res.ok) {
        setSelectedApproval(null);
        setRemarks("");
        fetchApprovals();
      } else {
        alert("Action failed.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setProcessingStatus(null);
    }
  };

  const handleGeneratePO = async (quotationId: string) => {
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId }),
      });
      if (res.ok) {
        alert("Purchase Order successfully generated!");
        window.location.href = "/purchase-orders";
      } else {
        const data = await res.json();
        alert(data.message || "Failed to generate PO");
      }
    } catch {
      alert("An error occurred generating PO");
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Approvals</h1>
          <p className="mt-2 text-sm text-gray-700">Review and manage procurement requests pending approval.</p>
        </div>
      </div>

      <div className="flex flex-col shadow sm:rounded-lg">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFQ</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Loading...</td>
                    </tr>
                  ) : approvals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No pending approvals.</td>
                    </tr>
                  ) : (
                    approvals.map((approval) => (
                      <tr key={approval.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{approval.quotation.rfq.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{approval.quotation.vendor.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${approval.quotation.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              approval.status === "APPROVED" ? "bg-green-100 text-green-800"
                              : approval.status === "REJECTED" ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {approval.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(approval.createdAt), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {session?.user?.role === "MANAGER" ? (
                            approval.status === "PENDING" ? (
                              <button
                                onClick={() => setSelectedApproval(approval)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Review
                              </button>
                            ) : (
                              <span className="text-gray-400">Reviewed</span>
                            )
                          ) : session?.user?.role === "PROCUREMENT_OFFICER" && approval.status === "APPROVED" ? (
                            <button
                                onClick={() => handleGeneratePO(approval.quotation.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Generate PO
                              </button>
                          ) : (
                            <span className="text-gray-400">-</span>
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

      {selectedApproval && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Review Quotation Approval
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2"><strong>RFQ:</strong> {selectedApproval.quotation.rfq.title}</p>
                      <p className="text-sm text-gray-500 mb-2"><strong>Vendor:</strong> {selectedApproval.quotation.vendor.name}</p>
                      <p className="text-sm text-gray-500 mb-4"><strong>Total Amount:</strong> ${selectedApproval.quotation.totalAmount.toFixed(2)}</p>

                      <label className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
                      <textarea
                        rows={3}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Add your remarks here..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleAction("APPROVED")}
                  disabled={!!processingStatus}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {processingStatus === "APPROVED" ? "Processing..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("REJECTED")}
                  disabled={!!processingStatus}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {processingStatus === "REJECTED" ? "Processing..." : "Reject"}
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedApproval(null); setRemarks(""); }}
                  disabled={!!processingStatus}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}