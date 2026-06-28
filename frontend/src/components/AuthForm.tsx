"use client";

import { useState } from "react";
import { api, ApiError, type User } from "@/lib/api";

interface AuthFormProps {
  onAuthed: (user: User) => void;
}

type Mode = "signin" | "signup";

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

export default function AuthForm({ onAuthed }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = isSignup
        ? await api.signup(email, password)
        : await api.signin(email, password);
      onAuthed(user);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="mb-6 flex items-center gap-2">
        <span className="text-xl font-bold tracking-tight text-brand-navy">PreLegal</span>
        <span className="rounded bg-brand-yellow px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-navy">
          Beta
        </span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-brand-navy">
        {isSignup ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-2 text-sm text-brand-gray">
        {isSignup
          ? "Sign up to draft legal documents with AI."
          : "Sign in to draft legal documents with AI."}
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={8}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isSignup && (
            <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Please wait…" : isSignup ? "Sign up" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-brand-gray">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <button
          type="button"
          className="font-semibold text-brand-purple underline underline-offset-2"
          onClick={() => {
            setMode(isSignup ? "signin" : "signup");
            setError(null);
          }}
        >
          {isSignup ? "Sign in" : "Sign up"}
        </button>
      </p>
    </div>
  );
}
