"use client";

export const PALETTE = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#06b6d4", "#a855f7", "#3b82f6",
];

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((c) => {
        const active = c === value;
        return (
          <button
            type="button"
            key={c}
            onClick={() => onChange(c)}
            className={`h-8 w-8 rounded-full border ${active ? "ring-2 ring-offset-2 ring-zinc-900" : ""}`}
            style={{ background: c }}
            aria-label={`Pick ${c}`}
            title={c}
          />
        );
      })}
      <input
        className="ml-2 w-28 rounded border px-2 py-1 text-sm"
        placeholder="#hex"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
