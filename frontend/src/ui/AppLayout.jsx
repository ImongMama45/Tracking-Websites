import {
  Activity, Bell, BookOpen, Globe2, LayoutDashboard, LogOut, Map, MonitorSmartphone,
  MousePointerClick, RadioTower, Settings, Share2, Users, Workflow
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../state/authStore.js";

const nav = [
  ["/", LayoutDashboard, "Overview"],
  ["/realtime", RadioTower, "Real-time"],
  ["/visitors", Users, "Visitors"],
  ["/sessions", Workflow, "Sessions"],
  ["/events", MousePointerClick, "Events"],
  ["/sources", Share2, "Sources"],
  ["/geography", Map, "Geography"],
  ["/devices", MonitorSmartphone, "Devices"],
  ["/websites", Globe2, "Websites"],
  ["/notifications", Bell, "Alerts"],
  ["/guide", BookOpen, "Guide"],
  ["/settings", Settings, "Settings"]
];

export default function AppLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-mist text-ink dark:bg-slate-950 dark:text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white">
            <Activity size={20} />
          </span>
          <div>
            <p className="font-semibold">Pelec Analytics</p>
            <p className="text-xs text-slate-500">Traffic command center</p>
          </div>
        </div>
        <nav className="mt-8 space-y-1">
          {nav.map(([href, Icon, label]) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Workspace</p>
              <h2 className="text-lg font-semibold">{user?.company || user?.email || "Analytics"}</h2>
            </div>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
