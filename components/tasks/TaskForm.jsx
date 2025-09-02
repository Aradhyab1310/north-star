"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

const TYPES = ["assignment", "project", "exam", "other"];
const PRIORITIES = ["low", "medium", "high"];
const STATUSES = ["todo", "doing", "done"];

export default function TaskForm({
  editTask,
  onSaved,
  courses,                 // [{id,name,color}]
  triggerLabel,
  triggerClass,
}) {
  const supabase = getSupabase();
  const isEdit = Boolean(editTask);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(editTask?.title || "");
  const [description, setDescription] = useState(editTask?.description || "");
  const [courseId, setCourseId] = useState(editTask?.course_id || "");
  const [type, setType] = useState(editTask?.type || "assignment");
  const [priority, setPriority] = useState(editTask?.priority || "medium");
  const [status, setStatus] = useState(editTask?.status || "todo");
  const [dueDate, setDueDate] = useState(editTask?.due_date || "");
  const [dueTime, setDueTime] = useState(editTask?.due_time || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function resetLocal() {
    setTitle(editTask?.title || "");
    setDescription(editTask?.description || "");
    setCourseId(editTask?.course_id || "");
    setType(editTask?.type || "assignment");
    setPriority(editTask?.priority || "medium");
    setStatus(editTask?.status || "todo");
    setDueDate(editTask?.due_date || "");
    setDueTime(editTask?.due_time || "");
    setErr("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr("");

    const { data: { user }, error: uerr } = await supabase.auth.getUser();
    if (uerr || !user) { setErr(uerr?.message || "Not logged in"); setSaving(false); return; }

    const payload = {
      title,
      description: description || null,
      course_id: courseId || null,
      type,
      priority,
      status,
      due_date: dueDate || null,
      due_time: dueTime || null,
      user_id: user.id, // required on insert (RLS)
    };

    const { error } = isEdit
      ? await supabase.from("tasks").update(payload).eq("id", editTask.id)
      : await supabase.from("tasks").insert(payload);

    setSaving(false);
    if (error) setErr(error.message);
    else { setOpen(false); onSaved?.(); }
  }

  return (
    <>
      <button
        onClick={() => { resetLocal(); setOpen(true); }}
        className={
          triggerClass ||
          (isEdit
            ? "text-sm text-zinc-600 hover:underline"
            : "rounded bg-zinc-900 text-white px-3 py-2")
        }
      >
        {triggerLabel || (isEdit ? "Edit" : "New Task")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg border bg-white p-5">
            <div className="mb-3 text-lg font-semibold">
              {isEdit ? "Edit Task" : "New Task"}
            </div>

            <form className="grid gap-3" onSubmit={onSubmit}>
              <input
                className="rounded border px-3 py-2"
                placeholder="Title"
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                required
              />
              <textarea
                className="rounded border px-3 py-2"
                placeholder="Description (optional)"
                value={description}
                onChange={(e)=>setDescription(e.target.value)}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  className="rounded border px-3 py-2"
                  value={courseId}
                  onChange={(e)=>setCourseId(e.target.value)}
                >
                  <option value="">No course</option>
                  {courses?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  className="rounded border px-3 py-2"
                  value={type}
                  onChange={(e)=>setType(e.target.value)}
                >
                  {TYPES.map(x => <option key={x} value={x}>{cap(x)}</option>)}
                </select>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  className="rounded border px-3 py-2"
                  value={priority}
                  onChange={(e)=>setPriority(e.target.value)}
                >
                  {PRIORITIES.map(x => <option key={x} value={x}>{cap(x)}</option>)}
                </select>

                <select
                  className="rounded border px-3 py-2"
                  value={status}
                  onChange={(e)=>setStatus(e.target.value)}
                >
                  {STATUSES.map(x => <option key={x} value={x}>{cap(x)}</option>)}
                </select>

                <input
                  type="date"
                  className="rounded border px-3 py-2"
                  value={dueDate || ""}
                  onChange={(e)=>setDueDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  type="time"
                  className="rounded border px-3 py-2"
                  value={dueTime || ""}
                  onChange={(e)=>setDueTime(e.target.value)}
                />
                <div className="sm:col-span-2 text-xs text-zinc-500 self-center">
                  Tip: You can leave date/time empty.
                </div>
              </div>

              {err && <p className="text-sm text-rose-600">{err}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setOpen(false)} className="rounded border px-3 py-2">
                  Cancel
                </button>
                <button disabled={saving} className="rounded bg-zinc-900 text-white px-3 py-2 disabled:opacity-60">
                  {saving ? "Saving…" : isEdit ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
