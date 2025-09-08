"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parseISO, isSameDay } from "date-fns";
import Link from "next/link";

/** tasks: [{ id, title, due_date, due_time, priority, course_id }] */
export default function TaskCalendar({ tasks }) {
  const [selected, setSelected] = useState(new Date());

  // Bucket tasks by YYYY-MM-DD
  const byDate = useMemo(() => {
    const m = new Map();
    for (const t of tasks) {
      if (!t.due_date) continue;
      const key = t.due_date; // already YYYY-MM-DD from Supabase
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(t);
    }
    return m;
  }, [tasks]);

  // quick helper for day content
  function renderDay(day) {
    const key = format(day, "yyyy-MM-dd");
    const items = byDate.get(key) || [];
    if (items.length === 0) return <span>{day.getDate()}</span>;
    // show date + up to 3 dots below
    return (
      <div className="grid place-items-center">
        <span>{day.getDate()}</span>
        <div className="mt-1 flex gap-1">
          {items.slice(0, 3).map((t) => (
            <span
              key={t.id}
              title={t.title}
              className={`h-1.5 w-1.5 rounded-full ${
                t.priority === "high"
                  ? "bg-rose-500"
                  : t.priority === "medium"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
          ))}
          {items.length > 3 && (
            <span className="text-[10px] text-zinc-500">+{items.length - 3}</span>
          )}
        </div>
      </div>
    );
  }

  const selectedKey = format(selected, "yyyy-MM-dd");
  const selectedTasks = byDate.get(selectedKey) || [];

  return (
    <div className="space-y-4">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={(d) => d && setSelected(d)}
        showOutsideDays
        weekStartsOn={1}
        components={{ DayContent: ({ date }) => renderDay(date) }}
        className="rounded border bg-white p-3"
        styles={{
          caption: { fontWeight: 600 },
          day: { padding: 6 },
          head_cell: { fontWeight: 500 },
          day_selected: { background: "black", color: "white" },
          day_today: { border: "1px solid #e5e7eb" },
        }}
      />

      {/* List for the selected date */}
      <div className="rounded border bg-white">
        <div className="border-b px-3 py-2 text-sm font-medium">
          {format(selected, "EEE, MMM d")}
        </div>
        {selectedTasks.length === 0 ? (
          <div className="p-3 text-sm text-zinc-500">No tasks due.</div>
        ) : (
          <ul className="divide-y">
            {selectedTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm">{t.title}</div>
                  <div className="text-xs text-zinc-500">
                    {t.due_time ? t.due_time.slice(0, 5) : "—"}
                  </div>
                </div>
                {/* Link to tasks page prefilled with search = title */}
                <Link
                  href={`/tasks?q=${encodeURIComponent(t.title)}`}
                  className="text-xs text-zinc-700 underline hover:text-zinc-900"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
