"use client";

import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function LandingPage() {
  async function loginDemo() {
    const { error } = await supabase.auth.signInWithPassword({
      email: "demo@example.com",
      password: "123456",
    });
    if (error) alert("Demo login failed: " + error.message);
    else window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            North Star
          </Link>
          <nav className="flex items-center gap-2">
            <button
              onClick={loginDemo}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Try Demo
            </button>
            <Link
              href="/signup"
              className="rounded-md bg-zinc-900 text-white px-3 py-1.5 text-sm hover:opacity-90"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid gap-12 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Plan smarter. <span className="text-zinc-500">Study calmer.</span>
            </h1>
            <p className="text-zinc-600 text-lg leading-relaxed">
              North Star is a minimal academic planner for courses, assignments,
              class sessions, and focused study—built for speed and clarity.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loginDemo}
                className="rounded-md bg-zinc-900 text-white px-5 py-2.5 hover:opacity-90"
              >
                Try the demo
              </button>
              <Link
                href="/signup"
                className="rounded-md border px-5 py-2.5 hover:bg-zinc-50"
              >
                Create free account
              </Link>
            </div>
            <p className="text-sm text-zinc-500">
              No spam. You can delete your data anytime.
            </p>
          </div>

          {/* Illustration card / screenshot placeholder */}
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="aspect-[16/10] bg-zinc-100 grid place-items-center">
              <div className="text-zinc-400 text-sm">
                Screenshot / Illustration
              </div>
            </div>
            <div className="p-4 text-sm text-zinc-600 border-t">
              Preview of the dashboard with courses, tasks, and focus timer.
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
          <h2 className="text-xl font-semibold mb-6">Why you’ll like it</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Feature icon="📚" title="Courses">
              Organize classes by color, term, and schedule.
            </Feature>
            <Feature icon="✅" title="Assignments">
              Fast add, filter by course, due date & priority.
            </Feature>
            <Feature icon="⏱️" title="Focus Mode">
              Lightweight timer that logs real study time.
            </Feature>
            <Feature icon="📅" title="Calendar">
              See tasks + class sessions together (drag & drop).
            </Feature>
          </ul>
        </section>

        {/* CTA strip */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-xl border bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Ready to get organized?</h3>
              <p className="text-sm text-zinc-500">
                Jump into the demo or create an account in seconds.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loginDemo}
                className="rounded-md bg-zinc-900 text-white px-4 py-2 hover:opacity-90"
              >
                Try Demo
              </button>
              <Link
                href="/signup"
                className="rounded-md border px-4 py-2 hover:bg-zinc-50"
              >
                Sign up
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} North Star</span>
          <span>Made by Aradhya Banerjee</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, children }) {
  return (
    <li className="rounded-xl border bg-white p-5 shadow-sm hover:shadow transition-shadow">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600">{children}</p>
    </li>
  );
}
