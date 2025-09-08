"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MiniFocusBadge from "@/components/focus/MiniFocusBadge";
import ThemeToggle from "./theme/ThemeToggle";

export default function SidebarLayout({ children }) {
  const pathname = usePathname();

  const link = (href, label) => (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm ${
        pathname === href ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"
      }`}
    >
      {label}
    </Link>
  );

function Sidebar() {
  return (
    <aside className="border-r p-3">
      {/* …nav links… */}
      <div className="mt-3">
        <ThemeToggle compact />
      </div>
    </aside>
  );
}



  return (
    <div className="min-h-screen grid grid-cols-12">
      <aside className="col-span-3 lg:col-span-2 border-r">
        <div className="bg-zinc-900 text-white text-xs px-3 py-1">
          App layout (private)
        </div>
        <nav className="p-3 space-y-1">
          {link("/dashboard", "Dashboard")}
          {link("/tasks", "Assignments")}
          {link("/courses", "Courses")}
          {link("/focus", "Focus Mode")}
          {link("/settings", "Settings")}
          <MiniFocusBadge />
        </nav>
      </aside>
      <main className="col-span-9 lg:col-span-10 p-6">{children}</main>
    </div>
  );
}
