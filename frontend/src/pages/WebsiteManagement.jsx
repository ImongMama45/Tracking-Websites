import { useEffect, useState } from "react";
import { Copy, Plus } from "lucide-react";
import { api } from "../lib/api.js";
import { useDashboardStore } from "../state/dashboardStore.js";

export default function WebsiteManagement() {
  const { websites, loadWebsites } = useDashboardStore();
  const [form, setForm] = useState({ name: "", domain: "", timezone: "UTC", filter_bots: true, anonymize_ips: true });
  const [snippet, setSnippet] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWebsites().catch(() => {});
  }, [loadWebsites]);

  async function createWebsite(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/websites/", form);
      setForm({ name: "", domain: "", timezone: "UTC", filter_bots: true, anonymize_ips: true });
      await loadWebsites();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to add website. Please sign in again and try once more.");
    } finally {
      setSaving(false);
    }
  }

  async function copySnippet(website) {
    setError("");
    try {
      const { data } = await api.get(`/websites/${website.id}/snippet/`);
      setSnippet(data.snippet);
      await navigator.clipboard?.writeText(data.snippet);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to copy snippet. Please sign in again.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Website Management</h1>
        <p className="text-sm text-slate-500">Create properties, copy tracking snippets, and manage privacy controls.</p>
      </div>
      <form onSubmit={createWebsite} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_1fr_160px_auto]">
        <input placeholder="Website name" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="example.com" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
        <input placeholder="UTC" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"><Plus size={16} /> {saving ? "Adding" : "Add"}</button>
      </form>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      <section className="grid gap-4 lg:grid-cols-2">
        {websites.map((website) => (
          <article key={website.id} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{website.name}</h2>
                <p className="text-sm text-slate-500">{website.domain}</p>
              </div>
              <span className="rounded-full bg-teal/10 px-2 py-1 text-xs font-semibold text-teal">{website.status}</span>
            </div>
            <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs dark:bg-slate-950">{website.tracking_id}</p>
            <button onClick={() => copySnippet(website)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"><Copy size={16} /> Copy snippet</button>
          </article>
        ))}
      </section>
      {snippet && <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-white">{snippet}</pre>}
    </div>
  );
}
