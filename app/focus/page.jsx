"use client";

import { useFocusTimer } from "@/components/focus/FocusTimerProvider";

export default function FocusPage() {
  const {
    // state
    phase, phaseMeta, running, cycles, remaining, totalSecs, progress,
    // controls
    startPause, reset, switchPhase,
    // settings
    focusMin, setFocusMin, shortMin, setShortMin, longMin, setLongMin, longEvery, setLongEvery,
    noise, setNoise, volume, setVolume,
  } = useFocusTimer();

  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 via-white-50 to-white-50">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{phaseMeta.emoji}</span>
            <h1 className="text-2xl font-bold text-zinc-800">{phaseMeta.label} Mode</h1>
            <span className="rounded-full bg-white px-3 py-1 text-sm text-zinc-600 border">
              Sessions: <strong className="text-zinc-900">{cycles}</strong>
            </span>
          </div>

          {/* Noise select */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">Background:</span>
            <select className="rounded-full border bg-white px-3 py-1.5 text-sm" value={noise} onChange={(e)=>setNoise(e.target.value)}>
              <option value="off">Off</option><option value="white">White</option>
              <option value="pink">Pink</option><option value="brown">Brown</option>
            </select>
            <input title="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(e)=>setVolume(parseFloat(e.target.value))} className="w-28" />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Big Timer Card */}
          <section className="col-span-12 lg:col-span-8">
            <div className="relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center justify-center py-6">
                <ProgressRing progress={progress} />

                <div className="-mt-40 mb-2 text-7xl font-black tabular-nums tracking-tight text-zinc-900">
                  {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
                </div>

                <div className="mb-6 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700 border border-amber-200">
                  {phaseMeta.emoji} {phaseMeta.label} • {Math.round(totalSecs/60)} min
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={startPause} className={`rounded-full px-6 py-3 text-white shadow transition ${running?"bg-rose-500 hover:bg-rose-600":"bg-emerald-500 hover:bg-emerald-600"}`}>
                    {running ? "Pause" : "Start"}
                  </button>
                  <button onClick={reset} className="rounded-full border px-4 py-3 text-zinc-700 bg-white hover:bg-zinc-50">Reset</button>
                  <button onClick={switchPhase} className="rounded-full border px-4 py-3 text-zinc-700 bg-white hover:bg-zinc-50">Switch Phase</button>
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  Tip: Press <kbd className="rounded bg-zinc-100 px-1">Space</kbd> to Start/Pause, <kbd className="rounded bg-zinc-100 px-1">R</kbd> to Reset.
                </p>
              </div>
            </div>
          </section>

          {/* Settings + Explainer */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-zinc-900">Session Settings</h2>
              <div className="grid gap-3">
                <NumberField label="Focus (min)" value={focusMin} setValue={setFocusMin} min={5} max={180} />
                <NumberField label="Short Break (min)" value={shortMin} setValue={setShortMin} min={2} max={60} />
                <NumberField label="Long Break (min)" value={longMin} setValue={setLongMin} min={5} max={120} />
                <NumberField label="Long Break Every" helper="After how many focus sessions?" value={longEvery} setValue={setLongEvery} min={2} max={12} />
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-zinc-900">What is Pomodoro? 🍅</h3>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-700">
                <li>Pick one task and set a focus timer (e.g., 25 minutes).</li>
                <li>Work only on that task until the timer rings.</li>
                <li>Take a short break (e.g., 5 minutes).</li>
                <li>Repeat. After your set number of sessions, take a longer break.</li>
              </ol>
              <p className="mt-2 text-xs text-zinc-500">Short sprints help reduce procrastination and keep your brain fresh.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ progress }) {
  const size = 360, stroke = 14, r = (size - stroke) / 2;
  const c = 2 * Math.PI * r, dash = c * progress;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mb-6" aria-hidden>
      <defs><linearGradient id="g1" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#f97316"/><stop offset="100%" stopColor="#ef4444"/></linearGradient></defs>
      <circle cx={size/2} cy={size/2} r={r} stroke="#f4f4f5" strokeWidth={stroke} fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke="url(#g1)" strokeWidth={stroke} fill="none" strokeLinecap="round"
              strokeDasharray={`${dash} ${c-dash}`} transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray 0.18s linear"}}/>
    </svg>
  );
}

function NumberField({ label, helper, value, setValue, min=1, max=999 }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-zinc-700">{label}</span>
      <input type="number" min={min} max={max} value={value}
             onChange={(e)=>setValue(Math.max(min, Math.min(max, parseInt(e.target.value||"0",10))))}
             className="w-full rounded-xl border px-3 py-2 text-zinc-800" />
      {helper && <span className="text-xs text-zinc-500">{helper}</span>}
    </label>
  );
}
