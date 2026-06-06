"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type RFQItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
};

type RFQ = {
  id: string;
  title: string;
  description: string;
  items: RFQItem[];
};

export default function SubmitQuotationPage() {
  const router = useRouter();
  const { rfqId } = useParams();

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [deliveryTimeline, setDeliveryTimeline] = useState("");
  const [notes, setNotes] = useState("");
  const [itemPrices, setItemPrices] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchRfq = async () => {
      try {
        const res = await fetch(`/api/rfqs/${rfqId}`);
        if (res.ok) {
          const data = await res.json();
          setRfq(data);

          const initialPrices: { [key: string]: number } = {};
          data.items.forEach((item: RFQItem) => {
            initialPrices[item.id] = 0;
          });
          setItemPrices(initialPrices);
        } else {
          setError("Failed to load RFQ.");
        }
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    if (rfqId) fetchRfq();
  }, [rfqId]);

  const handlePriceChange = (itemId: string, value: string) => {
    setItemPrices(prev => ({
      ...prev,
      [itemId]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!rfq) return;

    const formattedItems = rfq.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: itemPrices[item.id]
    }));

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: rfq.id,
          deliveryTimeline,
          notes,
          items: formattedItems,
        }),
      });

      if (res.ok) {
        router.push("/quotations");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to submit quotation.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (!rfq) return <div className="text-center p-8 text-red-500">RFQ not found.</div>;

  const totalAmount = rfq.items.reduce((sum, item) => sum + (item.quantity * (itemPrices[item.id] || 0)), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Submit Quotation
        </h2>
        <p className="mt-1 text-sm text-gray-500">Responding to: <span className="font-medium text-gray-900">{rfq.title}</span></p>
      </div>

      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">RFQ Description</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{rfq.description || "No description provided."}</p>
      </div>

      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Pricing Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price ($)</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Price ($)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rfq.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={itemPrices[item.id] || ""}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {(item.quantity * (itemPrices[item.id] || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-gray-900 uppercase">Grand Total:</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      ${totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Delivery Timeline (e.g. 2 weeks, By Oct 1st)</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={deliveryTimeline}
                  onChange={(e) => setDeliveryTimeline(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Additional Notes / Comments</label>
              <div className="mt-1">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
            </div>
          </div>

          <div className="pt-5 flex justify-end space-x-3 border-t border-gray-200 mt-8">
            <Link
              href="/rfqs"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Quotation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}