"use client";
import { useSession } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import SidebarLayout from "@/components/Sidebar";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!loading && !session && !isPublic) {
      router.replace("/login");
    }
  }, [loading, session, isPublic, router]);

  if (!isPublic) {
    if (loading) return <div className="p-6">Checking session…</div>;
    if (!session) return null; // redirecting
    return <SidebarLayout>{children}</SidebarLayout>;
  }

  // Public routes: no sidebar (landing/login/signup)
  return <>{children}</>;
}
