"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Trophy, 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Settings, 
  Maximize2,
  ListOrdered
} from "lucide-react";

interface SidebarProps {
  userRole: "player" | "admin";
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const playerLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/team", label: "Team Space", icon: Users },
    { href: "/leaderboard", label: "Leaderboard", icon: ListOrdered },
    { href: "/profile", label: "Profile Settings", icon: Settings },
  ];

  const adminLinks = [
    { href: "/admin", label: "Analytics", icon: ShieldAlert },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border shrink-0">
      {/* Brand logo */}
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg overflow-hidden border border-accent/20 flex items-center justify-center shadow-[0_0_15px_rgba(var(--accent-rgb),0.25)] bg-background">
          <img src="/logo.png" alt="Crew Arena Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-lg font-bold tracking-wider text-text-primary uppercase">
            Crew Arena
          </span>
          <span className="text-[9px] font-bold text-accent uppercase tracking-widest leading-none">
            MVP Engine V1
          </span>
        </div>
      </div>

      {/* Main navigation list */}
      <div className="flex-1 px-4 py-6 space-y-7 overflow-y-auto">
        {/* Player section */}
        <div className="space-y-2">
          <span className="px-3 text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest block mb-2">
            Player HQ
          </span>
          {playerLinks.map((link) => {
            const ActiveIcon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-accent/10 border-accent/30 text-accent"
                    : "bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-background/40"
                }`}
              >
                <ActiveIcon size={18} className={active ? "text-accent" : "text-text-secondary"} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Admin section */}
        {userRole === "admin" && (
          <div className="space-y-2">
            <span className="px-3 text-[10px] font-bold text-red-500/60 uppercase tracking-widest block mb-2">
              Command Deck
            </span>
            {adminLinks.map((link) => {
              const ActiveIcon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-background/40"
                  }`}
                >
                  <ActiveIcon size={18} className={active ? "text-red-400" : "text-text-secondary"} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-background/20 text-center">
        <p className="text-[10px] text-text-secondary/60">
          Logged in as <span className="text-text-primary font-bold">{userRole === "admin" ? "Admin" : "Player"}</span>
        </p>
      </div>
    </aside>
  );
}
