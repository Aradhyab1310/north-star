"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import TaskForm from "@/components/tasks/TaskForm";

const supabase = getSupabase();

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function fetchAll({ silent = false } = {}) {
    if (!silent) { setErr(""); setLoading(true); }
    const [t, c] = await Promise.all([
      supabase.from("tasks").select("*").order("due_date", { ascending: true }),
      supabase.from("courses").select("id,name,color"),
    ]);
    if (t.error) setErr(t.error.message);
    if (c.error) setErr((e) => e || c.error.message);
    setTasks(t.data || []);
    setCourses(c.data || []);
    if (!silent) setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  // ---------- Optimistic handlers (no full reload) ----------
  async function toggleTaskStatus(id, nextStatus) {
    // optimistic: flip in local state
    const prev = tasks;
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, status: nextStatus } : t))
    );

    // background save
    const { error } = await supabase.from("tasks").update({ status: nextStatus }).eq("id", id);
    if (error) {
      // rollback on failure
      setTasks(prev);
      alert("Failed to update status: " + error.message);
    }
  }

  async function deleteTask(id) {
    // optimistic: remove locally
    const prev = tasks;
    setTasks(prev.filter(t => t.id !== id));

    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setTasks(prev); // rollback
      alert("Failed to delete: " + error.message);
    }
  }

  const courseById = useMemo(() => {
    const m = new Map();
    for (const c of courses) m.set(c.id, c);
    return m;
  }, [courses]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-rose-600">Error: {err}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <TaskForm onSaved={() => fetchAll({ silent: true })} courses={courses} />
      </header>

      {/* List */}
      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y rounded border bg-white">
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              course={t.course_id ? courseById.get(t.course_id) : null}
              courses={courses}
              onToggle={(next) => toggleTaskStatus(t.id, next)}
              onDelete={() => deleteTask(t.id)}
              onEdited={() => fetchAll({ silent: true })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Row ---------- */
function TaskRow({ task, course, courses, onToggle, onDelete, onEdited }) {
  const next = task.status === "done" ? "todo" : "done";

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={() => onToggle(next)}
        className={`h-5 w-5 rounded border grid place-items-center ${
          task.status === "done" ? "bg-zinc-900 border-zinc-900 text-white" : "bg-white"
        }`}
        aria-label="Toggle done"
        title="Toggle done"
      >
        {task.status === "done" ? "✓" : ""}
      </button>

      <div className="flex-1">
        <div className="font-medium">{task.title}</div>
        <div className="text-xs text-zinc-500">
          {course ? (
            <span className="inline-flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full border"
                style={{ background: course.color }}
              />
              {course.name}
            </span>
          ) : (
            "No course"
          )}
          {" · "}
          {formatDue(task.due_date, task.due_time)}
        </div>
      </div>

      <Badge kind="priority" value={task.priority} />
      <Badge kind="status" value={task.status} />

      <div className="flex gap-2 pl-2">
        <TaskForm
          editTask={task}
          onSaved={onEdited}
          courses={courses}
          triggerLabel="Edit"
          triggerClass="text-sm text-zinc-600 hover:underline"
        />
        <button onClick={onDelete} className="text-sm text-rose-600 hover:underline">
          Delete
        </button>
      </div>
    </li>
  );
}

/* ---------- Small UI helpers ---------- */

function Badge({ kind, value }) {
  const cls =
    kind === "priority"
      ? value === "high"
        ? "bg-rose-100 text-rose-700 border-rose-200"
        : value === "medium"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-emerald-100 text-emerald-700 border-emerald-200"
      : value === "done"
      ? "bg-zinc-900 text-white border-zinc-900"
      : value === "doing"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-zinc-100 text-zinc-700 border-zinc-200";
  return (
    <span className={`text-xs rounded border px-2 py-1 capitalize ${cls}`}>
      {value}
    </span>
  );
}

function formatDue(date, time) {
  if (!date && !time) return "No due date";
  const d = date ? new Date(date + "T00:00:00") : null;
  const ds = d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  return time ? `${ds} ${time.slice(0, 5)}` : ds;
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded border bg-white p-10 text-center">
      <div className="text-lg font-medium">No tasks yet.</div>
      <p className="mt-1 text-sm text-zinc-500">Use “New Task” to add your first item.</p>
    </div>
  );
}
