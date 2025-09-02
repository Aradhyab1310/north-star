"use client";

import CourseForm from "./CourseForm";
import { getSupabase } from "@/lib/supabase/client";
import { useState } from "react";

export default function CourseCard({ course, onRefresh }) {
  const supabase = getSupabase();
  const [local, setLocal] = useState(course); // local for optimistic UI

  async function toggleArchive() {
    const nextArchived = !local.archived;
    const prev = local;

    // optimistic
    setLocal({ ...local, archived: nextArchived });

    // server
    const { error } = await supabase
      .from("courses")
      .update({ archived: nextArchived })
      .eq("id", local.id);

    if (error) {
      // rollback
      setLocal(prev);
      alert("Failed to update: " + error.message);
    } else {
      onRefresh?.(); // ask parent to refetch so list stays in sync
    }
  }

  return (
    <li className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="inline-block h-4 w-4 rounded-full border"
            style={{ background: local.color }}
          />
          <div>
            <div className="font-medium">{local.name}</div>
            <div className="text-xs text-zinc-500">
              {local.code || "—"} · {local.term || "—"}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <CourseForm editCourse={local} onSaved={onRefresh} triggerLabel="Edit" />
          <button onClick={toggleArchive} className="text-sm text-zinc-600 hover:underline">
            {local.archived ? "Unarchive" : "Archive"}
          </button>
        </div>
      </div>
    </li>
  );
}
