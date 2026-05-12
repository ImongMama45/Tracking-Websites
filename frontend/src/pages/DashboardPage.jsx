import { useEffect } from "react";
import { Activity, Clock, Eye, MousePointerClick, Users } from "lucide-react";
import ChartPanel from "../ui/ChartPanel.jsx";
import MetricCard from "../ui/MetricCard.jsx";
import { useDashboardStore } from "../state/dashboardStore.js";

export default function DashboardPage({ mode }) {
  const { websites, selectedWebsite, overview, traffic, period, setPeriod, loadWebsites, loadOverview } = useDashboardStore();

  useEffect(() => {
    loadWebsites();
  }, [loadWebsites]);

  useEffect(() => {
    loadOverview();
  }, [selectedWebsite?.id, period, loadOverview]);

  const current = overview?.current || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{mode === "realtime" ? "Real-time Dashboard" : "Overview Dashboard"}</h1>
          <p className="text-sm text-slate-500">{selectedWebsite?.name || "Create a website to begin tracking."}</p>
        </div>
        <div className="flex gap-2">
          {["7d", "14d", "30d", "90d"].map((item) => (
            <button key={item} onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-2 text-sm ${period === item ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "bg-white dark:bg-slate-900"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {!websites.length ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">No websites yet</h2>
          <p className="mt-2 text-sm text-slate-500">Add a website from Website Management to receive a tracking snippet.</p>
        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Visitors" value={current.visitors ?? 0} change={overview?.changes?.visitors ?? 0} icon={Users} />
            <MetricCard label="Page views" value={current.page_views ?? 0} change={overview?.changes?.page_views ?? 0} icon={Eye} />
            <MetricCard label="Sessions" value={current.sessions ?? 0} change={overview?.changes?.sessions ?? 0} icon={Activity} />
            <MetricCard label="Bounce rate" value={`${Math.round(current.bounce_rate ?? 0)}%`} change={overview?.changes?.bounce_rate ?? 0} icon={MousePointerClick} />
          </div>
          <ChartPanel title="Traffic trend" data={traffic} />
          {mode === "realtime" && (
            <section className="grid gap-4 lg:grid-cols-3">
              {["Active visitors", "Current pages", "Live events"].map((title, index) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <Clock className="text-teal" size={20} />
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-2 text-3xl font-semibold">{index === 0 ? current.visitors ?? 0 : "Live"}</p>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
