import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Bell, CheckCircle2, Info, RefreshCw } from "lucide-react";
import { api } from "../lib/api.js";

const LEVEL_CONFIG = {
  info:    { icon: Info,          color: "text-blue-500",  bg: "bg-blue-50 dark:bg-blue-950/40",  border: "border-blue-200 dark:border-blue-900"  },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-900" },
  error:   { icon: AlertCircle,   color: "text-red-500",   bg: "bg-red-50 dark:bg-red-950/40",    border: "border-red-200 dark:border-red-900"    },
  success: { icon: CheckCircle2,  color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/40", border: "border-green-200 dark:border-green-900" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/notifications/");
      setItems(data.results || data);
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications Center</h1>
          <p className="text-sm text-slate-500">Traffic spikes, weekly summaries, and system alerts.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="space-y-3">
        {loading && !items.length ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400 dark:border-slate-700 dark:bg-slate-900">
            Loading…
          </div>
        ) : items.length ? (
          items.map((item) => {
            const level = item.level?.toLowerCase() || "info";
            const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <article
                key={item.id}
                className={`rounded-lg border p-4 ${cfg.bg} ${cfg.border}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={18} className={`mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold text-sm">{item.title}</h2>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${cfg.color} bg-white/60 dark:bg-black/20`}>
                          {level}
                        </span>
                        <span className="text-xs text-slate-400">
                          {timeAgo(item.created_at || item.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-3 font-medium text-slate-500">No notifications yet</p>
            <p className="mt-1 text-sm text-slate-400">Alerts will appear here when traffic spikes or anomalies are detected.</p>
          </div>
        )}
      </section>
    </div>
  );
}