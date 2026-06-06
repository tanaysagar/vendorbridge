"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Printer, Download, Mail } from "lucide-react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  purchaseOrder: {
    poNumber: string;
    subtotal: number;
    tax: number;
    totalAmount: number;
    quotation: {
      rfq: { title: string };
      vendor: { name: string; email: string; phone: string; gstNumber: string };
      items: { description: string; quantity: number; unitPrice: number; totalPrice: number }[];
    };
  };
};

export default function InvoiceViewPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice?.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    }
  };

  const handleSendEmail = () => {
    alert(`Mock: Invoice emailed to ${invoice?.purchaseOrder.quotation.vendor.email}`);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found.</div>;

  const vendor = invoice.purchaseOrder.quotation.vendor;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Link href="/invoices" className="text-sm font-medium text-gray-500 hover:text-gray-700">
          &larr; Back to Invoices
        </Link>
        <div className="flex space-x-3">
          <button onClick={handlePrint} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Printer className="w-4 h-4 mr-2" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" /> PDF
          </button>
          <button onClick={handleSendEmail} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <Mail className="w-4 h-4 mr-2" /> Email Vendor
          </button>
        </div>
      </div>

      <div ref={invoiceRef} className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200 print:shadow-none print:border-none">
        {/* Invoice Header */}
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50 flex justify-between items-start">
          <div>
            <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-1">INVOICE</h3>
            <p className="text-sm text-gray-500">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">VendorBridge ERP</h2>
            <p className="text-sm text-gray-500">123 Procurement Way, Business City</p>
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="px-4 py-5 sm:p-6 grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Bill To:</h4>
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-lg">{vendor.name}</p>
              <p>{vendor.email}</p>
              <p>{vendor.phone || "No phone provided"}</p>
              {vendor.gstNumber && <p>GST: {vendor.gstNumber}</p>}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="grid grid-cols-2 gap-2 justify-end">
              <span className="font-medium text-gray-500">Issue Date:</span>
              <span className="text-gray-900">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</span>

              <span className="font-medium text-gray-500">Due Date:</span>
              <span className="text-gray-900">{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '-'}</span>

              <span className="font-medium text-gray-500">PO Number:</span>
              <span className="text-gray-900">{invoice.purchaseOrder.poNumber}</span>

              <span className="font-medium text-gray-500">RFQ Ref:</span>
              <span className="text-gray-900 truncate" title={invoice.purchaseOrder.quotation.rfq.title}>
                {invoice.purchaseOrder.quotation.rfq.title}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-4 py-5 sm:p-6">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.purchaseOrder.quotation.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-4 py-5 sm:p-6 flex justify-end">
          <div className="w-64 space-y-3 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal:</span>
              <span className="text-gray-900">${invoice.purchaseOrder.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 pb-3 border-b border-gray-200">
              <span>Tax (10%):</span>
              <span className="text-gray-900">${invoice.purchaseOrder.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-1">
              <span>Total:</span>
              <span>${invoice.purchaseOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200 text-center text-xs text-gray-500">
          Thank you for your business. Please process payment by the due date.
        </div>
      </div>
    </div>
  );
}