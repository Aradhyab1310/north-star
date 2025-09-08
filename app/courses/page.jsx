"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import CourseCard from "@/components/courses/CourseCard";
import CourseForm from "@/components/courses/CourseForm";
import Link from "next/link";


const supabase = getSupabase();

/* -------------------------
   Term helpers (Fall 2025)
   ------------------------- */
const TERM_WINDOWS = {
  winter: { start: [1, 1], end: [4, 30] },   // Jan 1 – Apr 30
  spring: { start: [1, 15], end: [4, 30] },  // (alt spelling some schools use)
  summer: { start: [5, 1], end: [8, 31] },   // May 1 – Aug 31
  fall:   { start: [9, 1], end: [12, 31] },  // Sep 1 – Dec 31
};

function parseTerm(term) {
  if (!term) return null;
  const m = String(term).trim().match(/(winter|spring|summer|fall)\s+(\d{4})/i);
  if (!m) return null;
  const season = m[1].toLowerCase();
  const year = Number(m[2]);
  const win = TERM_WINDOWS[season] || TERM_WINDOWS.spring;

  const start = new Date(Date.UTC(year, win.start[0] - 1, win.start[1]));
  const end   = new Date(Date.UTC(year, win.end[0] - 1, win.end[1], 23, 59, 59));
  return { start, end };
}

function bucketByTerm(course, now = new Date()) {
  if (course.archived) return "archived";
  const rng = parseTerm(course.term);
  if (!rng) return "all";            // unknown term -> keep under All
  if (now < rng.start) return "future";
  if (now > rng.end) return "all";   // past -> still in All (not archived)
  return "inprogress";
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // UI state
  const [view, setView] = useState("all"); // all | inprogress | future | archived
  const [q, setQ] = useState("");

  async function fetchCourses() {
    setErr("");
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    setCourses(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  const visible = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    return courses.filter((c) => {
      // search by name/code
      const hits =
        !qlc ||
        c.name?.toLowerCase().includes(qlc) ||
        c.code?.toLowerCase().includes(qlc);
      if (!hits) return false;

      // bucket by term/archive
      const bucket = bucketByTerm(c);
      if (view === "all")
        return bucket === "all" || bucket === "inprogress" || bucket === "future";
      if (view === "archived") return bucket === "archived";
      if (view === "future") return bucket === "future";
      if (view === "inprogress") return bucket === "inprogress";
      return true;
    });
  }, [courses, q, view]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-rose-600">Error: {err}</div>;

  return (
    <div className="space-y-6">
      {/* Header + controls */}
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Courses</h1>
          <CourseForm onSaved={fetchCourses} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <input
            className="rounded-full border px-4 py-2 input-accent"
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          {/* Filter pills */}
          <div className="flex items-center gap-2">
            {["all", "inprogress", "future", "archived"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`pill ${view === v ? "pill-active" : ""}`}
              >
                {v === "all"
                  ? "All"
                  : v === "inprogress"
                  ? "In progress"
                  : v === "future"
                  ? "Future"
                  : "Archived"}
              </button>
            ))}
          </div>

        </div>
      </header>

      {/* List / empty */}
      {visible.length === 0 ? (
        <div className="grid place-items-center rounded border bg-white p-10 text-center">
          <div className="text-lg font-medium">
            {view === "archived"
              ? "No archived courses."
              : view === "future"
              ? "No future courses."
              : view === "inprogress"
              ? "No in-progress courses."
              : "No courses yet."}
          </div>
          {view !== "archived" && (
            <p className="mt-1 text-sm text-zinc-500">
              Add your first course to get started.
            </p>
          )}
        </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((c) => (
                <li key={c.id}>
                  <Link href={`/courses/${c.id}`} className="block transition hover:-translate-y-0.5 hover:shadow-md">
                      <CourseCard course={c} onRefresh={fetchCourses} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
  );
}
