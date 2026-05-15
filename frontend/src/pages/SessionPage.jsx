import { useEffect, useState, useMemo } from "react";
import { Workflow, Clock, MousePointerClick, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { api } from "../lib/api.js";
import { useDashboardStore } from "../state/dashboardStore.js";

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {children}
    </div>
  );
}

function EmptyRow({ colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-slate-400">No data yet</td>
    </tr>
  );
}

function fmtDuration(sec) {
  if (!sec) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function PagesTable({ title, icon: Icon, rows, keyField }) {
  const max = Math.max(1, ...rows.map(r => r.count));
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
        <Icon size={16} className="text-slate-400" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-3">Page</th>
            <th className="px-4 py-3">Sessions</th>
            <th className="px-4 py-3 w-32">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={3} />
          ) : rows.map((r) => {
            const pct = Math.round((r.count / max) * 100);
            return (
              <tr key={r[keyField]} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-mono text-xs">{r[keyField] || "/"}</td>
                <td className="px-4 py-3 tabular-nums">{r.count.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

export default function SessionsPage() {
  const selectedWebsite = useDashboardStore(s => s.selectedWebsite);
  const period          = useDashboardStore(s => s.period);

  const [summary,     setSummary]     = useState(null);
  const [entryPages,  setEntryPages]  = useState([]);
  const [exitPages,   setExitPages]   = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!selectedWebsite?.id) return;
    setLoading(true);
    api.get(`/analytics/${selectedWebsite.id}/sessions/?period=${period}`)
      .then(({ data }) => {
        setSummary(data.summary   || null);
        setEntryPages(data.entry_pages || []);
        setExitPages(data.exit_pages  || []);
        setSessions(data.sessions     || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedWebsite?.id, period]);

  if (!selectedWebsite) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <Workflow size={32} className="mx-auto text-slate-300" />
        <p className="mt-3 font-medium text-slate-500">No website selected</p>
      </div>
    );
  }

  const kpis = [
    { label: "Total Sessions",    value: summary?.total_sessions?.toLocaleString() ?? "—",   icon: Workflow },
    { label: "Bounce Rate",       value: summary ? `${summary.bounce_rate}%` : "—",           icon: MousePointerClick },
    { label: "Avg Duration",      value: summary ? fmtDuration(summary.avg_duration) : "—",   icon: Clock },
    { label: "Pages / Session",   value: summary?.avg_pages ?? "—",                           icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <p className="text-sm text-slate-500">Session-level behaviour for the selected period.</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon size={18} className="text-slate-300" />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {loading ? "—" : value}
            </p>
          </Card>
        ))}
      </div>

      {/* Entry / Exit pages */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PagesTable title="Top Entry Pages" icon={TrendingUp}   rows={entryPages} keyField="entry_page" />
        <PagesTable title="Top Exit Pages"  icon={TrendingDown} rows={exitPages}  keyField="exit_page"  />
      </div>

      {/* Recent sessions table */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <h2 className="font-semibold">Recent Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Started</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Pages</th>
                <th className="px-4 py-3">Bounce</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Browser</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={8} />
              ) : sessions.length === 0 ? (
                <EmptyRow colSpan={8} />
              ) : sessions.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs">
                    {new Date(s.started_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{fmtDuration(s.duration_seconds)}</td>
                  <td className="px-4 py-3 tabular-nums">{s.page_count}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.is_bounce
                        ? "bg-red-50 text-red-600 dark:bg-red-950/40"
                        : "bg-green-50 text-green-600 dark:bg-green-950/40"
                    }`}>
                      {s.is_bounce ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-500">{s.entry_type || "—"}</td>
                  <td className="px-4 py-3">{s.visitor__country_name || "—"}</td>
                  <td className="px-4 py-3 capitalize">{s.visitor__device_type || "—"}</td>
                  <td className="px-4 py-3">{s.visitor__browser || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}