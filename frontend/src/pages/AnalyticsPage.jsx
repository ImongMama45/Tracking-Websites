import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  MousePointerClick, FileText, ArrowDown, Zap, Eye,
  Home, Search, Share2, ExternalLink,
  Smartphone, Monitor, Tablet,
  Globe2, ChevronDown,
} from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { api } from "../lib/api.js";
import { useDashboardStore } from "../state/dashboardStore.js";

// ─── ISO Alpha-2 → Numeric (world-atlas topojson uses numeric IDs) ────────────
const ISO2_NUM = {
  AF:"004",AL:"008",DZ:"012",AD:"020",AO:"024",AG:"028",AR:"032",AM:"051",
  AU:"036",AT:"040",AZ:"031",BS:"044",BH:"048",BD:"050",BB:"052",BY:"112",
  BE:"056",BZ:"084",BJ:"204",BT:"064",BO:"068",BA:"070",BW:"072",BR:"076",
  BN:"096",BG:"100",BF:"854",BI:"108",CV:"132",KH:"116",CM:"120",CA:"124",
  CF:"140",TD:"148",CL:"152",CN:"156",CO:"170",KM:"174",CG:"178",CD:"180",
  CR:"188",CI:"384",HR:"191",CU:"192",CY:"196",CZ:"203",DK:"208",DJ:"262",
  DM:"212",DO:"214",EC:"218",EG:"818",SV:"222",GQ:"226",ER:"232",EE:"233",
  SZ:"748",ET:"231",FJ:"242",FI:"246",FR:"250",GA:"266",GM:"270",GE:"268",
  DE:"276",GH:"288",GR:"300",GD:"308",GT:"320",GN:"324",GW:"624",GY:"328",
  HT:"332",HN:"340",HU:"348",IS:"352",IN:"356",ID:"360",IR:"364",IQ:"368",
  IE:"372",IL:"376",IT:"380",JM:"388",JP:"392",JO:"400",KZ:"398",KE:"404",
  KI:"296",KW:"414",KG:"417",LA:"418",LV:"428",LB:"422",LS:"426",LR:"430",
  LY:"434",LI:"438",LT:"440",LU:"442",MG:"450",MW:"454",MY:"458",MV:"462",
  ML:"466",MT:"470",MH:"584",MR:"478",MU:"480",MX:"484",FM:"583",MD:"498",
  MC:"492",MN:"496",ME:"499",MA:"504",MZ:"508",MM:"104",NA:"516",NR:"520",
  NP:"524",NL:"528",NZ:"554",NI:"558",NE:"562",NG:"566",NO:"578",OM:"512",
  PK:"586",PW:"585",PA:"591",PG:"598",PY:"600",PE:"604",PH:"608",PL:"616",
  PT:"620",QA:"634",RO:"642",RU:"643",RW:"646",KN:"659",LC:"662",VC:"670",
  WS:"882",SM:"674",ST:"678",SA:"682",SN:"686",RS:"688",SC:"690",SL:"694",
  SG:"702",SK:"703",SI:"705",SB:"090",SO:"706",ZA:"710",SS:"728",ES:"724",
  LK:"144",SD:"729",SR:"740",SE:"752",CH:"756",SY:"760",TW:"158",TJ:"762",
  TZ:"834",TH:"764",TL:"626",TG:"768",TO:"776",TT:"780",TN:"788",TR:"792",
  TM:"795",TV:"798",UG:"800",UA:"804",AE:"784",GB:"826",US:"840",UY:"858",
  UZ:"860",VU:"548",VE:"862",VN:"704",YE:"887",ZM:"894",ZW:"716",
};

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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
  direct:   { icon: Home,         label: "Direct",   color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/40",   border: "border-blue-200 dark:border-blue-900" },
  search:   { icon: Search,       label: "Search",   color: "text-green-500",  bg: "bg-green-50 dark:bg-green-950/40", border: "border-green-200 dark:border-green-900" },
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

// Percentage bar used in devices section
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

// ─── BUG 2: Visitors ──────────────────────────────────────────────────────────
function VisitorsView({ websiteId }) {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);

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

      {/* KPI summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Visitors",  value: totals.visitors },
          { label: "Total Page Views", value: totals.page_views },
          { label: "Total Sessions",  value: totals.sessions },
        ].map(({ label, value }) => (
          <Card key={label} className="p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {loading ? "—" : value.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      {/* Line chart */}
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

      {/* Table */}
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

// ─── BUG 5: Events ────────────────────────────────────────────────────────────
function EventsView({ websiteId }) {
  const [allRows, setAllRows]   = useState([]);
  const [filter, setFilter]     = useState("all");
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);

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

      {/* Filter pills */}
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

      {/* Table */}
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

      {/* Load more */}
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

// ─── BUG 6: Sources ───────────────────────────────────────────────────────────
function SourcesView({ websiteId }) {
  const [sources, setSources]     = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/${websiteId}/sources/`)
      .then(({ data }) => {
        setSources(data.sources   || []);
        setReferrers(data.referrers || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [websiteId]);

  const total  = useMemo(() => sources.reduce((s, r) => s + (r.sessions || 0), 0), [sources]);
  const byType = useMemo(() => Object.fromEntries(sources.map(s => [s.entry_type, s.sessions || 0])), [sources]);
  const refTotal = useMemo(() => referrers.reduce((s, r) => s + (r.sessions || 0), 0), [referrers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Traffic Sources</h1>
        <p className="text-sm text-slate-500">Where your visitors come from.</p>
      </div>

      {/* Source cards */}
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

      {/* Referrers */}
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

// ─── BUG 7: Geography ─────────────────────────────────────────────────────────
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

  // Build lookup keyed by numeric ISO code
  const countryMap = useMemo(() =>
    Object.fromEntries(
      countries
        .filter(c => ISO2_NUM[c.country_code])
        .map(c => [ISO2_NUM[c.country_code], c])
    ),
    [countries]
  );

  const maxSessions = useMemo(
    () => Math.max(1, ...countries.map(c => c.sessions || 0)),
    [countries]
  );

  const total = useMemo(
    () => countries.reduce((s, c) => s + (c.sessions || 0), 0),
    [countries]
  );

  const colorFor = (sessions) => {
    if (!sessions) return "#e2e8f0";
    const t = Math.min(sessions / maxSessions, 1);
    const r = Math.round(226 + (37  - 226) * t);
    const g = Math.round(232 + (99  - 232) * t);
    const b = Math.round(240 + (235 - 240) * t);
    return `rgb(${r},${g},${b})`;
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

      {/* World map */}
      <Card className="relative overflow-hidden p-4">
        {tooltip && (
          <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-white dark:text-slate-900">
            <p className="font-semibold">{tooltip.name}</p>
            <p>{tooltip.sessions.toLocaleString()} session{tooltip.sessions !== 1 ? "s" : ""}</p>
          </div>
        )}
        {/* Legend */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 text-xs text-slate-500">
          <span>Fewer</span>
          <div className="flex h-2 w-24 overflow-hidden rounded-full">
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
              <div key={i} className="flex-1" style={{ background: colorFor(t * maxSessions) }} />
            ))}
          </div>
          <span>More</span>
        </div>
        <ComposableMap projectionConfig={{ scale: 140 }} style={{ width: "100%", height: "auto" }}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const hit = countryMap[String(geo.id)];
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={colorFor(hit?.sessions || 0)}
                    stroke="#fff"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none", opacity: 0.75, cursor: "pointer" },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={() =>
                      setTooltip({
                        name:     hit?.country_name || geo.properties.name,
                        sessions: hit?.sessions || 0,
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Sessions</th>
              <th className="px-4 py-3">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={3} message="Loading…" />
            ) : sorted.length === 0 ? (
              <EmptyRow colSpan={3} />
            ) : sorted.map((c) => {
              const pct = total ? Math.round((c.sessions / total) * 100) : 0;
              return (
                <tr key={c.country_code} className="border-t border-slate-100 dark:border-slate-800">
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

// ─── BUG 8 (frontend): Devices ────────────────────────────────────────────────
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
    default: return <p className="text-slate-400">Unknown analytics type: {type}</p>;
  }
}