"use client";

import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex-1"></div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">
            {session?.user?.name} ({session?.user?.role})
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}