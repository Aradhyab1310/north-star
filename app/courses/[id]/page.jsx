"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import TaskForm from "@/components/tasks/TaskForm"; // you already have this

const supabase = getSupabase();

export default function CourseDetailPage() {
  const { id } = useParams();           // course id from URL
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // description editor
  const [desc, setDesc] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);

  async function fetchAll({ silent = false } = {}) {
    if (!silent) { setErr(""); setLoading(true); }
    const [c, t] = await Promise.all([
      supabase.from("courses").select("*").eq("id", id).single(),
      supabase
        .from("tasks")
        .select("id,title,status,priority,due_date,due_time,created_at")
        .eq("course_id", id)
        .order("due_date", { ascending: true })
        .order("due_time", { ascending: true }),
    ]);
    if (c.error) setErr(c.error.message);
    if (t.error) setErr((e) => e || t.error.message);
    if (c.data) {
      setCourse(c.data);
      setDesc(c.data.description || "");
    }
    setTasks(t.data || []);
    if (!silent) setLoading(false);
  }

  useEffect(() => { if (id) fetchAll(); }, [id]);

  async function saveDescription() {
    if (!course) return;
    setSavingDesc(true);
    const { error } = await supabase
      .from("courses")
      .update({ description: desc })
      .eq("id", course.id);
    setSavingDesc(false);
    if (error) return alert("Failed to save: " + error.message);
    // refresh local
    fetchAll({ silent: true });
  }

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => !!t.due_date && t.status !== "done")
        .slice(0, 8),
    [tasks]
  );

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-rose-600">Error: {err}</div>;
  if (!course) {
    return (
      <div className="p-6">
        <div className="mb-2 text-sm text-zinc-500">
          <Link className="underline" href="/courses">← Back to Courses</Link>
        </div>
        <div>Course not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-zinc-500">
        <Link className="underline" href="/courses">Courses</Link>
        <span> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Course</span>
      </div>

      {/* Header card */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
                style={{ background: course.color || "#6366f1" }}
                aria-hidden
              />
              <h1 className="truncate text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {course.name || "Untitled Course"}
              </h1>
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              {(course.code || "—")} · {(course.term || "—")}
              {course.archived ? (
                <span className="ml-2 rounded-full border px-2 py-0.5 text-xs text-zinc-600">
                  Archived
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tasks"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              View all assignments
            </Link>
            <TaskForm
              // create-new mode, pre-select this course
              courses={[{ id: course.id, name: course.name }]}
              presetCourseId={course.id}
              onSaved={() => fetchAll({ silent: true })}
              triggerLabel="Add Assignment"
              triggerClass="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
            />
          </div>
        </div>
      </section>

      {/* Description + Upcoming */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Description editor */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Description
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={6}
            placeholder="Add a short description, syllabus summary, professor notes, etc."
            className="w-full rounded-xl border px-3 py-2 leading-relaxed"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={saveDescription}
              disabled={savingDesc}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {savingDesc ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setDesc(course.description || "")}
              className="rounded-lg border px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Upcoming for this course */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Upcoming
          </div>
          {upcoming.length === 0 ? (
            <div className="text-sm text-zinc-500">Nothing due soon 🎉</div>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="text-xs text-zinc-500">
                      {formatDue(t.due_date, t.due_time)} • {t.priority}
                    </div>
                  </div>
                  <Link
                    href={`/tasks?focus=${t.id}`}
                    className="text-xs text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* All assignments list (cute cards) */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Assignments</h2>
          <TaskForm
            courses={[{ id: course.id, name: course.name }]}
            presetCourseId={course.id}
            onSaved={() => fetchAll({ silent: true })}
            triggerLabel="Add Assignment"
            triggerClass="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
          />
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-sm text-zinc-500 dark:bg-zinc-900">
            No assignments yet. Add your first one!
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => (
              <li key={t.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{t.title}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {formatDue(t.due_date, t.due_time)}
                    </div>
                  </div>
                  <span className={`text-xs rounded-full border px-2 py-0.5 capitalize ${
                    t.status === "done"
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : t.status === "doing"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs rounded-full border px-2 py-0.5 capitalize ${
                    t.priority === "high"
                      ? "bg-rose-100 text-rose-700 border-rose-200"
                      : t.priority === "medium"
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200"
                  }`}>
                    {t.priority}
                  </span>

                  <Link
                    href={`/tasks?focus=${t.id}`}
                    className="text-xs text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function formatDue(date, time) {
  if (!date && !time) return "No due date";
  const d = date ? new Date(date + "T00:00:00") : null;
  const ds = d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  return time ? `${ds} ${time.slice(0, 5)}` : ds;
}
