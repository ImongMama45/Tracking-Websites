import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Moon, Sun, User } from "lucide-react";
import { useAuthStore } from "../state/authStore.js";
import { api } from "../lib/api.js";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState({ loading: false, error: "", success: "" });

  function copyToken() {
    if (!user?.api_token) return;
    navigator.clipboard.writeText(user.api_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDarkMode((d) => !d);
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwStatus({ loading: false, error: "New passwords do not match.", success: "" });
      return;
    }
    setPwStatus({ loading: true, error: "", success: "" });
    try {
      await api.post("/auth/change-password/", {
        current_password: pwForm.current,
        new_password: pwForm.next,
      });
      setPwStatus({ loading: false, error: "", success: "Password updated successfully." });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwStatus({
        loading: false,
        error: err.response?.data?.detail || "Failed to update password.",
        success: "",
      });
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-500">Profile, API token, privacy, and workspace preferences.</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {/* Profile card */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800">
              <User size={18} className="text-slate-500" />
            </span>
            <div>
              <h2 className="font-semibold">Profile</h2>
              <p className="text-xs text-slate-400">Your account identity</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
              <p className="text-xs text-slate-400">Name</p>
              <p className="text-sm font-medium">{user?.full_name || user?.username || "—"}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm font-medium">{user?.email || "—"}</p>
            </div>
          </div>
        </div>

        {/* API token card */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800">
              <KeyRound size={18} className="text-slate-500" />
            </span>
            <div>
              <h2 className="font-semibold">API access</h2>
              <p className="text-xs text-slate-400">Use this token with the REST API</p>
            </div>
          </div>
          {user?.api_token ? (
            <div className="mt-4">
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-950">
                <p className="flex-1 break-all font-mono text-xs">
                  {showToken ? user.api_token : "•".repeat(32)}
                </p>
                <button onClick={() => setShowToken((s) => !s)} className="shrink-0 text-slate-400 hover:text-slate-600">
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                onClick={copyToken}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700"
              >
                {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy token"}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No API token — generate one from the backend admin panel.</p>
          )}
        </div>
      </section>

      {/* Change password */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold">Change password</h2>
        <form onSubmit={changePassword} className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Current password</label>
            <input
              type="password"
              className={inputCls}
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">New password</label>
            <input
              type="password"
              className={inputCls}
              value={pwForm.next}
              onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Confirm new password</label>
            <input
              type="password"
              className={inputCls}
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={pwStatus.loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
            >
              {pwStatus.loading ? "Saving…" : "Update password"}
            </button>
            {pwStatus.error && <p className="text-sm text-red-500">{pwStatus.error}</p>}
            {pwStatus.success && <p className="text-sm text-green-500">{pwStatus.success}</p>}
          </div>
        </form>
      </div>

      {/* Appearance */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold">Appearance</h2>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-slate-400">Toggle between light and dark theme</p>
          </div>
          <button
            onClick={toggleDark}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </div>
    </div>
  );
}