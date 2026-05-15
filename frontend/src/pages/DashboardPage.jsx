import { useEffect, useMemo, useState } from "react";
import { Activity, Eye, Globe, MousePointerClick, Radio, Users } from "lucide-react";
import ChartPanel from "../ui/ChartPanel.jsx";
import MetricCard from "../ui/MetricCard.jsx";
import { api } from "../lib/api.js";
import { useDashboardStore } from "../state/dashboardStore.js";

export default function DashboardPage({ mode }) {
  const {
    websites,
    selectedWebsite,
    overview,
    traffic,
    lastUpdated,
    period,
    setPeriod,
    loadWebsites,
    loadOverview,
  } = useDashboardStore();

  const [secondsAgo, setSecondsAgo] = useState(0);
  const [realtimeData, setRealtimeData] = useState({ active_visitors: 0, active_pages: [] });

  // Load websites once
  useEffect(() => {
    loadWebsites();
  }, [loadWebsites]);

  // Poll overview + traffic every 30s
  useEffect(() => {
    loadOverview();
    const interval = setInterval(loadOverview, 30000);
    return () => clearInterval(interval);
  }, [selectedWebsite?.id, period, loadOverview]);

  // Tick seconds-since-last-update counter
  useEffect(() => {
    const timer = setInterval(() => {
      if (!lastUpdated) return;
      setSecondsAgo(Math.round((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Poll realtime endpoint every 10s (only in realtime mode)
  useEffect(() => {
    if (mode !== "realtime" || !selectedWebsite?.id) return;

    const fetchRealtime = async () => {
      try {
        const { data } = await api.get(`/realtime/${selectedWebsite.id}/active/`);
        setRealtimeData({
          active_visitors: data.active_visitors ?? 0,
          active_pages: data.active_pages?.slice(0, 3) ?? [],
        });
      } catch {
        setRealtimeData({ active_visitors: 0, active_pages: [] });
      }
    };

    fetchRealtime();
    const interval = setInterval(fetchRealtime, 10000);
    return () => clearInterval(interval);
  }, [mode, selectedWebsite?.id]);

  const current = overview?.current || {};

  const liveStatus = useMemo(() => ({
    fresh: secondsAgo <= 60,
    text: lastUpdated ? `${secondsAgo}s ago` : "Not yet refreshed",
  }), [lastUpdated, secondsAgo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">
                {mode === "realtime" ? "Real-time Dashboard" : "Overview Dashboard"}
              </h1>
              {mode === "realtime" && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {selectedWebsite?.name || "Create a website to begin tracking."}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {["7d", "14d", "30d", "90d"].map((item) => (
            <button
              key={item}
              onClick={() => setPeriod(item)}
              className={`rounded-lg px-3 py-2 text-sm ${
                period === item
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                  : "bg-white dark:bg-slate-900"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {!websites.length ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">No websites yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Add a website from Website Management to receive a tracking snippet.
          </p>
        </section>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Visitors" value={current.visitors ?? 0} change={overview?.changes?.visitors ?? 0} icon={Users} />
            <MetricCard label="Page views" value={current.page_views ?? 0} change={overview?.changes?.page_views ?? 0} icon={Eye} />
            <MetricCard label="Sessions" value={current.sessions ?? 0} change={overview?.changes?.sessions ?? 0} icon={Activity} />
            <MetricCard label="Bounce rate" value={`${Math.round(current.bounce_rate ?? 0)}%`} change={overview?.changes?.bounce_rate ?? 0} icon={MousePointerClick} />
          </div>

          {/* Traffic chart */}
          <ChartPanel title="Traffic trend" data={traffic} />

          {/* Live indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                liveStatus.fresh ? "animate-pulse bg-green-400" : "bg-slate-400"
              }`}
            />
            Last updated: {liveStatus.text}
            {!liveStatus.fresh && (
              <button
                onClick={loadOverview}
                className="ml-1 text-slate-500 underline hover:text-slate-700"
              >
                Refresh now
              </button>
            )}
          </div>

          {/* Realtime section */}
          {mode === "realtime" && (
            <section className="grid gap-4 lg:grid-cols-3">
              {/* Card 1: Active visitors */}
              <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Radio className="text-red-500" size={18} />
                  <span className="text-sm font-medium text-slate-500">Active visitors</span>
                </div>
                <p className="mt-3 text-4xl font-semibold tabular-nums">
                  {realtimeData.active_visitors}
                </p>
                <p className="mt-1 text-xs text-slate-400">right now on site</p>
              </div>

              {/* Card 2: Active pages */}
              <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Globe className="text-teal-500" size={18} />
                  <span className="text-sm font-medium text-slate-500">Active pages</span>
                </div>
                {realtimeData.active_pages.length ? (
                  <ul className="mt-3 space-y-2">
                    {realtimeData.active_pages.map((page, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">
                          {page.url?.replace(/^https?:\/\/[^/]+/, "") || "/"}
                        </span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold dark:bg-slate-800">
                          {page.count ?? 1}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">No active pages</p>
                )}
              </div>

              {/* Card 3: Last event time */}
              <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Activity className="text-violet-500" size={18} />
                  <span className="text-sm font-medium text-slate-500">Last event</span>
                </div>
                <p className="mt-3 text-2xl font-semibold">
                  {liveStatus.text}
                </p>
                <p className="mt-1 text-xs text-slate-400">since last tracked event</p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}