
"use client";

import Link from "next/link";
import React from "react";
import {
  ArrowRight,
  CreditCard,
  Users,
  Wallet,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  return (
    <>
      <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
        {/* Background Glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-200px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />

          <div className="absolute bottom-[-200px] right-[-100px] h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse-slow" />
        </div>

        {/* Navbar */}
        <nav className="relative z-10 border-b border-slate-800/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link
              href="/"
              className="text-2xl font-bold transition-transform duration-300 hover:scale-105"
            >
              BakiGuard <span className="text-blue-500">AI</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-slate-800 hover:text-white"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
              >
                Register
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative z-10 mx-auto flex min-h-[80vh] max-w-7xl items-center px-6 py-20">
          <div className="grid w-full items-center gap-16 lg:grid-cols-2">
            {/* Left */}
            <div className="animate-fade-in">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
                <ShieldCheck size={16} />
                Smart Business Management
              </div>

              <h1 className="text-5xl font-bold leading-tight sm:text-6xl">
                Manage your
                <span className="block text-blue-500">
                  customers & baki
                </span>
                with confidence.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
                BakiGuard AI helps businesses manage customers, track credit
                and payments, and keep complete transaction records in one
                simple platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="group flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20"
                >
                  Get Started

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  href="/login"
                  className="rounded-lg border border-slate-700 px-6 py-3 font-semibold transition-all duration-300 hover:-translate-y-1 hover:border-slate-500 hover:bg-slate-800"
                >
                  Login
                </Link>
              </div>
            </div>

            {/* Right animated dashboard preview */}
            <div className="relative flex justify-center animate-float">
              <div className="relative w-full max-w-md">
                {/* Glow */}
                <div className="absolute inset-0 rounded-3xl bg-blue-600/20 blur-3xl" />

                {/* Card */}
                <div className="relative rounded-3xl border border-slate-700 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">
                        Total Outstanding
                      </p>

                      <h3 className="mt-2 text-3xl font-bold">
                        ৳ 48,500
                      </h3>
                    </div>

                    <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                      <Wallet size={28} />
                    </div>
                  </div>

                  {/* Fake chart */}
                  <div className="mt-8 flex h-32 items-end gap-3">
                    {[45, 65, 50, 80, 60, 90, 72].map((height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t-md bg-blue-500/70 transition-all duration-500 hover:bg-blue-400"
                        style={{
                          height: `${height}%`,
                          animationDelay: `${index * 100}ms`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Transactions */}
                  <div className="mt-8 space-y-3">
                    <Transaction
                      name="Rahim Store"
                      amount="৳ 12,500"
                    />

                    <Transaction
                      name="Karim Enterprise"
                      amount="৳ 8,200"
                    />

                    <Transaction
                      name="Hasan Traders"
                      amount="৳ 5,800"
                    />
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -right-5 top-10 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 shadow-xl animate-float-slow">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/10 p-2 text-green-400">
                      <CreditCard size={18} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Payment Received
                      </p>

                      <p className="font-semibold text-green-400">
                        + ৳ 2,500
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="relative z-10 border-t border-slate-800/70 bg-slate-900/40 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-14 max-w-2xl text-center animate-fade-up">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-500">
                Features
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Everything you need to manage baki
              </h2>

              <p className="mt-4 text-slate-400">
                Keep your customers, payments, and transactions organized in
                one place.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Feature
                icon={<Users size={24} />}
                title="Customer Management"
                description="Add, edit and manage all your customers from a single dashboard."
              />

              <Feature
                icon={<Wallet size={24} />}
                title="Baki Tracking"
                description="Know exactly how much each customer owes at any time."
              />

              <Feature
                icon={<CreditCard size={24} />}
                title="Transactions"
                description="Record credits and payments with a complete transaction history."
              />

              <Feature
                icon={<BarChart3 size={24} />}
                title="Business Dashboard"
                description="Get a clear overview of your business and customer balances."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 px-6 py-24">
          <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center shadow-xl animate-fade-up">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to take control of your baki?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Start managing your customers and transactions smarter with
              BakiGuard AI.
            </p>

            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
            >
              Create Your Account
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-800 py-6 text-center text-sm text-slate-500">
          © 2026 BakiGuard AI. All rights reserved.
        </footer>
      </main>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
          }

          50% {
            opacity: 0.6;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-fade-up {
          animation: fade-up 0.8s ease-out forwards;
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900 p-6 opacity-0 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 animate-fade-up">
      <div className="mb-4 inline-flex rounded-lg bg-blue-500/10 p-3 text-blue-500 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function Transaction({
  name,
  amount,
}: {
  name: string;
  amount: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-800/50 p-3 transition-all duration-300 hover:bg-slate-800">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-400">
          {name.charAt(0)}
        </div>

        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-slate-500">Customer</p>
        </div>
      </div>

      <p className="text-sm font-semibold text-red-400">
        {amount}
      </p>
    </div>
  );
}

