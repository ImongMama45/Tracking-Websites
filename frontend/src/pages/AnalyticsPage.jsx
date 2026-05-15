import { useEffect, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import ChartPanel from "../ui/ChartPanel.jsx";
import { api } from "../lib/api.js";
import { useDashboardStore } from "../state/dashboardStore.js";

const titles = {
  visitors: "Visitors Analytics",
  sessions: "Sessions Analytics",
  events: "Events Analytics",
  sources: "Traffic Sources",
  geography: "Geography Analytics",
  devices: "Devices & Browsers"
};

const colors = ["#2563eb", "#14b8a6", "#7c3aed", "#f97316", "#0f172a"];

export default function AnalyticsPage({ type }) {
  const selectedWebsite = useDashboardStore((state) => state.selectedWebsite);
  const loadWebsites = useDashboardStore((state) => state.loadWebsites);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    loadWebsites();
  }, [loadWebsites]);

  useEffect(() => {
    async function load() {
      if (!selectedWebsite) return;
      if (type === "sessions") {
        const { data } = await api.get(`/sessions/?website=${selectedWebsite.id}`);
        setRows(data.results || data);
      } else if (type === "events") {
        const { data } = await api.get(`/events/?website=${selectedWebsite.id}`);
        const rawRows = data.results || data;
        // Flatten properties.url to top level for consistent mapping
        setRows(rawRows.map(row => ({
          ...row,
          url: row.properties?.url || ''
        })));
      } else {
        const endpoint = type === "sources" ? "sources" : type === "geography" ? "locations" : type === "devices" ? "devices" : "pages";
        const { data } = await api.get(`/analytics/${selectedWebsite.id}/${endpoint}/`);
        setRows(data.data || data.sources || data.countries || data.device_types || []);
      }
    }
    load();
  }, [selectedWebsite?.id, type]);

  const chartData = rows.slice(0, 5).map((row, index) => ({
    name: row.path                          // pages
      || row.entry_type                    // sources
      || row.event_name                    // events (from EventStatsView)
      || row.country_code                  // locations (country_name may be blank)
      || row.device_type                   // devices
      || `Metric ${index + 1}`,
    value: row.views
        || row.sessions
        || row.count
        || row.unique_visitors
        || 1
  }));
   

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{titles[type]}</h1>
        <p className="text-sm text-slate-500">Filtered for {selectedWebsite?.name || "your selected website"}.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold">Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={96}>
                  {chartData.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.name} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.value}</td>
                  <td className="px-4 py-3 capitalize">{type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
