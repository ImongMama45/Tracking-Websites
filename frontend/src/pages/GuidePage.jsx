import {
  BarChart3,
  Bell,
  CheckCircle2,
  Code2,
  Download,
  Globe2,
  KeyRound,
  MousePointerClick,
  ShieldCheck,
} from "lucide-react";

const steps = [
  {
    title: "Create your account",
    icon: KeyRound,
    body: "Register or sign in to access your private analytics workspace. Your dashboard data is protected by authenticated API requests.",
  },
  {
    title: "Add a website",
    icon: Globe2,
    body: "Open Website Management, enter the website name and domain, then save it. The platform generates a unique tracking ID for that website.",
  },
  {
    title: "Install the tracking script",
    icon: Code2,
    body: "Copy the embed snippet from Website Management and paste it before the closing body tag of the website you want to track.",
  },
  {
    title: "Review analytics",
    icon: BarChart3,
    body: "Use the overview, visitors, sessions, events, sources, geography, and devices pages to understand traffic and engagement.",
  },
];

const analyticsSections = [
  ["Overview", "High-level KPI cards for visitors, page views, sessions, bounce rate, and traffic trends."],
  ["Real-time", "Live visitor activity, active users, and current page activity when tracking data is arriving."],
  ["Visitors", "Total, unique, returning, and active visitors across your selected date range."],
  ["Sessions", "Session count, duration, bounce rate, pages per session, entry pages, and exit pages."],
  ["Events", "Tracked clicks, form submissions, scroll events, and custom actions from the tracking SDK."],
  ["Sources", "Direct, referral, social, and search traffic breakdowns."],
  ["Geography", "Country and region distribution when location data is available."],
  ["Devices", "Device type, browser, and operating system analytics."],
];

const tips = [
  "Install only one tracking snippet per website to avoid duplicate page views.",
  "Use the website-specific tracking ID for the matching domain.",
  "Keep anonymized tracking enabled if you want stronger privacy protection.",
  "Use custom events for important actions such as signup buttons, pricing clicks, downloads, or purchases.",
  "Check traffic sources regularly to understand which channels bring the best audience.",
];

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">User Guide</p>
        <h1 className="mt-3 text-3xl font-semibold">How to use Pelec Analytics</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
          Follow these steps to connect a website, collect visitor activity, and turn tracking data into useful decisions for improving content, engagement, and audience reach.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map(({ title, icon: Icon, body }) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
              <Icon size={20} />
            </span>
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Dashboard Pages</h2>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {analyticsSections.map(([name, description]) => (
              <div key={name} className="grid gap-2 py-3 sm:grid-cols-[150px_1fr]">
                <p className="font-medium">{name}</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <MousePointerClick className="text-teal" size={20} />
              <h2 className="font-semibold">Tracking Events</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              The tracker automatically captures page views, clicks, form submissions, scroll depth, and time on page. For custom actions, call <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">window.pelecTrack("Event Name", properties)</code>.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Download className="text-violet" size={20} />
              <h2 className="font-semibold">Reports</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Export CSV reports from the reports API when you need offline analysis or stakeholder summaries.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Bell className="text-orange-500" size={20} />
              <h2 className="font-semibold">Notifications</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Use the notifications center to review traffic spikes, unusual activity, and summary alerts as alert rules are configured.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-brand" size={22} />
          <h2 className="text-lg font-semibold">Best Practices</h2>
        </div>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={18} />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
