"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Loader2,
  ArrowRight,
} from "lucide-react";

import { loginUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await loginUser({
        email,
        password,
      });

      localStorage.setItem("accessToken", result.data.token);

      router.push("/dashboard");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="flex min-h-screen">

        {/* =====================================================
            BRAND SECTION
        ====================================================== */}
        <section className="relative hidden overflow-hidden bg-[#07110d] lg:flex lg:w-[52%]">
          {/* Ambient background */}
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />

          <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-teal-400/10 blur-[120px]" />

          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  BakiGuard
                </h2>

                <p className="text-xs text-white/40">
                  Smart business management
                </p>
              </div>
            </div>

            {/* Hero */}
            <div className="max-w-xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

                <span className="text-xs font-medium text-white/60">
                  Built for modern businesses
                </span>
              </div>

              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white xl:text-6xl">
                Know your money.
                <span className="mt-2 block text-emerald-400">
                  Grow your business.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-base leading-7 text-white/45 xl:text-lg">
                Manage customers, track outstanding balances, and keep
                your business finances organized from one simple dashboard.
              </p>

              {/* Feature cards */}
              <div className="mt-10 grid grid-cols-2 gap-4">

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </div>

                  <h3 className="text-sm font-semibold text-white">
                    Secure
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-white/35">
                    Your business information stays protected.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10">
                    <LockKeyhole className="h-5 w-5 text-teal-400" />
                  </div>

                  <h3 className="text-sm font-semibold text-white">
                    Reliable
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-white/35">
                    Everything you need, in one place.
                  </p>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-white/25">
              <span>
                © {new Date().getFullYear()} BakiGuard
              </span>

              <span>
                Secure · Simple · Powerful
              </span>
            </div>

          </div>
        </section>

        {/* =====================================================
            LOGIN SECTION
        ====================================================== */}
        <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[48%]">

          <div className="w-full max-w-[420px]">

            {/* Mobile logo */}
            <div className="mb-12 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  BakiGuard
                </h2>

                <p className="text-xs text-gray-400">
                  Smart business management
                </p>
              </div>
            </div>

            {/* Header */}
            <div className="mb-9">

              <p className="mb-3 text-sm font-semibold text-emerald-600">
                Welcome back
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Sign in to your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Enter your credentials to continue to your dashboard.
              </p>

            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5"
              >
                <div className="flex gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Login unsuccessful
                    </p>

                    <p className="mt-1 text-sm leading-5 text-red-600">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Email address
                </label>

                <div className="group relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-500"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    className="
                      h-14
                      w-full
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      pl-12
                      pr-4
                      text-sm
                      text-gray-900
                      shadow-sm
                      outline-none
                      transition-all
                      placeholder:text-gray-400
                      hover:border-gray-300
                      focus:border-emerald-500
                      focus:ring-4
                      focus:ring-emerald-500/10
                      disabled:cursor-not-allowed
                      disabled:bg-gray-50
                    "
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-800"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
                  >
                    Forgot password?
                  </button>

                </div>

                <div className="group relative">

                  <LockKeyhole
                    className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-500"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="
                      h-14
                      w-full
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      pl-12
                      pr-12
                      text-sm
                      text-gray-900
                      shadow-sm
                      outline-none
                      transition-all
                      placeholder:text-gray-400
                      hover:border-gray-300
                      focus:border-emerald-500
                      focus:ring-4
                      focus:ring-emerald-500/10
                      disabled:cursor-not-allowed
                      disabled:bg-gray-50
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="
                      absolute
                      right-2
                      top-1/2
                      flex
                      h-10
                      w-10
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-lg
                      text-gray-400
                      transition
                      hover:bg-gray-100
                      hover:text-gray-600
                    "
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>

                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="
                  group
                  flex
                  h-14
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-gray-950
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-gray-950/10
                  transition-all
                  hover:bg-gray-800
                  hover:shadow-xl
                  hover:shadow-gray-950/15
                  focus:outline-none
                  focus:ring-4
                  focus:ring-gray-950/10
                  active:scale-[0.99]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in

                    <ArrowRight
                      className="
                        h-4
                        w-4
                        transition-transform
                        group-hover:translate-x-1
                      "
                    />
                  </>
                )}
              </button>

            </form>

            {/* Security */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
              <LockKeyhole className="h-3.5 w-3.5" />

              <span>
                Secure and encrypted connection
              </span>
            </div>

            {/* Legal */}
            <p className="mt-7 text-center text-[11px] leading-5 text-gray-400">
              By continuing, you agree to our{" "}
              <button className="font-medium text-gray-600 hover:text-gray-900">
                Terms of Service
              </button>{" "}
              and{" "}
              <button className="font-medium text-gray-600 hover:text-gray-900">
                Privacy Policy
              </button>
              .
            </p>

          </div>
        </section>

      </div>
    </main>
  );
}