import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../state/authStore.js";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch {
      setError("Email or password is incorrect.");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-2xl font-semibold">Sign in</h2>
      <label className="mt-6 block text-sm font-medium">Email</label>
      <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label className="mt-4 block text-sm font-medium">Password</label>
      <input type="password" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white">Sign in</button>
      <div className="mt-4 flex justify-between text-sm text-slate-500">
        <Link to="/forgot-password">Forgot password</Link>
        <Link to="/register">Create account</Link>
      </div>
    </form>
  );
}
