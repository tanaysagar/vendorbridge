"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, FileText, Users, DollarSign } from "lucide-react";

type AnalyticsData = {
  monthlySpending: { name: string; total: number }[];
  overview: {
    totalRfqs: number;
    activeVendors: number;
    totalSpend: number;
  };
};

export default function ReportsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch Analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const csvContent = "data:text/csv;charset=utf-8,Month,Total Spend\n" +
      data.monthlySpending.map(e => `${e.name},${e.total}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "procurement_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Error loading data.</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">Insights into procurement activities and spending.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Procurement Spend</dt>
            <dd className="text-2xl font-semibold text-gray-900">${data.overview.totalSpend.toFixed(2)}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">Total RFQs Created</dt>
            <dd className="text-2xl font-semibold text-gray-900">{data.overview.totalRfqs}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">Active Vendors</dt>
            <dd className="text-2xl font-semibold text-gray-900">{data.overview.activeVendors}</dd>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Monthly Spending Trend</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.monthlySpending}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="total" name="Spend ($)" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}