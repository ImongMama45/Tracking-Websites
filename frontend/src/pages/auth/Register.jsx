import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../state/authStore.js";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", company: "", password: "", password2: "" });

  async function submit(event) {
    event.preventDefault();
    await register(form);
    navigate("/");
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-2xl font-semibold">Create account</h2>
      {["email", "first_name", "last_name", "company"].map((field) => (
        <label key={field} className="mt-4 block text-sm font-medium capitalize">
          {field.replace("_", " ")}
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
        </label>
      ))}
      <label className="mt-4 block text-sm font-medium">Password</label>
      <input type="password" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <label className="mt-4 block text-sm font-medium">Confirm password</label>
      <input type="password" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.password2} onChange={(e) => setForm({ ...form, password2: e.target.value })} />
      <button className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white">Create account</button>
      <Link className="mt-4 block text-center text-sm text-slate-500" to="/login">Already have an account</Link>
    </form>
  );
}
