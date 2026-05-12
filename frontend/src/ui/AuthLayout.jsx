import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-mist text-ink dark:bg-slate-950 dark:text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_420px]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Pelec Analytics</p>
          <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight">
            Website intelligence for fast teams.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Track visitors, sessions, sources, devices, events, and live activity from one focused dashboard.
          </p>
        </section>
        <Outlet />
      </div>
    </main>
  );
}
