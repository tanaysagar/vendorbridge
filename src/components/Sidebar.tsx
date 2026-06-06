"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  CheckSquare,
  ShoppingCart,
  FileText as FileInvoice,
  History,
  BarChart,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Vendors", href: "/vendors", icon: Users },
  { name: "RFQs", href: "/rfqs", icon: FileText },
  { name: "Quotations", href: "/quotations", icon: MessageSquare },
  { name: "Approvals", href: "/approvals", icon: CheckSquare },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
  { name: "Invoices", href: "/invoices", icon: FileInvoice },
  { name: "Activity Logs", href: "/logs", icon: History },
  { name: "Reports & Analytics", href: "/reports", icon: BarChart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-full">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <span className="text-xl font-bold text-gray-800">VendorBridge</span>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? "text-blue-700" : "text-gray-400"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}