"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import TaskCalendar from "@/components/dashboard/TaskCalendar";

const supabase = getSupabase();

export default function DashboardPage() {
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const todayISO = toISO(new Date());

  async function fetchAll({ silent = false } = {}) {
    if (!silent) { setErr(""); setLoading(true); }
    const [c, t] = await Promise.all([
      supabase.from("courses").select("*").eq("archived", false).order("created_at", { ascending: false }).limit(6),
      supabase
        .from("tasks")
        .select("id,title,priority,due_date,due_time,course_id,status,created_at")
        .order("due_date", { ascending: true }).order("due_time", { ascending: true }),
    ]);
    if (c.error) setErr(c.error.message);
    if (t.error) setErr((e) => e || t.error.message);
    setCourses(c.data || []);
    setTasks(t.data || []);
    if (!silent) setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  // ----- Derived data -----
  const overdue = useMemo(() => {
    const today = startOfDay(new Date());
    return tasks
      .filter(t => t.due_date && startOfDay(new Date(t.due_date)) < today && t.status !== "done")
      .sort(sortByDateTime)
      .slice(0, 8);
  }, [tasks]);

  const thisWeek = useMemo(() => {
    const start = startOfWeek(new Date());  // Mon
    const end   = endOfWeek(new Date());    // Sun
    return tasks
      .filter(t => t.due_date && inRange(new Date(t.due_date), start, end) && t.status !== "done")
      .sort(sortByDateTime)
      .slice(0, 8);
  }, [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === "done").length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const dueToday = tasks.filter(t => t.due_date === todayISO).length;
    return { total, done, pct, dueToday };
  }, [tasks, todayISO]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-rose-600">Error: {err}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Courses + lanes + stats */}
        <section className="col-span-12 lg:col-span-7 space-y-6">
          {/* Courses grid (your existing cards) */}
          <div className="grid gap-3 sm:grid-cols-2">
  {courses.map((c) => (
    <Link
      key={c.id}
      href={`/courses/${c.id}`}
      className="block rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{c.name || "Untitled Course"}</div>
          <div className="text-xs text-zinc-500">
            {(c.code || "—")} · {c.term || "—"}
          </div>
        </div>
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ background: c.color || "#6366f1" }}
        />
      </div>
    </Link>
      ))}
    </div>


          {/* Lanes */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Lane title="Overdue" items={overdue} empty="Nothing overdue 🎉" />
            <Lane title="Due This Week" items={thisWeek} empty="No tasks due this week." />
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Tasks Done" value={`${stats.done}/${stats.total}`} sub={`${stats.pct}% complete`} />
            <StatCard label="Due Today" value={stats.dueToday} sub="Across all courses" />
            <StatCard label="Active Courses" value={courses.length} sub="(showing latest 6)" />
          </div>
        </section>

        {/* RIGHT: Calendar + Quick Add */}
        <aside className="col-span-12 lg:col-span-5 space-y-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
            <TaskCalendar tasks={tasks} />
          </div>

          <QuickAdd
            courses={courses}
            defaultDate={todayISO}
            onAdded={() => fetchAll({ silent: true })}
          />
        </aside>
      </div>
    </div>
  );
}

/* ================= Components ================= */

function Lane({ title, items, empty }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
        <Link href="/tasks" className="text-xs text-zinc-500 hover:underline">View all</Link>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-zinc-500">{empty}</div>
      ) : (
        <ul className="space-y-2">
          {items.map(t => <TaskRow key={t.id} task={t} />)}
        </ul>
      )}
    </div>
  );
}

function TaskRow({ task }) {
  return (
    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {task.title}
        </div>
        <div className="text-xs text-zinc-500">
          {formatDue(task.due_date, task.due_time)} • {task.priority}
        </div>
      </div>
      <Link
        href={`/tasks?focus=${encodeURIComponent(task.id)}`}
        className="text-xs text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300"
      >
        Open
      </Link>
    </li>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

/* ----- Quick Add (minimal, fast) ----- */
function QuickAdd({ onAdded, courses, defaultDate }) {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("none");
  const [date, setDate] = useState(defaultDate || toISO(new Date()));
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) return alert("Please enter a title.");
    if (!date) return alert("Please pick a due date.");

    setBusy(true);
    const { error } = await getSupabase().from("tasks").insert({
      title: title.trim(),
      description: "",
      course_id: courseId === "none" ? null : courseId,
      priority,
      status: "todo",
      type: "assignment",
      due_date: date,
      due_time: time || null,
    });
    setBusy(false);

    if (error) return alert("Failed: " + error.message);

    setTitle(""); setTime(""); setCourseId("none");
    onAdded?.();
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Quick Add</div>
      <div className="grid gap-2">
        <input
          className="rounded-lg border px-3 py-2"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="rounded-lg border px-3 py-2" value={date} onChange={(e)=>setDate(e.target.value)} />
          <input type="time" className="rounded-lg border px-3 py-2" value={time} onChange={(e)=>setTime(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select className="rounded-lg border px-3 py-2" value={courseId} onChange={(e)=>setCourseId(e.target.value)}>
            <option value="none">No course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="rounded-lg border px-3 py-2" value={priority} onChange={(e)=>setPriority(e.target.value)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add Task"}
          </button>
          <Link
            href="/tasks"
            className="rounded-lg border px-4 py-2 text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Go to Tasks
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ================= Utilities ================= */

function toISO(d) { return d.toISOString().slice(0, 10); }
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const s = new Date(d); s.setDate(d.getDate() - day); s.setHours(0,0,0,0); return s;
}
function endOfWeek(d) {
  const s = startOfWeek(d); const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999); return e;
}
function inRange(d, a, b) { const t = startOfDay(d).getTime(); return t >= startOfDay(a).getTime() && t <= startOfDay(b).getTime(); }
function formatDue(date, time) {
  if (!date && !time) return "No due date";
  const d = date ? new Date(date + "T00:00:00") : null;
  const ds = d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  return time ? `${ds} ${time.slice(0,5)}` : ds;
}
function sortByDateTime(a, b) {
  const ad = a.due_date || ""; const bd = b.due_date || "";
  if (ad !== bd) return ad < bd ? -1 : 1;
  const at = a.due_time || ""; const bt = b.due_time || "";
  return at < bt ? -1 : at > bt ? 1 : 0;
}
