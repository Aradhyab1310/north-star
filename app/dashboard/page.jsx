"use client";

import { useEffect, useState } from "react";
// keep your current import path; you used "@/lib/supabase/client"
import { supabase } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  async function fetchCourses() {
    setErr("");
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    else setCourses(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  async function addCourse(e) {
    e.preventDefault();
    setErr("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setErr("Not logged in");

    const { error } = await supabase.from("courses").insert({
      user_id: user.id,
      name: name || "Untitled Course",
      code: code || null,
      color: "#6366f1",
      term: "Fall 2025",
    });
    if (error) return setErr(error.message);

    setName(""); setCode("");
    fetchCourses(); // refresh list
  }

  if (loading) return <div>Loading…</div>;
  if (err) return <div className="text-rose-600">Error: {err}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Quick add (temporary dev form) */}
      <form onSubmit={addCourse} className="flex gap-2">
        <input
          className="rounded border px-3 py-2"
          placeholder="Course name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Code (e.g., CS101)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="rounded bg-black text-white px-3 py-2">
          Add Course
        </button>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <li key={c.id} className="rounded border p-3">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-zinc-500">{c.code || "—"}</div>
          </li>
        ))}
      </ul>

      {courses.length === 0 && <p>No courses yet — add one above.</p>}
    </div>
  );
}
