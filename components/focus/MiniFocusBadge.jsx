"use client";

import Link from "next/link";
import { useFocusTimer } from "@/components/focus/FocusTimerProvider";

export default function MiniFocusBadge() {
  const { phaseMeta, remaining, running, progress } = useFocusTimer();

  const m = Math.floor(remaining / 60);
  const s = Math.floor(remaining % 60);
  const pct = Math.round(progress * 100);

  const stateColor = running ? "bg-emerald-500" : "bg-zinc-400";
  const stateText = running ? "Running" : "Paused";
  const ringColor = running ? "ring-emerald-300 dark:ring-emerald-700" : "ring-zinc-300 dark:ring-zinc-700";

  return (
    <Link
      href="/focus"
      aria-label={`Focus timer: ${stateText}, ${m} minutes ${s} seconds remaining`}
      className={`
        group relative mt-4 block rounded-3xl border
        bg-white/90 px-5 py-4 text-base shadow-sm backdrop-blur
        transition hover:-translate-y-0.5 hover:shadow-md
        dark:bg-zinc-900/70 dark:text-zinc-100
        ${ringColor}
      `}
    >
      {/* top row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* status dot */}
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full ${stateColor} ${running ? "animate-pulse" : ""}`}
          />
          <span className="text-xl leading-none">{phaseMeta.emoji}</span>
          <span className="font-semibold">{stateText}</span>
        </div>

        {/* time pill */}
        <span
          className={`
            rounded-full border px-3 py-1 font-bold tabular-nums
            bg-white/70 text-zinc-900 dark:bg-zinc-800/70 dark:text-zinc-50
          `}
        >
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
      </div>

      {/* caption */}
      <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Click to open Focus Mode
      </div>

      {/* progress bar (thicker & rounded, with animated knob) */}
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`relative h-full rounded-full transition-all duration-200 ${
            running
              ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
              : "bg-zinc-400"
          }`}
          style={{ width: `${pct}%` }}
        >
          {/* little knob */}
          <span
            className="absolute -right-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow
                       dark:bg-zinc-900"
          />
        </div>
      </div>

      {/* soft shine on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition group-hover:opacity-100">
        <div className="absolute -top-8 left-1/3 h-20 w-28 rotate-12 rounded-full bg-white/25 blur-2xl dark:bg-white/10" />
      </div>
    </Link>
  );
}
