import { useAuthStore } from "../state/authStore.js";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-500">Profile, API token, privacy, and workspace preferences.</p>
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold">Profile</h2>
          <p className="mt-3 text-sm text-slate-500">{user?.full_name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold">API access</h2>
          <p className="mt-3 break-all rounded-lg bg-slate-100 p-3 font-mono text-xs dark:bg-slate-950">{user?.api_token || "Generate an API token from the backend endpoint."}</p>
        </div>
      </section>
    </div>
  );
}
