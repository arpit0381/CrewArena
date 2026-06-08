"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Maximize2, User, Phone, Edit, ArrowRight, Mail, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.trim() || !password.trim() || !username.trim() || !displayName.trim()) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      // Check if username already exists locally/db
      if (!db) return;
      const profiles = db.getProfiles();
      const exists = profiles.some(p => p.username === username.toLowerCase().trim());
      if (exists) {
        throw new Error("Username already taken. Please choose another one.");
      }

      // 1. Sign up user in Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const authUser = data.user;
      if (!authUser) {
        throw new Error("Registration failed. No user returned.");
      }

      // 2. Create profile entry in Supabase user table and local DB cache
      const profile = {
        id: authUser.id,
        username: username.toLowerCase().trim(),
        name: displayName.trim(),
        display_name: displayName.trim(),
        avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
        phone: phone.trim(),
        city: "",
        game_uid: "",
        telegram_username: "",
        telegram_id: null,
        role: "player" as const,
        created_at: new Date().toISOString()
      };

      // Write to Supabase users table with upsert to prevent duplicate key constraint issues
      const { error: profileError } = await supabase
        .from("users")
        .upsert({
          id: profile.id,
          username: profile.username,
          name: profile.name,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          phone: profile.phone,
          city: profile.city,
          game_uid: profile.game_uid,
          telegram_username: profile.telegram_username,
          telegram_id: profile.telegram_id,
          role: profile.role,
          created_at: profile.created_at
        });

      if (profileError) {
        console.error("Profile DB insert error details:", {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        });
        throw new Error(`Profile database registration failed: ${profileError.message || "RLS Policy Restriction"}`);
      }

      // Set state locally and sync after successful insert
      if (!db) return;
      db.setCurrentUser(profile.id);
      db.getProfiles().push(profile);
      await db.syncFromSupabase();

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-[#0A0A0F] text-text-primary font-body overflow-hidden">
      
      {/* Left side: Cyberpunk aesthetic montage */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 border-r border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.3)]">
            <Maximize2 className="text-black stroke-[3px]" size={20} />
          </div>
          <span className="font-display text-xl font-bold tracking-widest uppercase">
            Crew Arena
          </span>
        </div>

        <div className="my-auto space-y-6 z-10 max-w-md">
          <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent tracking-widest uppercase inline-block">
            Forge Your Destiny
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold font-display leading-tight tracking-wide uppercase bg-gradient-to-r from-text-primary via-text-secondary to-accent bg-clip-text text-transparent">
            Join the Next Era of Arena Matches
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Create an esports profile, link your Telegram chat, assemble your gaming roster, register for open leagues, and track points live in real-time.
          </p>
        </div>

        <div className="z-10 text-xs text-text-secondary/50">
          © {new Date().getFullYear()} Crew Arena. Built for Champions.
        </div>
      </div>

      {/* Right side: Register form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/10 via-transparent to-accent/5 lg:hidden" />

        <div className="w-full max-w-md space-y-8 z-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-display uppercase tracking-wide">
              Create Profile
            </h2>
            <p className="text-xs text-text-secondary">
              Set up your fighter card and join teams.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
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
                  placeholder="e.g. aditya@mail.com"
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

            <div className="space-y-1.5 border-t border-border/25 pt-3">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Username (Lower case)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. aditya_gamer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-accent text-text-primary transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Display Name (In-Game Nickname)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                  <Edit size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADITYA・FF"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-accent text-text-primary transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  <span>Construct Card</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline font-bold">
              Sign In
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
