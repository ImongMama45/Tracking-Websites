import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  MousePointerClick, FileText, ArrowDown, Zap, Eye,
  Home, Search, Share2, ExternalLink,
  Smartphone, Monitor, Tablet,
  Globe2, ChevronDown,
  Workflow, Clock, TrendingUp, TrendingDown,
} from "lucide-react";
import { api } from "../lib/api.js";
import { useDashboardStore } from "../state/dashboardStore.js";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";


// ─── Event config ─────────────────────────────────────────────────────────────
const EVENT_ICONS = {
  click:       MousePointerClick,
  form_submit: FileText,
  scroll:      ArrowDown,
  custom:      Zap,
  pageview:    Eye,
};
const EVENT_TYPES = ["all", "click", "form_submit", "scroll", "custom", "pageview"];

// ─── Source config ────────────────────────────────────────────────────────────
const SOURCE_CONFIG = {
  direct:   { icon: Home,         label: "Direct",   color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/40",     border: "border-blue-200 dark:border-blue-900" },
  search:   { icon: Search,       label: "Search",   color: "text-green-500",  bg: "bg-green-50 dark:bg-green-950/40",   border: "border-green-200 dark:border-green-900" },
  social:   { icon: Share2,       label: "Social",   color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-900" },
  referral: { icon: ExternalLink, label: "Referral", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-200 dark:border-orange-900" },
};

// ─── Device config ────────────────────────────────────────────────────────────
const DEVICE_ICONS = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

// ─── Shared helpers ───────────────────────────────────────────────────────────
const stripDomain = (url) => {
  if (!url) return "—";
  try { return new URL(url).pathname || "/"; } catch { return url; }
};

const fmtTime = (str) => {
  if (!str) return "—";
  return new Date(str).toLocaleString();
};

const fmtDuration = (sec) => {
  if (!sec) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const PAGE_SIZE = 25;

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {children}
    </div>
  );
}

function EmptyRow({ colSpan, message = "No data yet" }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-slate-400">{message}</td>
    </tr>
  );
}

function PillBar({ label, count, total, icon: Icon }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <li>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium capitalize">
          {Icon && <Icon size={14} className="text-slate-400" />}
          {label}
        </span>
        <span className="text-slate-500">
          {count.toLocaleString()} <span className="text-slate-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

// Shared bar-table used by Sessions entry/exit pages
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


// ─── Visitors ─────────────────────────────────────────────────────────────────
function VisitorsView({ websiteId }) {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/${websiteId}/traffic/?period=30d`)
      .then(({ data }) => setRows(data.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [websiteId]);

  const totals = useMemo(() => ({
    visitors:   rows.reduce((s, r) => s + (r.visitors   || 0), 0),
    page_views: rows.reduce((s, r) => s + (r.page_views || 0), 0),
    sessions:   rows.reduce((s, r) => s + (r.sessions   || 0), 0),
  }), [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Visitors Analytics</h1>
        <p className="text-sm text-slate-500">30-day visitor breakdown.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Visitors",   value: totals.visitors },
          { label: "Total Page Views", value: totals.page_views },
          { label: "Total Sessions",   value: totals.sessions },
        ].map(({ label, value }) => (
          <Card key={label} className="p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {loading ? "—" : value.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Visitor Trend</h2>
        <div className="h-72">
          {!rows.length ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-slate-400 dark:border-slate-700">
              {loading ? "Loading…" : "No data"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="visitors"   stroke="#2563eb" strokeWidth={2} dot={false} name="Visitors" />
                <Line type="monotone" dataKey="page_views" stroke="#14b8a6" strokeWidth={2} dot={false} name="Page Views" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
            <tr>
              {["Date", "Visitors", "Page Views", "Sessions"].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={4} message="Loading…" />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={4} />
            ) : rows.map((r) => (
              <tr key={r.date} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3 tabular-nums">{(r.visitors   ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3 tabular-nums">{(r.page_views ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3 tabular-nums">{(r.sessions   ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}


// ─── Events ───────────────────────────────────────────────────────────────────
function EventsView({ websiteId }) {
  const [allRows, setAllRows] = useState([]);
  const [filter, setFilter]   = useState("all");
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/events/?website=${websiteId}&ordering=-occurred_at&limit=500`)
      .then(({ data }) => {
        const raw = data.results || data;
        setAllRows(
          raw.map(r => ({
            ...r,
            url: r.properties?.url || r.properties?.href || "",
          }))
        );
      })
      .catch(() => setAllRows([]))
      .finally(() => setLoading(false));
  }, [websiteId]);

  const filtered = useMemo(() =>
    filter === "all" ? allRows : allRows.filter(r => r.event_type === filter),
    [allRows, filter]
  );

  const visible = filtered.slice(0, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Events Analytics</h1>
        <p className="text-sm text-slate-500">Full event history, sorted newest first.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {EVENT_TYPES.map(t => {
          const Icon = EVENT_ICONS[t];
          return (
            <button
              key={t}
              onClick={() => { setFilter(t); setPage(1); }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === t
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {Icon && <Icon size={12} />}
              {t === "all" ? "All" : t.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Event Name</th>
                <th className="px-4 py-3">Page URL</th>
                <th className="px-4 py-3 whitespace-nowrap">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={4} message="Loading…" />
              ) : visible.length === 0 ? (
                <EmptyRow colSpan={4} message="No events found." />
              ) : visible.map((r) => {
                const Icon = EVENT_ICONS[r.event_type] || Zap;
                return (
                  <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize dark:bg-slate-800">
                        <Icon size={11} />
                        {r.event_type?.replace(/_/g, " ") || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.event_name || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{stripDomain(r.url) || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">{fmtTime(r.occurred_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {visible.length < filtered.length && (
        <div className="text-center">
          <button
            onClick={() => setPage(p => p + 1)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ChevronDown size={14} />
            Load more ({filtered.length - visible.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}


// ─── Sources ──────────────────────────────────────────────────────────────────
function SourcesView({ websiteId }) {
  const [sources, setSources]     = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/${websiteId}/sources/`)
      .then(({ data }) => {
        setSources(data.sources     || []);
        setReferrers(data.referrers || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [websiteId]);

  const total    = useMemo(() => sources.reduce((s, r) => s + (r.sessions || 0), 0), [sources]);
  const byType   = useMemo(() => Object.fromEntries(sources.map(s => [s.entry_type, s.sessions || 0])), [sources]);
  const refTotal = useMemo(() => referrers.reduce((s, r) => s + (r.sessions || 0), 0), [referrers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Traffic Sources</h1>
        <p className="text-sm text-slate-500">Where your visitors come from.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => {
          const Icon  = cfg.icon;
          const count = byType[key] || 0;
          const pct   = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className={`rounded-lg border p-5 ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-center gap-3">
                <span className={`rounded-lg bg-white/60 p-2 dark:bg-black/20 ${cfg.color}`}>
                  <Icon size={20} />
                </span>
                <p className="font-medium">{cfg.label}</p>
              </div>
              <p className="mt-4 text-3xl font-semibold tabular-nums">
                {loading ? "—" : count.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-slate-500">{pct}% of total sessions</p>
            </div>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <h2 className="font-semibold">Top Referrer Domains</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Sessions</th>
              <th className="px-4 py-3">% of Referrals</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={3} message="Loading…" />
            ) : referrers.length === 0 ? (
              <EmptyRow colSpan={3} message="No referrer data yet." />
            ) : referrers.map((r) => {
              const pct = refTotal ? Math.round((r.sessions / refTotal) * 100) : 0;
              return (
                <tr key={r.referrer_domain} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{r.referrer_domain || "(direct)"}</td>
                  <td className="px-4 py-3 tabular-nums">{r.sessions}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-slate-500">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}


// ─── Geography ────────────────────────────────────────────────────────────────
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const NUMERIC_TO_ALPHA2 = {
  "004":"AF","008":"AL","012":"DZ","024":"AO","032":"AR","036":"AU","040":"AT",
  "050":"BD","056":"BE","068":"BO","076":"BR","100":"BG","116":"KH","120":"CM",
  "124":"CA","144":"LK","152":"CL","156":"CN","170":"CO","180":"CD","188":"CR",
  "191":"HR","192":"CU","203":"CZ","208":"DK","214":"DO","218":"EC","818":"EG",
  "222":"SV","231":"ET","246":"FI","250":"FR","276":"DE","288":"GH","300":"GR",
  "320":"GT","332":"HT","340":"HN","348":"HU","356":"IN","360":"ID","364":"IR",
  "368":"IQ","372":"IE","376":"IL","380":"IT","388":"JM","392":"JP","400":"JO",
  "404":"KE","408":"KP","410":"KR","414":"KW","418":"LA","422":"LB","426":"LS",
  "434":"LY","440":"LT","442":"LU","454":"MW","458":"MY","484":"MX","504":"MA",
  "508":"MZ","516":"NA","524":"NP","528":"NL","554":"NZ","558":"NI","566":"NG",
  "578":"NO","586":"PK","591":"PA","598":"PG","600":"PY","604":"PE","608":"PH",
  "616":"PL","620":"PT","630":"PR","634":"QA","642":"RO","643":"RU","682":"SA",
  "686":"SN","694":"SL","706":"SO","710":"ZA","724":"ES","729":"SD","752":"SE",
  "756":"CH","760":"SY","764":"TH","788":"TN","792":"TR","800":"UG","804":"UA",
  "784":"AE","826":"GB","840":"US","858":"UY","862":"VE","704":"VN","887":"YE",
  "894":"ZM","716":"ZW","pace":"PS",
};

function GeographyView({ websiteId }) {
  const [countries, setCountries] = useState([]);
  const [tooltip, setTooltip]     = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/${websiteId}/locations/`)
      .then(({ data }) => setCountries(data.countries || []))
      .catch(() => setCountries([]))
      .finally(() => setLoading(false));
  }, [websiteId]);

  const total = useMemo(
    () => countries.reduce((s, c) => s + (c.sessions || 0), 0),
    [countries]
  );

  const countryMap = useMemo(() => {
    const m = {};
    for (const c of countries) {
      if (c.country_code) m[c.country_code.toUpperCase()] = c.sessions || 0;
    }
    return m;
  }, [countries]);

  const maxSessions = useMemo(
    () => Math.max(1, ...Object.values(countryMap)),
    [countryMap]
  );

  const getColor = (alpha2) => {
    const val = countryMap[alpha2] || 0;
    if (!val) return "#e2e8f0";
    const l = Math.round(90 - (val / maxSessions) * 55);
    return `hsl(217,91%,${l}%)`;
  };

  const sorted = useMemo(
    () => [...countries].sort((a, b) => (b.sessions || 0) - (a.sessions || 0)),
    [countries]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Geography Analytics</h1>
        <p className="text-sm text-slate-500">Country-level visitor distribution.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Sessions</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {loading ? "—" : total.toLocaleString()}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Countries</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {loading ? "—" : sorted.length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Top Country</p>
          <p className="mt-2 text-lg font-semibold">
            {loading ? "—" : (sorted[0]?.country_name || "—")}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden p-4">
        <h2 className="mb-2 font-semibold">Visitor Map</h2>
        <div className="relative">
          <ComposableMap
            projectionConfig={{ scale: 140 }}
            width={800}
            height={400}
            style={{ width: "100%", height: "auto" }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const alpha2 = NUMERIC_TO_ALPHA2[String(geo.id)] || "";
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(alpha2)}
                      stroke="#fff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover:   { outline: "none", fill: "#f59e0b", cursor: "pointer" },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={() =>
                        setTooltip({ name: geo.properties.name || alpha2 || "Unknown", sessions: countryMap[alpha2] || 0 })
                      }
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {tooltip && (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <span className="font-semibold">{tooltip.name}</span>
              {" — "}
              <span>{tooltip.sessions.toLocaleString()} session{tooltip.sessions !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span>Fewer</span>
          <div className="h-2 w-32 rounded-full"
            style={{ background: "linear-gradient(to right, #e2e8f0, hsl(217,91%,35%))" }} />
          <span>More</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Sessions</th>
              <th className="px-4 py-3">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={4} message="Loading…" />
            ) : sorted.length === 0 ? (
              <EmptyRow colSpan={4} />
            ) : sorted.map((c, i) => {
              const pct = total ? Math.round((c.sessions / total) * 100) : 0;
              return (
                <tr key={c.country_code} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{c.country_name || c.country_code}</td>
                  <td className="px-4 py-3 tabular-nums">{c.sessions.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-slate-500">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}


// ─── Devices ──────────────────────────────────────────────────────────────────
function DevicesView({ websiteId }) {
  const [data, setData]       = useState({ device_types: [], browsers: [], os: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/${websiteId}/devices/`)
      .then(({ data: d }) => setData({
        device_types: d.device_types || [],
        browsers:     d.browsers     || [],
        os:           d.os           || [],
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [websiteId]);

  const Section = ({ title, rows, keyField, countField, icons }) => {
    const total = rows.reduce((s, r) => s + (r[countField] || 0), 0);
    return (
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">{title}</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-400">No data yet.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const key = (r[keyField] || "unknown").toLowerCase();
              return (
                <PillBar
                  key={key}
                  label={r[keyField] || "unknown"}
                  count={r[countField] || 0}
                  total={total}
                  icon={icons?.[key]}
                />
              );
            })}
          </ul>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Devices & Browsers</h1>
        <p className="text-sm text-slate-500">Device type, browser, and OS breakdown.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Device Types"      rows={data.device_types} keyField="device_type" countField="count" icons={DEVICE_ICONS} />
        <Section title="Browsers"          rows={data.browsers}     keyField="browser"      countField="count" />
        <Section title="Operating Systems" rows={data.os}           keyField="os"           countField="count" />
      </div>
    </div>
  );
}


// ─── Sessions ─────────────────────────────────────────────────────────────────
function SessionsView({ websiteId }) {
  const period = useDashboardStore(s => s.period);

  const [summary,    setSummary]    = useState(null);
  const [entryPages, setEntryPages] = useState([]);
  const [exitPages,  setExitPages]  = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/${websiteId}/sessions/?period=${period}`)
      .then(({ data }) => {
        setSummary(data.summary        || null);
        setEntryPages(data.entry_pages || []);
        setExitPages(data.exit_pages   || []);
        setSessions(data.sessions      || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [websiteId, period]);

  const kpis = [
    { label: "Total Sessions",  value: summary?.total_sessions?.toLocaleString() ?? "—", icon: Workflow },
    { label: "Bounce Rate",     value: summary ? `${summary.bounce_rate}%` : "—",         icon: MousePointerClick },
    { label: "Avg Duration",    value: summary ? fmtDuration(summary.avg_duration) : "—", icon: Clock },
    { label: "Pages / Session", value: summary?.avg_pages ?? "—",                         icon: FileText },
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
                <EmptyRow colSpan={8} message="Loading…" />
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


// ─── Root export ──────────────────────────────────────────────────────────────
export default function AnalyticsPage({ type }) {
  const selectedWebsite = useDashboardStore(s => s.selectedWebsite);
  const loadWebsites    = useDashboardStore(s => s.loadWebsites);

  useEffect(() => { loadWebsites(); }, [loadWebsites]);

  if (!selectedWebsite) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <Globe2 size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
        <p className="mt-3 font-medium text-slate-500">No website selected</p>
        <p className="mt-1 text-sm text-slate-400">Go to Website Management to add or select a website.</p>
      </div>
    );
  }

  const id = selectedWebsite.id;
  switch (type) {
    case "visitors":  return <VisitorsView  websiteId={id} />;
    case "events":    return <EventsView    websiteId={id} />;
    case "sources":   return <SourcesView   websiteId={id} />;
    case "geography": return <GeographyView websiteId={id} />;
    case "devices":   return <DevicesView   websiteId={id} />;
    case "sessions":  return <SessionsView  websiteId={id} />;
    default: return <p className="text-slate-400">Unknown analytics type: {type}</p>;
  }
}