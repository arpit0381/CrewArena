"use client";

import React, { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { db } from "@/lib/db";
import { User, Team, Tournament, TournamentRegistration, MatchRoom } from "@/types/database.types";
import { 
  Trophy, 
  Sword, 
  Percent, 
  DollarSign, 
  Users, 
  Bell, 
  ChevronRight, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Gamepad2,
  MapPin,
  Smartphone,
  Tag,
  Smile
} from "lucide-react";
import Link from "next/link";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";



export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTourney, setActiveTourney] = useState<Tournament | null>(null);
  const [registration, setRegistration] = useState<TournamentRegistration | null>(null);
  const [rooms, setRooms] = useState<MatchRoom[]>([]);
  const [countdown, setCountdown] = useState("00h : 00m : 00s");

  // Dynamic dashboard stats states
  const [matchesPlayedCount, setMatchesPlayedCount] = useState(0);
  const [killsAverage, setKillsAverage] = useState("0.0");
  const [winRateText, setWinRateText] = useState("0%");
  const [earningsText, setEarningsText] = useState("₹0");
  const [performanceTrend, setPerformanceTrend] = useState<{ name: string; kills: number; placement: number }[]>([]);

  // Onboarding edit states
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editUid, setEditUid] = useState("");
  const [editTg, setEditTg] = useState("");

  const loadProfile = () => {
    if (!db) return;
    const currentUser = db.getCurrentUser();
    setUser(currentUser);
    
    setEditName(currentUser.name || "");
    setEditPhone(currentUser.phone || "");
    setEditCity(currentUser.city || "");
    setEditUid(currentUser.game_uid || "");
    setEditTg(currentUser.telegram_username || "");

    // Check if onboarding is needed
    if (!currentUser.phone || !currentUser.city || !currentUser.game_uid) {
      setIsOnboarding(true);
    } else {
      setIsOnboarding(false);
    }

    // Get user teams where they are captain or approved member
    const allTeams = db.getTeams();
    const myTeams = allTeams.filter(t => {
      if (t.captain_id === currentUser.id) return true;
      const members = db.getTeamMembers(t.id);
      return members.some(m => m.player_id === currentUser.id && m.status === "approved");
    });
    setTeams(myTeams);

    const myTeamIds = myTeams.map(t => t.id);

    // Set active tournament
    const allRegistrations = db.getRegistrations();
    const myRegs = allRegistrations.filter(r => myTeamIds.includes(r.team_id));
    
    let active: Tournament | null = null;
    let currentReg: TournamentRegistration | null = null;

    if (myRegs.length > 0) {
      currentReg = myRegs[0];
      active = db.getTournamentById(currentReg.tournament_id) || null;
      setRegistration(currentReg);
    }

    if (!active) {
      const allTourneys = db.getTournaments();
      if (allTourneys.length > 0) {
        const sorted = [...allTourneys].sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());
        active = sorted[0];
        setRegistration(null);
      }
    }

    if (active) {
      setActiveTourney(active);
      const activeRooms = db.getRoomsForTournament(active.id);
      setRooms(activeRooms);
    } else {
      setActiveTourney(null);
      setRegistration(null);
      setRooms([]);
    }

    // Compute stats dynamically
    const completedRooms = db.getRooms().filter(r => r.status === "completed");
    const myCompletedRooms = completedRooms.filter(room => {
      const assigns = db.getRoomAssignments(room.id);
      return assigns.some(assign => myTeamIds.includes(assign.team_id));
    });
    
    const totalMatches = myCompletedRooms.length;
    setMatchesPlayedCount(totalMatches);

    const myResults = db.getResults().filter(res => 
      myCompletedRooms.map(r => r.id).includes(res.match_id) && myTeamIds.includes(res.team_id)
    );

    const totalKills = myResults.reduce((sum, r) => sum + r.kills, 0);
    const avgKills = totalMatches > 0 ? (totalKills / totalMatches).toFixed(1) : "0.0";
    setKillsAverage(avgKills);

    const wins = myResults.filter(r => r.position === 1).length;
    const winRate = totalMatches > 0 ? `${Math.round((wins / totalMatches) * 100)}%` : "0%";
    setWinRateText(winRate);

    let totalEarnings = 0;
    db.getTournaments().forEach(t => {
      if (t.status === "completed") {
        if (t.champion_team_id && myTeamIds.includes(t.champion_team_id)) {
          totalEarnings += t.prize_pool;
        } else if (t.runner_up_team_id && myTeamIds.includes(t.runner_up_team_id)) {
          totalEarnings += Math.round(t.prize_pool * 0.3);
        }
      }
    });
    setEarningsText(`₹${totalEarnings.toLocaleString()}`);

    // Compute performance trend chart data
    const trend = myResults.map((res, index) => {
      const room = db.getRooms().find(r => r.id === res.match_id);
      return {
        name: room?.room_label || `Match ${index + 1}`,
        kills: res.kills,
        placement: res.position
      };
    }).reverse();

    if (trend.length === 0) {
      setPerformanceTrend([
        { name: "Match 1", kills: 0, placement: 0 },
        { name: "Match 2", kills: 0, placement: 0 },
        { name: "Match 3", kills: 0, placement: 0 }
      ]);
    } else {
      setPerformanceTrend(trend);
    }
  };

  useEffect(() => {
    loadProfile();
    window.addEventListener("db-sync", loadProfile);
    return () => window.removeEventListener("db-sync", loadProfile);
  }, []);

  // Separate dynamic countdown timer effect
  useEffect(() => {
    const updateTimer = () => {
      if (!activeTourney) {
        setCountdown("No Active League");
        return;
      }
      
      const targetTime = new Date(activeTourney.start_date || "").getTime();
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        const nextRoom = rooms.find(r => r.status === "pending" && r.scheduled_at);
        if (nextRoom && nextRoom.scheduled_at) {
          const roomDiff = new Date(nextRoom.scheduled_at).getTime() - now;
          if (roomDiff > 0) {
            const totalSecs = Math.floor(roomDiff / 1000);
            const hours = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
            const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
            const secs = String(totalSecs % 60).padStart(2, "0");
            setCountdown(`${hours}h : ${mins}m : ${secs}s`);
            return;
          }
        }
        setCountdown("Lobby Live / Ongoing");
      } else {
        const totalSecs = Math.floor(diff / 1000);
        const hours = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
        const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
        const secs = String(totalSecs % 60).padStart(2, "0");
        setCountdown(`${hours}h : ${mins}m : ${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeTourney, rooms]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    db.updateProfile({
      name: editName,
      phone: editPhone,
      city: editCity,
      game_uid: editUid,
      telegram_username: editTg
    });

    setIsOnboarding(false);
    loadProfile();
  };

  const handleTestNotification = () => {
    if (!user || !user.telegram_id || !db) return;
    db.pushNotification(
      user.telegram_id,
      `🔔 TEST NOTIFICATION:\nHello ${user.name}! Your simulated account is linked and verified.`
    );
  };

  return (
    <Shell>
      <div className="space-y-6">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-surface to-background p-6 rounded-2xl border border-border shadow-md">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-wide uppercase flex items-center gap-2">
              Welcome Back, <span className="text-accent">{user?.name || "Player"}</span>
            </h1>
            <p className="text-xs text-text-secondary">
              Roster verified. Systems operational. Link your Telegram to receive match credentials.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-border px-3 py-1.5 rounded-lg text-xs">
            <Gamepad2 size={16} className="text-accent" />
            <span className="font-semibold uppercase tracking-wider font-display">Active GamerHQ</span>
          </div>
        </div>

        {/* PROFILE SETUP ONBOARDING CARD */}
        {isOnboarding && (
          <div className="bg-gradient-to-br from-accent/5 to-transparent border border-accent/30 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <Sparkles className="text-accent" size={18} />
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-text-primary">
                Step 2: Profile Setup
              </h3>
            </div>
            <p className="text-xs text-text-secondary">
              Please finalize your gamer registry credentials to join and assemble teams.
            </p>

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1"><Smile size={10} /> Name</label>
                <input
                  type="text"
                  required
                  placeholder="Gamer Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1"><Smartphone size={10} /> Phone</label>
                <input
                  type="text"
                  required
                  placeholder="+91..."
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1"><MapPin size={10} /> City</label>
                <input
                  type="text"
                  required
                  placeholder="Mumbai..."
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1"><Tag size={10} /> Game UID</label>
                <input
                  type="text"
                  required
                  placeholder="UID e.g. 5812948"
                  value={editUid}
                  onChange={(e) => setEditUid(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div className="space-y-1 flex flex-col justify-between">
                <label className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1"><MessageSquare size={10} /> Telegram User</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="@username"
                    value={editTg}
                    onChange={(e) => setEditTg(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    className="bg-accent text-black font-bold text-xs uppercase px-3 rounded-lg hover:bg-accent-hover transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Hero Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-surface/80 border border-border rounded-xl p-4 flex flex-col justify-between hover:border-accent/30 transition">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="text-[10px] font-bold uppercase tracking-wider">Game UID</span>
              <Sword size={14} className="text-accent" />
            </div>
            <p className="text-sm font-bold font-mono truncate mt-2 text-text-primary">
              {user?.game_uid || "NOT_SET"}
            </p>
          </div>
          
          <div className="bg-surface/80 border border-border rounded-xl p-4 flex flex-col justify-between hover:border-accent/30 transition">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="text-[10px] font-bold uppercase tracking-wider">Matches</span>
              <Trophy size={14} className="text-accent" />
            </div>
            <p className="text-2xl font-extrabold font-display mt-2 text-text-primary">
              {matchesPlayedCount}
            </p>
          </div>

          <div className="bg-surface/80 border border-border rounded-xl p-4 flex flex-col justify-between hover:border-accent/30 transition">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="text-[10px] font-bold uppercase tracking-wider">Kills Avg</span>
              <Sparkles size={14} className="text-accent" />
            </div>
            <p className="text-2xl font-extrabold font-display mt-2 text-text-primary">
              {killsAverage}
            </p>
          </div>

          <div className="bg-surface/80 border border-border rounded-xl p-4 flex flex-col justify-between hover:border-accent/30 transition">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="text-[10px] font-bold uppercase tracking-wider">Win Rate</span>
              <Percent size={14} className="text-accent" />
            </div>
            <p className="text-2xl font-extrabold font-display mt-2 text-text-primary">
              {winRateText}
            </p>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-surface/80 border border-border rounded-xl p-4 flex flex-col justify-between hover:border-accent/30 transition">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="text-[10px] font-bold uppercase tracking-wider">Earnings</span>
              <DollarSign size={14} className="text-accent" />
            </div>
            <p className="text-2xl font-extrabold font-display mt-2 text-accent">
              {earningsText}
            </p>
          </div>
        </div>

        {/* Dashboard Grid Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Tournament Card */}
          <div className="lg:col-span-2 space-y-6">
            {activeTourney ? (
              <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/20 to-transparent blur-2xl" />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 bg-accent/10 border border-accent/20 rounded-md text-[10px] font-bold text-accent uppercase tracking-wider">
                      Active League
                    </span>
                    <h3 className="text-lg font-bold font-display text-text-primary uppercase tracking-wide mt-2">
                      {activeTourney.name}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Game Format: {activeTourney.game_id === "bf81850d-d421-4ea9-a111-ce1515bb5c81" ? "Free Fire (Points Mode)" : activeTourney.game_id === "e12bd84d-2df9-4c12-841f-1ad078d10b72" ? "BGMI (Points Mode)" : "Valorant (Bracket Mode)"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {registration ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        registration.status === "approved" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                      }`}>
                        {registration.status === "approved" ? "Approved ✓" : "Pending Verification"}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 border border-red-500/20 text-red-400">
                        Not Registered
                      </span>
                    )}
                  </div>
                </div>

                {/* Room details reveal container */}
                <div className="my-6 p-4 bg-background/50 border border-border rounded-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                        Custom Match Room Credentials
                      </span>
                      {rooms.length > 0 && rooms[0].room_id_code ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs">
                            Room ID: <span className="font-mono text-accent font-bold">{rooms[0].room_id_code}</span>
                          </p>
                          <p className="text-xs">
                            Password: <span className="font-mono text-accent font-bold">{rooms[0].room_password}</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-text-secondary mt-1 italic">
                          🔒 Room credentials will unlock and be pushed 15 minutes before the match start time.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                        Starts In
                      </span>
                      <span className="text-xs font-mono font-bold text-accent animate-pulse mt-0.5">
                        {countdown}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <Link
                    href={`/tournament/${activeTourney.id}`}
                    className="flex items-center gap-1.5 text-xs text-accent font-semibold hover:underline"
                  >
                    <span>Open Leaderboard & Standings</span>
                    <ChevronRight size={14} />
                  </Link>
                  <div className="flex gap-2 text-[10px] text-text-secondary font-semibold">
                    <span>Qualifier Spots: <strong className="text-text-primary">Top {activeTourney.qualifier_spots}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center text-text-secondary">
                <Trophy size={36} className="opacity-20 mb-2" />
                <h3 className="text-sm font-bold font-display text-text-primary uppercase tracking-wider">No Active Tournament</h3>
                <p className="text-xs mt-1 max-w-xs mx-auto">
                  You are not registered in any upcoming tournament. Head to the admin desk to create a tournament or join an existing squad.
                </p>
              </div>
            )}

            {/* Performance charts */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-display text-text-primary uppercase tracking-wider">
                    Recent Performance Trend
                  </h3>
                </div>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorKills" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#111118", borderColor: "#1e1e2e" }} />
                    <Area type="monotone" dataKey="kills" stroke="var(--accent)" fillOpacity={1} fill="url(#colorKills)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Sidebar widget panels */}
          <div className="space-y-6">
            
            {/* Telegram Linking Widget */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-display text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={16} className="text-accent" />
                  Telegram Bot Link
                </h3>
                <span className={`w-2 h-2 rounded-full ${user?.telegram_id ? "bg-green-400 shadow-[0_0_8px_#4ade80]" : "bg-red-400 shadow-[0_0_8px_#f87171]"}`} />
              </div>
              
              {user?.telegram_id ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 font-semibold">
                    ✓ Telegram Connected Successfully (@{user.telegram_username})
                  </div>
                  <button
                    onClick={handleTestNotification}
                    className="w-full bg-background border border-border hover:border-accent hover:text-accent p-2.5 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2"
                  >
                    <Bell size={14} />
                    Send Test notification
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] leading-relaxed text-text-secondary">
                    Link your Telegram to get immediate notifications for match custom rooms, results, and qualifier alerts.
                  </p>
                  <a
                    href="https://t.me/CrewArenaBot?start=VERIFY123"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-accent hover:bg-accent-hover text-black p-2.5 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 hover:scale-[1.01] transition"
                  >
                    <span>Connect Telegram</span>
                    <ExternalLink size={14} />
                  </a>
                  <p className="text-[9px] text-text-secondary/60 text-center">
                    💡 Simulated bot connect start command code: <code className="bg-black px-1 py-0.5 rounded font-mono">/start VERIFY123</code>
                  </p>
                </div>
              )}
            </div>

            {/* My Teams Widget */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-display text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-accent" />
                  My Teams space
                </h3>
                <Link href="/team" className="text-[10px] text-accent font-semibold hover:underline">
                  Manage
                </Link>
              </div>

              {teams.length === 0 ? (
                <div className="text-center py-4 text-xs text-text-secondary">
                  No teams created yet.
                  <div className="mt-2">
                    <Link href="/team" className="text-accent hover:underline font-bold">
                      Create Team Roster →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {teams.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2.5 bg-background/50 border border-border rounded-xl hover:border-accent/20 transition">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-border flex items-center justify-center bg-surface">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.logo_url || ""} alt="" className="w-full h-full" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-text-primary">{t.name}</span>
                          <span className="text-[9px] text-text-secondary uppercase">CODE: {t.tag}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theme switcher panel */}
            <ThemeSwitcher />

          </div>
        </div>

      </div>
    </Shell>
  );
}
