"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { Tournament } from "@/types/database.types";
import { Maximize2, Trophy, ArrowRight, Shield, Zap, Sparkles, LayoutDashboard } from "lucide-react";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import TelegramSimulator from "@/components/layout/TelegramSimulator";

export default function LandingPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (db) {
      setTournaments(db.getTournaments().slice(0, 2));
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-screen bg-[#0A0A0F] text-text-primary font-body overflow-x-hidden flex flex-col justify-between">
      
      {/* Background aesthetics */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-accent/10 via-purple-600/5 to-transparent blur-3xl -z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10 pointer-events-none" />

      {/* Header / Nav */}
      <header className="max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-accent/20 flex items-center justify-center shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)] bg-background">
            <img src="/logo.png" alt="Crew Arena Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-lg font-bold tracking-widest uppercase text-text-primary">
            Crew Arena
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="bg-accent hover:bg-accent-hover text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition hover:scale-[1.02] flex items-center gap-1.5"
          >
            <LayoutDashboard size={14} />
            <span>Enter App</span>
          </Link>
        </div>
      </header>

      {/* Hero Core */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 md:py-20 text-center space-y-8 flex-1 flex flex-col justify-center items-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold text-accent tracking-widest uppercase animate-pulse">
          <Sparkles size={12} />
          <span>Esports Automation Engine MVP</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold font-display uppercase tracking-wide leading-tight max-w-3xl">
          Automate Your <span className="bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent">Esports Tournaments</span>
        </h1>
        
        <p className="text-text-secondary text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
          The admin-free tournament operations engine. Dynamic points calculation, live standings updating in realtime, instant bracket flows, and automated Telegram lobby dispatch.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-xs">
          <Link
            href="/dashboard"
            className="w-full bg-accent hover:bg-accent-hover text-black py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] transition"
          >
            <span>Enter Player HQ</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/login"
            className="w-full bg-surface hover:bg-background border border-border hover:border-text-secondary/50 py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition"
          >
            Admin Sign In
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-12 text-left">
          <div className="bg-surface/50 border border-border/80 rounded-2xl p-5 space-y-2.5">
            <Zap className="text-accent" size={18} />
            <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider">
              Auto Group Draw
            </h3>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Divide teams into rooms dynamically based on game format using verified Fisher-Yates shuffle.
            </p>
          </div>
          
          <div className="bg-surface/50 border border-border/80 rounded-2xl p-5 space-y-2.5">
            <Trophy className="text-accent" size={18} />
            <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider">
              Points Score Sheet
            </h3>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Enter positions/kills in a spreadsheet-style sheet. Placement and kill points recalculate instantly.
            </p>
          </div>

          <div className="bg-surface/50 border border-border/80 rounded-2xl p-5 space-y-2.5">
            <Shield className="text-accent" size={18} />
            <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-wider">
              Theme Control deck
            </h3>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Five selectable elite styles (cyber dark, neon night, forest ops, gold elite, light arena) to fit your guild brand.
            </p>
          </div>
        </div>

        <div className="w-full max-w-xl pt-4">
          <ThemeSwitcher />
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-text-secondary/50 max-w-7xl w-full mx-auto px-6">
        Crew Arena Engine V1.pair-programmed by Antigravity.
      </footer>

      {/* Notification bot simulator */}
      <TelegramSimulator />

    </div>
  );
}
