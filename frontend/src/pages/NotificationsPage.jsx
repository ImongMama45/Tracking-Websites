import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  async function load() {
    const { data } = await api.get("/notifications/");
    setItems(data.results || data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifications Center</h1>
        <p className="text-sm text-slate-500">Traffic spikes, weekly summaries, and system alerts.</p>
      </div>
      <section className="space-y-3">
        {items.length ? items.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between gap-3">
              <h2 className="font-semibold">{item.title}</h2>
              <span className="text-xs uppercase text-slate-500">{item.level}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{item.message}</p>
          </article>
        )) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">No notifications yet.</div>
        )}
      </section>
    </div>
  );
}
