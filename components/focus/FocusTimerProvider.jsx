"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

/** ---------- tiny localStorage helpers ---------- */
function useSticky(key, initial) {
  const [v, setV] = useState(() => {
    if (typeof window === "undefined") return initial;
    const raw = localStorage.getItem("focus_" + key);
    return raw == null ? initial : JSON.parse(raw);
  });
  useEffect(() => { localStorage.setItem("focus_" + key, JSON.stringify(v)); }, [key, v]);
  return [v, setV];
}
function useStickyNumber(key, initial) {
  const [v, setV] = useSticky(key, initial);
  const setNumber = (n) => setV(typeof n === "function" ? Number(n(Number(v))) : Number(n));
  return [Number(v), setNumber];
}
function useStickyBool(key, initial) {
  const [v, setV] = useSticky(key, initial);
  const setBool = (b) => setV(typeof b === "function" ? Boolean(b(Boolean(v))) : Boolean(b));
  return [Boolean(v), setBool];
}

const DEFAULTS = { focusMin: 25, shortMin: 5, longMin: 15, longEvery: 4, noise: "off", volume: 0.25 };
const PHASES = { focus: { emoji: "🍅", label: "Focus" }, short: { emoji: "☕️", label: "Short" }, long: { emoji: "🌴", label: "Long" } };

const FocusTimerCtx = createContext(null);
export function useFocusTimer() { return useContext(FocusTimerCtx); }

export default function FocusTimerProvider({ children }) {
  // settings
  const [focusMin, setFocusMin]   = useStickyNumber("focusMin", DEFAULTS.focusMin);
  const [shortMin, setShortMin]   = useStickyNumber("shortMin", DEFAULTS.shortMin);
  const [longMin, setLongMin]     = useStickyNumber("longMin", DEFAULTS.longMin);
  const [longEvery, setLongEvery] = useStickyNumber("longEvery", DEFAULTS.longEvery);
  const [noise, setNoise]         = useSticky("noise", DEFAULTS.noise);
  const [volume, setVolume]       = useStickyNumber("volume", DEFAULTS.volume);

  // state
  const [phase, setPhase] = useSticky("phase", "focus"); // focus|short|long
  const [running, setRunning] = useStickyBool("running", false);
  const [cycles, setCycles] = useStickyNumber("cycles", 0);
  const [remaining, setRemaining] = useStickyNumber("remaining", focusMin * 60);

  // heal any old bad value
  useEffect(() => { if (!isFinite(remaining)) setRemaining(getPhaseSeconds(phase, {focusMin,shortMin,longMin})); }, []);

  // when settings change & idle, sync shown time
  useEffect(() => { if (!running && phase === "focus") setRemaining(focusMin * 60); }, [focusMin]);
  useEffect(() => { if (!running && phase === "short") setRemaining(shortMin * 60); }, [shortMin]);
  useEffect(() => { if (!running && phase === "long")  setRemaining(longMin * 60);  }, [longMin]);

  // timer via interval + absolute end time
  const endAt = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!running) return;

    if (!endAt.current) endAt.current = Date.now() + remaining * 1000;

    intervalRef.current = setInterval(() => {
      const secsLeft = Math.max(0, (endAt.current - Date.now()) / 1000);
      setRemaining(secsLeft);
      if (secsLeft <= 0.05) {
        clearInterval(intervalRef.current);
        endAt.current = null;
        setRunning(false);
        chime(audio, gain);
        setTimeout(() => {
          if (phase === "focus") {
            const next = cycles + 1;
            setCycles(next);
            const takeLong = next % longEvery === 0;
            setPhase(takeLong ? "long" : "short");
            setRemaining((takeLong ? longMin : shortMin) * 60);
          } else {
            setPhase("focus");
            setRemaining(focusMin * 60);
          }
        }, 150);
      }
    }, 200);

    return () => clearInterval(intervalRef.current);
  }, [running, phase, focusMin, shortMin, longMin, longEvery, cycles, remaining]);

  function startPause() {
    if (running) {
      setRunning(false);
      endAt.current = null;
      return;
    }
    const current = remaining > 0.05 ? remaining : getPhaseSeconds(phase, {focusMin,shortMin,longMin});
    setRemaining(current);
    endAt.current = Date.now() + current * 1000;
    setRunning(true);
    ensureNoise(noise, volume, audio, gain, noiseNode); // kick audio on interaction
  }

  function reset() {
    setRunning(false);
    endAt.current = null;
    setRemaining(getPhaseSeconds(phase, {focusMin,shortMin,longMin}));
  }

  function switchPhase() {
    setRunning(false);
    endAt.current = null;
    if (phase === "focus") { setPhase("short"); setRemaining(shortMin * 60); }
    else { setPhase("focus"); setRemaining(focusMin * 60); }
  }

  // ---- audio: background noise + chime ----
  const audio = useRef(null);
  const gain  = useRef(null);
  const noiseNode = useRef(null);

  useEffect(() => { // init audio ctx + gain
    if (!audio.current) {
      audio.current = new (window.AudioContext || window.webkitAudioContext)();
      gain.current = audio.current.createGain();
      gain.current.gain.value = volume;
      gain.current.connect(audio.current.destination);
    }
  }, []);

  useEffect(() => { if (gain.current) gain.current.gain.value = volume; }, [volume]);

  useEffect(() => {
    stopNoise(noiseNode);
    if (noise === "off" || !audio.current || !gain.current) return;
    noiseNode.current = createNoise(audio.current, noise);
    noiseNode.current.connect(gain.current);
    noiseNode.current.start(0);
    return () => stopNoise(noiseNode);
  }, [noise]);

  // context value
  const totalSecs = useMemo(
    () => getPhaseSeconds(phase, {focusMin,shortMin,longMin}),
    [phase, focusMin, shortMin, longMin]
  );
  const progress = 1 - Math.max(0, Math.min(1, remaining / totalSecs || 0));
  const phaseMeta = PHASES[phase];

  const value = {
    // state
    phase, phaseMeta, running, cycles, remaining, totalSecs, progress,
    // controls
    startPause, reset, switchPhase,
    // settings + setters
    focusMin, setFocusMin, shortMin, setShortMin, longMin, setLongMin, longEvery, setLongEvery,
    noise, setNoise, volume, setVolume,
  };

  return <FocusTimerCtx.Provider value={value}>{children}</FocusTimerCtx.Provider>;
}

/* ---------- audio helpers ---------- */
function stopNoise(ref) { try { ref.current?.stop(); ref.current?.disconnect?.(); } catch {} }
function ensureNoise(noise, volume, audio, gain, noiseNode) {
  if (noise === "off") return;
  if (!audio.current) {
    audio.current = new (window.AudioContext || window.webkitAudioContext)();
    gain.current = audio.current.createGain();
    gain.current.connect(audio.current.destination);
  }
  gain.current.gain.value = volume;
  stopNoise(noiseNode);
  noiseNode.current = createNoise(audio.current, noise);
  noiseNode.current.connect(gain.current);
  noiseNode.current.start(0);
}
function chime(audio, gain) {
  if (!audio.current) return;
  const ctx = audio.current;
  const g = ctx.createGain(); g.gain.value = 0.001; g.connect(ctx.destination);
  const o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(880, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.6);
  o.connect(g); o.start(); o.stop(ctx.currentTime + 0.65);
}
function createNoise(ctx, kind="white") {
  const dur = 2, rate = ctx.sampleRate, len = Math.floor(dur * rate);
  const buf = ctx.createBuffer(1, len, rate); const data = buf.getChannelData(0);
  if (kind==="white") { for (let i=0;i<len;i++) data[i]=Math.random()*2-1; }
  else if (kind==="pink") {
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i=0;i<len;i++){ const w=Math.random()*2-1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.969*b2+w*0.153852;
      b3=0.8665*b3+w*0.3104856; b4=0.55*b4+w*0.5329522; b5=-0.7616*b5-w*0.016898;
      const pink=b0+b1+b2+b3+b4+b5+b6+w*0.5362; b6=w*0.115926; data[i]=pink*0.11;
    }
  } else { // brown
    let last=0; for (let i=0;i<len;i++){ const w=Math.random()*2-1; const b=(last+0.02*w)/1.02; last=b; data[i]=b*3.5; }
  }
  const src = ctx.createBufferSource(); src.buffer=buf; src.loop=true; return src;
}
function getPhaseSeconds(phase, {focusMin,shortMin,longMin}) {
  return (phase==="focus"?focusMin:phase==="short"?shortMin:longMin)*60;
}
