"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import ThemeToggle from "@/components/theme/ThemeToggle";

const supabase = getSupabase();

/* Simple local theme manager (light/dark/system) */
function applyTheme(theme) {
  const root = document.documentElement;
  const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && sysDark);
  root.classList.toggle("dark", isDark);
}


export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // profile
  const [displayName, setDisplayName] = useState("");

  // theme
  const [theme, setTheme] = useState(
    typeof window === "undefined" ? "system" : localStorage.getItem("theme") || "system"
  );

  // local “notifications” preferences (UI only — you can wire to real notifications later)
  const [notifDueSoon, setNotifDueSoon] = useState(
    typeof window === "undefined" ? true : localStorage.getItem("notif_dueSoon") !== "false"
  );
  const [notifOverdue, setNotifOverdue] = useState(
    typeof window === "undefined" ? true : localStorage.getItem("notif_overdue") !== "false"
  );

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        setLoading(false);
        return;
      }
      setUser(data.user);
      setDisplayName(data.user.user_metadata?.full_name || "");
      setLoading(false);
    })();
  }, []);

  // apply & persist theme
  useEffect(() => {
    if (typeof window === "undefined") return;
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // persist local notification prefs
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("notif_dueSoon", String(!!notifDueSoon));
  }, [notifDueSoon]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("notif_overdue", String(!!notifOverdue));
  }, [notifOverdue]);

  async function saveProfile() {
    if (!user) return;
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName || "" },
    });
    if (error) {
      alert("Failed to update profile: " + error.message);
    } else {
      alert("Profile updated!");
    }
  }

  async function changePassword() {
    const password = prompt("New password (8+ chars):");
    if (!password) return;
    if (password.length < 8) {
      alert("Please use at least 8 characters.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) alert("Failed to change password: " + error.message);
    else alert("Password changed!");
  }

  async function clearMyData() {
    if (!user) return;
    if (!confirm("This will delete all your courses, tasks, and study logs. Continue?")) return;

    // Order relies on FK cascades we set:
    // - deleting tasks deletes subtasks (ON DELETE CASCADE)
    // - deleting courses deletes class_sessions (ON DELETE CASCADE)
    // study_logs are independent
    const uid = user.id;

    // delete tasks
    const delTasks = supabase.from("tasks").delete().eq("user_id", uid);
    // delete courses
    const delCourses = supabase.from("courses").delete().eq("user_id", uid);
    // delete study_logs
    const delLogs = supabase.from("study_logs").delete().eq("user_id", uid);

    const [t, c, l] = await Promise.all([delTasks, delCourses, delLogs]);

    const err = t.error || c.error || l.error;
    if (err) {
      alert("Something failed: " + err.message);
    } else {
      alert("All your data was cleared.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) return <div className="p-6">Loading…</div>;

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-zinc-600">
          You’re not logged in.{" "}
          <Link href="/login" className="underline">Go to login</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-500">Manage your profile, appearance and preferences.</p>
      </header>

      <div className="space-y-6">
        <h1 className="heading text-2xl">Settings</h1>

        <section className="card">
          <h2 className="section-title mb-3">Appearance</h2>
          <ThemeToggle />
        </section>
      {/* …rest… */}
    </div>

      {/* Profile */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold">Profile</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <LabelField label="Name">
            <input
              className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </LabelField>
          <LabelField label="Email">
            <input
              className="w-full cursor-not-allowed rounded-lg border px-3 py-2 bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              value={user.email || ""}
              disabled
            />
          </LabelField>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={saveProfile} className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800">
            Save
          </button>
          <button onClick={changePassword} className="rounded-lg border px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            Change password
          </button>
          <button onClick={signOut} className="rounded-lg border px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            Sign out
          </button>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold">Appearance</h2>
        <div className="flex flex-wrap items-center gap-3">
          {["light", "dark", "system"].map((v) => (
            <button
              key={v}
              onClick={() => setTheme(v)}
              className={`rounded-full border px-4 py-1.5 text-sm capitalize ${
                theme === v ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Theme is stored locally and applied instantly. “System” follows your OS preference.
        </p>
      </section>

      {/* Notifications (local-only for now) */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold">Notifications</h2>
        <ToggleRow
          label="Remind me when tasks are due soon"
          checked={notifDueSoon}
          onChange={setNotifDueSoon}
        />
        <ToggleRow
          label="Highlight overdue tasks"
          checked={notifOverdue}
          onChange={setNotifOverdue}
        />
        <p className="mt-2 text-sm text-zinc-500">
          These preferences are saved to your browser. If you want real reminders later, we can add email/push.
        </p>
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold text-rose-600">Danger Zone</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={clearMyData}
            className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800"
          >
            Delete all my data
          </button>
          {/* Deleting account requires admin privileges on Supabase.
              If you later add a secure API route that uses a service key, you can call it from here. */}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Deletes your courses, tasks (and subtasks), class sessions, and study logs.
        </p>
      </section>
    </div>
  );
}

/* ---------- small UI helpers ---------- */

function LabelField({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        className="h-5 w-10 cursor-pointer appearance-none rounded-full bg-zinc-200 transition before:block before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition checked:bg-emerald-500 checked:before:translate-x-5"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
