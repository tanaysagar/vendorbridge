"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { History } from "lucide-react";

type ActivityLog = {
  id: string;
  action: string;
  details: string;
  createdAt: string;
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/logs");
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch Logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activity Logs</h1>
          <p className="mt-2 text-sm text-gray-700">Audit trail of all actions performed in the ERP.</p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <li className="p-4 text-center text-sm text-gray-500">Loading...</li>
          ) : logs.length === 0 ? (
            <li className="p-4 text-center text-sm text-gray-500">No activity logs found.</li>
          ) : (
            logs.map((log) => (
              <li key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <span className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <History className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {log.action}
                    </p>
                    <p className="text-sm text-gray-500">
                      {log.details}
                    </p>
                  </div>
                  <div className="flex-shrink-0 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}