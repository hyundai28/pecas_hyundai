"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideSidebar =
    pathname.startsWith("/auth/sign-up") ||
    pathname.startsWith("/sso-callback") ||
    pathname.startsWith("/auth/login");

  const { user, loading } = useSupabaseUser();

  if (loading) return null;

  const role = user?.user_metadata?.role;
  const isAdmin = role === "admin";

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {!hideSidebar && <DashboardSidebar isAdmin={isAdmin} />}

      <main
        className={`flex-1 ${
          hideSidebar ? "" : "lg:ml-64"
        }`}
      >
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

