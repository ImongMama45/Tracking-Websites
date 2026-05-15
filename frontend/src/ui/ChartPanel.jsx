import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ChartPanel({ title, data }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="h-80">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="visitors" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="page_views" stroke="#14b8a6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
