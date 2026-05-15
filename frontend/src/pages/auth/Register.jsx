import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../state/authStore.js";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", company: "", password: "", password2: "" });
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const formatError = (error) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (Array.isArray(error)) return error.join(" ");
    if (typeof error === "object") {
      return Object.entries(error)
        .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : value}`)
        .join(" \n");
    }
    return String(error);
  };

  async function submit(event) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const validationErrors = {};
    if (!form.email.trim()) validationErrors.email = ["Email is required."];
    if (!form.password) validationErrors.password = ["Password is required."];
    if (!form.password2) validationErrors.password2 = ["Please confirm your password."];
    if (form.password && form.password.length < 8) validationErrors.password = ["Password must be at least 8 characters."];
    if (form.password && form.password2 && form.password !== form.password2) validationErrors.password2 = ["Passwords must match."];

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    try {
      await register(form);
      navigate("/");
    } catch (e) {
      const responseData = e.response?.data;
      if (responseData && typeof responseData === "object") {
        setFieldErrors(responseData);
        if (responseData.non_field_errors) {
          setFormError(responseData.non_field_errors);
        } else if (typeof responseData.detail === "string") {
          setFormError(responseData.detail);
        } else {
          setFormError("Please fix the highlighted fields.");
        }
      } else {
        setFormError(e.response?.statusText || e.message || "Registration failed.");
      }
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-2xl font-semibold">Create account</h2>
      {formError && (
        <div className="mt-4 whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formatError(formError)}
        </div>
      )}
            {['email', 'first_name', 'last_name', 'company'].map((field) => (
        <label key={field} className="mt-4 block text-sm font-medium capitalize">
          {field.replace("_", " ")}
          <input
            type={field === 'email' ? 'email' : 'text'}
            required={field === 'email'}
            aria-invalid={Boolean(fieldErrors[field])}
            className={`mt-2 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950 ${fieldErrors[field] ? 'border-red-500 ring-1 ring-red-200' : 'border-slate-300'}`}
            value={form[field]}
            onChange={(e) => {
              setForm({ ...form, [field]: e.target.value });
              if (fieldErrors[field]) {
                setFieldErrors({ ...fieldErrors, [field]: undefined });
              }
            }}
          />
          {fieldErrors[field] && (
            <p className="mt-1 text-sm text-red-600">{formatError(fieldErrors[field])}</p>
          )}
        </label>
      ))}

      <label className="mt-4 block text-sm font-medium">Password</label>
      <input
        type="password"
        required
        minLength={8}
        aria-invalid={Boolean(fieldErrors.password)}
        className={`mt-2 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950 ${fieldErrors.password ? 'border-red-500 ring-1 ring-red-200' : 'border-slate-300'}`}
        value={form.password}
        onChange={(e) => {
          setForm({ ...form, password: e.target.value });
          if (fieldErrors.password) {
            setFieldErrors({ ...fieldErrors, password: undefined });
          }
        }}
      />
      {fieldErrors.password && (
        <p className="mt-1 text-sm text-red-600">{formatError(fieldErrors.password)}</p>
      )}
      <label className="mt-4 block text-sm font-medium">Confirm password</label>
      <input
        type="password"
        required
        aria-invalid={Boolean(fieldErrors.password2)}
        className={`mt-2 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950 ${fieldErrors.password2 ? 'border-red-500 ring-1 ring-red-200' : 'border-slate-300'}`}
        value={form.password2}
        onChange={(e) => {
          setForm({ ...form, password2: e.target.value });
          if (fieldErrors.password2) {
            setFieldErrors({ ...fieldErrors, password2: undefined });
          }
        }}
      />
      {fieldErrors.password2 && (
        <p className="mt-1 text-sm text-red-600">{formatError(fieldErrors.password2)}</p>
      )}
      <button className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white">Create account</button>
      <Link className="mt-4 block text-center text-sm text-slate-500" to="/login">Already have an account</Link>
    </form>
  );
}
