"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Maximize2, Shield, Lock, User, ArrowRight, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("captain@crewarena.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase client is not configured.");
      }

      // 1. Sign in with password using Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const authUser = data.user;
      if (!authUser) {
        throw new Error("Login failed. No user returned.");
      }

      // 2. Set current user ID
      if (!db) return;
      db.setCurrentUser(authUser.id);
      
      // 3. Trigger database sync to fetch the profile from Supabase
      await db.syncFromSupabase();

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-[#0A0A0F] text-text-primary font-body overflow-hidden">
      
      {/* Left side: Premium Animated Brand Montage */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 border-r border-border overflow-hidden">
        
        {/* Animated Grid / Particle Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Brand */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.3)] animate-pulse">
            <Maximize2 className="text-black stroke-[3px]" size={20} />
          </div>
          <span className="font-display text-xl font-bold tracking-widest uppercase">
            Crew Arena
          </span>
        </div>

        {/* Hero Quote */}
        <div className="my-auto space-y-6 z-10 max-w-md">
          <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent tracking-widest uppercase inline-block">
            MVP V1 Live
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold font-display leading-tight tracking-wide uppercase bg-gradient-to-r from-text-primary via-text-secondary to-accent bg-clip-text text-transparent">
            Automating the Path to Gaming Glory
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            The ultimate esports tournament lifecycle engine. Zero manual calculations, dynamic points distribution, live standings, and seamless Telegram room dispatch.
          </p>
        </div>

        {/* Footer info */}
        <div className="z-10 text-xs text-text-secondary/50">
          © {new Date().getFullYear()} Crew Arena. Built for Champions.
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/10 via-transparent to-accent/5 lg:hidden" />
        
        <div className="w-full max-w-md space-y-8 z-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-display uppercase tracking-wide">
              Sign In
            </h2>
            <p className="text-xs text-text-secondary">
              Enter your credentials to command your roster.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold animate-shake">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. captain@crewarena.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-accent text-text-primary transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-accent text-text-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover text-black py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Initialize Login</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Setup Tip info */}
          <div className="bg-surface border border-border/80 rounded-xl p-4 text-[11px] leading-relaxed text-text-secondary">
            💡 <span className="font-bold text-text-primary">Real Authentication Mode:</span>
            <p className="mt-1">
              Please register a new account to test the onboarding journey, or sign in with your verified Supabase user credentials.
            </p>
          </div>

          <div className="text-center text-xs text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-accent hover:underline font-bold">
              Register Team
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
