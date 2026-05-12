import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-2xl font-semibold">Reset password</h2>
      <p className="mt-3 text-sm text-slate-500">Enter your email and your team can wire this to the password reset endpoint when SMTP is configured.</p>
      <input className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="you@example.com" />
      <button className="mt-4 w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white">Send reset link</button>
      <Link className="mt-4 block text-center text-sm text-slate-500" to="/login">Back to sign in</Link>
    </section>
  );
}
