"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import ColorPicker, { PALETTE } from "./ColorPicker";

export default function CourseForm({ editCourse, onSaved, triggerClass = "", triggerLabel }) {
  const supabase = getSupabase();
  const isEdit = Boolean(editCourse);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(editCourse?.name || "");
  const [code, setCode] = useState(editCourse?.code || "");
  const [term, setTerm] = useState(editCourse?.term || "");
  const [color, setColor] = useState(editCourse?.color || PALETTE[0]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function resetLocal() {
    setName(editCourse?.name || "");
    setCode(editCourse?.code || "");
    setTerm(editCourse?.term || "");
    setColor(editCourse?.color || PALETTE[0]);
    setErr("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr("");

    const { data: { user }, error: uerr } = await supabase.auth.getUser();
    if (uerr) { setErr(uerr.message); setSaving(false); return; }
    if (!user) { setErr("Not logged in"); setSaving(false); return; }

    const payload = {
      name,
      code: code || null,
      term: term || null,
      color,
      user_id: user.id, // required on insert
    };

    const { error } = isEdit
      ? await supabase.from("courses").update(payload).eq("id", editCourse.id)
      : await supabase.from("courses").insert(payload);

    setSaving(false);
    if (error) setErr(error.message);
    else { setOpen(false); onSaved?.(); }
  }

  return (
    <>
      <button
        onClick={() => { resetLocal(); setOpen(true); }}
        className={triggerClass || (isEdit
          ? "text-sm text-zinc-600 hover:underline"
          : "rounded bg-zinc-900 text-white px-3 py-2")}
      >
        {triggerLabel || (isEdit ? "Edit" : "New Course")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-white p-5">
            <div className="mb-3 text-lg font-semibold">
              {isEdit ? "Edit Course" : "New Course"}
            </div>

            <form className="space-y-3" onSubmit={onSubmit}>
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="Course name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <input
                  className="w-full rounded border px-3 py-2"
                  placeholder="Code (e.g., CS201)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <input
                  className="w-full rounded border px-3 py-2"
                  placeholder="Term (e.g., Fall 2025)"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                />
              </div>

              <div>
                <div className="mb-1 text-sm font-medium">Color</div>
                <ColorPicker value={color} onChange={setColor} />
              </div>

              {err && <p className="text-sm text-rose-600">{err}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded border px-3 py-2">
                  Cancel
                </button>
                <button disabled={saving} className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-60">
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
