"use client";

import React, { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { db } from "@/lib/db";
import { generateRooms } from "@/lib/engines/roomGenerator";
import { calculateTeamMatchScore } from "@/lib/engines/pointsEngine";
import { autoGenerateGrandFinal } from "@/lib/engines/qualificationEngine";
import { Tournament, Team, TournamentRegistration, MatchRoom, Game, RoomAssignment, Payment, User } from "@/types/database.types";
import { 
  ShieldAlert, 
  BarChart3, 
  Settings, 
  DollarSign, 
  Users, 
  Check, 
  X, 
  Save, 
  Play, 
  Plus, 
  CheckSquare,
  Sparkles,
  Layers,
  FileText,
  Trophy,
  Award
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";

// Mock revenue data
const revenueData = [
  { day: "Day 1", amount: 1500 },
  { day: "Day 5", amount: 3500 },
  { day: "Day 10", amount: 8000 },
  { day: "Day 15", amount: 12000 },
  { day: "Day 20", amount: 24000 },
  { day: "Day 25", amount: 32000 },
  { day: "Day 30", amount: 48000 },
];

export default function AdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<"analytics" | "payments" | "tournaments" | "matches" | "roles">("analytics");
  
  // DB states
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [rooms, setRooms] = useState<MatchRoom[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profiles, setProfiles] = useState<User[]>([]);

  // Role Search & Manager
  const [roleSearchQuery, setRoleSearchQuery] = useState("");

  // Winners Podium state
  const [podiumChampionId, setPodiumChampionId] = useState("");
  const [podiumRunnerUpId, setPodiumRunnerUpId] = useState("");
  const [podiumMvpId, setPodiumMvpId] = useState("");

  // Tournament creator form
  const [creationStep, setCreationStep] = useState(1);
  const [newTourneyName, setNewTourneyName] = useState("");
  const [newTourneyGame, setNewTourneyGame] = useState("bf81850d-d421-4ea9-a111-ce1515bb5c81");
  const [newTourneyFee, setNewTourneyFee] = useState(100);
  const [newTourneyPrize, setNewTourneyPrize] = useState(20000);
  const [newTourneyCapacity, setNewTourneyCapacity] = useState(12);
  const [newTourneyQualifiers, setNewTourneyQualifiers] = useState(4);
  const [newTourneyRules, setNewTourneyRules] = useState("");
  const [newTourneyDeadline, setNewTourneyDeadline] = useState("");
  const [newTourneyStartDate, setNewTourneyStartDate] = useState("");

  // Match management states
  const [selectedTourneyId, setSelectedTourneyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  
  // Results spreadsheet editing
  const [roomCredentialsCode, setRoomCredentialsCode] = useState("");
  const [roomCredentialsPass, setRoomCredentialsPass] = useState("");
  const [resultsRows, setResultsRows] = useState<{ teamId: string; position: number; kills: number; totalPoints: number }[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAll = () => {
    if (!db) return;
    setTournaments(db.getTournaments());
    setRegistrations(db.getRegistrations());
    setTeams(db.getTeams());
    setGames(db.getGames());
    setRooms(db.getRooms());
    setPayments(db.getPayments());
    setProfiles(db.getProfiles());
  };

  useEffect(() => {
    loadAll();
    window.addEventListener("db-sync", loadAll);
    return () => window.removeEventListener("db-sync", loadAll);
  }, []);

  // Set default game once games are loaded
  useEffect(() => {
    if (games.length > 0 && (newTourneyGame === "g-freefire" || !newTourneyGame || !games.find(g => g.id === newTourneyGame))) {
      setNewTourneyGame(games[0].id);
    }
  }, [games, newTourneyGame]);

  // Set default tournament selection for match panel
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTourneyId) {
      setSelectedTourneyId(tournaments[0].id);
    }
  }, [tournaments, selectedTourneyId]);

  // Load winners podium if tournament is already completed
  useEffect(() => {
    if (!selectedTourneyId) return;
    const tourney = tournaments.find(t => t.id === selectedTourneyId);
    if (tourney && tourney.status === "completed") {
      setPodiumChampionId(tourney.champion_team_id || "");
      setPodiumRunnerUpId(tourney.runner_up_team_id || "");
      setPodiumMvpId(tourney.mvp_player_id || "");
    } else {
      setPodiumChampionId("");
      setPodiumRunnerUpId("");
      setPodiumMvpId("");
    }
  }, [selectedTourneyId, tournaments]);

  // Load results sheet row state when a room is selected
  useEffect(() => {
    if (!selectedRoomId || !db) {
      setResultsRows([]);
      setRoomCredentialsCode("");
      setRoomCredentialsPass("");
      return;
    }
    const room = rooms.find(r => r.id === selectedRoomId);
    if (room) {
      setRoomCredentialsCode(room.room_id_code || "");
      setRoomCredentialsPass(room.room_password || "");
      
      const assignments = db.getRoomAssignments(selectedRoomId);
      const existingResults = db.getResultsForRoom(selectedRoomId);

      const rows = assignments.map((assign: RoomAssignment) => {
        const result = existingResults.find(r => r.team_id === assign.team_id);
        return {
          teamId: assign.team_id,
          position: result ? result.position : 1,
          kills: result ? result.kills : 0,
          totalPoints: result ? result.total_points : 0
        };
      });
      setResultsRows(rows);
    }
  }, [selectedRoomId, rooms]);

  const handleApprovePayment = (id: string) => {
    if (!db) return;
    db.approveRegistration(id);
    setMessage("Registration verified and team approved!");
    loadAll();
    setTimeout(() => setMessage(""), 2000);
  };

  const handleRejectPayment = (id: string) => {
    if (!db) return;
    const reason = prompt("Enter rejection reason:") || "Invalid UPI UTR code / Screenshot blur";
    db.rejectRegistration(id, reason);
    setError("Registration rejected.");
    loadAll();
    setTimeout(() => setError(""), 2000);
  };

  const handleCreateTournament = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!db) return;
    
    // Format rules with registration deadline info
    const fullRules = `Registration Deadline: ${newTourneyDeadline || "Not specified"}\n\n${newTourneyRules}`;
    
    db.createTournament({
      name: newTourneyName,
      game_id: newTourneyGame,
      entry_fee: Number(newTourneyFee),
      prize_pool: Number(newTourneyPrize),
      max_teams: Number(newTourneyCapacity),
      qualifier_spots: Number(newTourneyQualifiers),
      rules: fullRules,
      start_date: newTourneyStartDate ? new Date(newTourneyStartDate).toISOString() : new Date(Date.now() + 172800000).toISOString()
    });

    setMessage("New Tournament registered successfully!");
    setNewTourneyName("");
    setNewTourneyRules("");
    setNewTourneyStartDate("");
    setNewTourneyDeadline("");
    setCreationStep(1); // Reset wizard step
    loadAll();
    setTimeout(() => {
      setMessage("");
      setActiveSubTab("matches");
    }, 2000);
  };

  const handleGenerateGroups = () => {
    if (!selectedTourneyId || !db) return;
    const tourney = tournaments.find(t => t.id === selectedTourneyId);
    if (!tourney) return;

    // Get approved teams for this tournament
    const tourneyRegs = registrations.filter(r => r.tournament_id === selectedTourneyId && r.status === "approved");
    const registeredTeams = tourneyRegs.map(r => teams.find(t => t.id === r.team_id)).filter(Boolean) as Team[];

    if (registeredTeams.length === 0) {
      alert("No approved teams found! Approve registrations in Payment Tab first.");
      return;
    }

    const game = games.find(g => g.id === tourney.game_id);
    const teamsPerRoom = game ? game.teams_per_room : 12;

    const { rooms: generatedRooms, assignments } = generateRooms(tourney, registeredTeams, teamsPerRoom);
    db.saveRoomsAndAssignments(generatedRooms, assignments);
    setMessage(`Successfully generated ${generatedRooms.length} group match rooms!`);
    loadAll();
    setTimeout(() => setMessage(""), 2000);
  };

  const handleSaveRoomCredentials = () => {
    if (!selectedRoomId || !db) return;
    db.updateRoomDetails(selectedRoomId, roomCredentialsCode, roomCredentialsPass);
    setMessage("Room credentials locked and dispatched to players!");
    loadAll();
    setTimeout(() => setMessage(""), 2000);
  };

  // Recalculate row points dynamically on spreadsheets edit
  const handleResultsRowChange = (teamId: string, field: "position" | "kills", value: number) => {
    const tourney = tournaments.find(t => t.id === selectedTourneyId);
    const game = games.find(g => g.id === tourney?.game_id);
    if (!game) return;

    setResultsRows(prev => prev.map(row => {
      if (row.teamId === teamId) {
        const updatedRow = { ...row, [field]: value };
        const score = calculateTeamMatchScore(game.points_config, updatedRow.position, updatedRow.kills);
        updatedRow.totalPoints = score.totalPoints;
        return updatedRow;
      }
      return row;
    }));
  };

  const handleSaveMatchResults = () => {
    if (!selectedRoomId || !db) return;
    const tourney = tournaments.find(t => t.id === selectedTourneyId);
    const game = games.find(g => g.id === tourney?.game_id);
    if (!game) return;

    const payload = resultsRows.map(row => {
      const score = calculateTeamMatchScore(game.points_config, row.position, row.kills);
      return {
        match_id: selectedRoomId,
        team_id: row.teamId,
        position: row.position,
        kills: row.kills,
        placement_points: score.placementPoints,
        kill_points: score.killPoints
      };
    });

    db.enterResults(selectedRoomId, payload);
    setMessage("Match results successfully compiled and leaderboard updated!");
    
    // Auto Grand Final generator trigger check
    if (tourney) {
      const gfRoom = autoGenerateGrandFinal(tourney, db);
      if (gfRoom) {
        setMessage("Qualifier stage complete! Grand Final room generated automatically.");
      }
    }

    loadAll();
    setTimeout(() => setMessage(""), 2000);
  };

  const registrationsWithPayments = registrations.map(reg => {
    const pay = payments.find(p => p.registration_id === reg.id);
    return {
      ...reg,
      payment_status: pay ? pay.status : "pending",
      utr_number: pay ? pay.utr_number : "",
      payment_screenshot_url: pay ? pay.screenshot_url : null,
      payment_amount: pay ? pay.amount : 0
    };
  });

  const selectedTourney = tournaments.find(t => t.id === selectedTourneyId);
  const registeredTeams = selectedTourney
    ? registrations.filter(r => r.tournament_id === selectedTourneyId && r.status === "approved")
        .map(r => teams.find(t => t.id === r.team_id))
        .filter(Boolean) as Team[]
    : [];

  const registeredPlayers = (() => {
    if (!selectedTourney || !db) return [];
    const playersMap: { [id: string]: User } = {};
    registeredTeams.forEach(team => {
      db.getTeamMembers(team.id)
        .filter(m => m.status === "approved")
        .forEach(m => {
          const profile = db.getProfiles().find(p => p.id === m.player_id);
          if (profile) {
            playersMap[profile.id] = profile;
          }
        });
    });
    return Object.values(playersMap);
  })();

  // Dynamic Calculations for Analytics
  const totalRevenue = payments
    .filter(p => p.status === "approved")
    .reduce((sum, p) => sum + p.amount, 0);

  const approvedPlayersCount = db ? db.getProfiles().length : 0;

  const getRevenueTrend = () => {
    const approvedPayments = [...payments]
      .filter(p => p.status === "approved")
      .sort((a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime());
    
    if (approvedPayments.length === 0) {
      return [
        { day: "Start", amount: 0 }
      ];
    }

    let runningTotal = 0;
    return approvedPayments.map((p, idx) => {
      runningTotal += p.amount;
      const d = new Date(p.created_at || "");
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return {
        day: label || `Tx ${idx + 1}`,
        amount: runningTotal
      };
    });
  };

  const revenueTrendData = getRevenueTrend();

  const handleDeclareWinners = () => {
    if (!db || !selectedTourneyId || !podiumChampionId || !podiumRunnerUpId || !podiumMvpId) return;
    
    if (podiumChampionId === podiumRunnerUpId) {
      alert("Champion and Runner Up cannot be the same team.");
      return;
    }

    db.endTournament(selectedTourneyId, podiumChampionId, podiumRunnerUpId, podiumMvpId);
    setMessage("Tournament closed! Winners declared and announcements pushed.");
    loadAll();
    setTimeout(() => setMessage(""), 2500);
  };

  const handleToggleUserRole = (userId: string, currentRole: "player" | "admin") => {
    if (!db) return;
    const newRole = currentRole === "admin" ? "player" : "admin";
    
    // Prevent self-demotion
    const currentUser = db.getCurrentUser();
    if (currentUser && userId === currentUser.id && currentRole === "admin") {
      alert("You cannot demote yourself from Admin role.");
      return;
    }

    if (confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) {
      db.updateUserRole(userId, newRole);
      setMessage(`User role updated to ${newRole}!`);
      loadAll();
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const q = roleSearchQuery.toLowerCase();
    return (
      (p.display_name || "").toLowerCase().includes(q) ||
      (p.username || "").toLowerCase().includes(q) ||
      (p.game_uid || "").toLowerCase().includes(q) ||
      (p.telegram_username || "").toLowerCase().includes(q)
    );
  });

  return (
    <Shell>
      <div className="space-y-6">
        
        {/* Banner */}
        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display uppercase tracking-wide text-red-400 flex items-center gap-2">
              <ShieldAlert size={24} /> Arena Commander Deck
            </h1>
            <p className="text-xs text-text-secondary">
              Verify payments, run Fisher-Yates group draws, compute result spreadsheets, and spin up finals.
            </p>
          </div>
        </div>

        {/* Global status messages */}
        {message && (
          <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 font-semibold animate-pulse">
            ✓ {message}
          </div>
        )}
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Mini Tab controllers */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-1.5">
          {[
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "payments", label: `Payments Pending (${registrationsWithPayments.filter(r => r.payment_status === "pending").length})`, icon: DollarSign },
            { id: "tournaments", label: "Creator Desk", icon: Plus },
            { id: "matches", label: "Match Management", icon: Settings },
            { id: "roles", label: "Role Manager", icon: Users },
          ].map((tab) => {
            const ActiveIcon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold uppercase tracking-wider transition ${
                  active
                    ? "border-red-500 text-red-400"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <ActiveIcon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: ANALYTICS SUB TAB */}
        {activeSubTab === "analytics" && (
          <div className="space-y-6">
            
            {/* Overview Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase block font-bold">Total Platform Revenue</span>
                  <span className="text-xl font-extrabold text-accent font-mono mt-1 block">₹{totalRevenue.toLocaleString()}</span>
                </div>
                <DollarSign size={20} className="text-accent" />
              </div>
              <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase block font-bold">Total Rosters</span>
                  <span className="text-xl font-extrabold text-text-primary font-mono mt-1 block">{teams.length}</span>
                </div>
                <Users size={20} className="text-accent" />
              </div>
              <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase block font-bold">Live Leagues</span>
                  <span className="text-xl font-extrabold text-red-400 font-mono mt-1 block">
                    {tournaments.filter(t => t.status === "ongoing").length}
                  </span>
                </div>
                <Play size={20} className="text-red-400" />
              </div>
              <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase block font-bold">Approved Players</span>
                  <span className="text-xl font-extrabold text-green-400 font-mono mt-1 block">{approvedPlayersCount.toLocaleString()}</span>
                </div>
                <CheckSquare size={20} className="text-green-400" />
              </div>
            </div>

            {/* Recharts Area Plot */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold font-display text-text-primary uppercase tracking-wider">
                30-Day Platform Revenue Growth
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#52525b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#111118", borderColor: "#1e1e2e" }} />
                    <Area type="monotone" dataKey="amount" stroke="var(--accent)" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* SECTION 2: PAYMENT QUEUE SUB TAB */}
        {activeSubTab === "payments" && (
          <div className="bg-surface border border-border rounded-2xl p-5 overflow-hidden">
            <h3 className="text-sm font-bold font-display text-text-primary uppercase tracking-wider mb-4">
              Submitted Roster Registrations Queue
            </h3>

            {registrationsWithPayments.filter(r => r.payment_status === "pending").length === 0 ? (
              <div className="py-12 text-center text-xs text-text-secondary">
                No registrations awaiting verification.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-secondary uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3 px-4">Squad ID</th>
                      <th className="py-3 px-4">UTR Number</th>
                      <th className="py-3 px-4">Screenshots</th>
                      <th className="py-3 px-4 text-center">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono">
                    {registrationsWithPayments.filter(r => r.payment_status === "pending").map((reg) => (
                      <tr key={reg.id} className="hover:bg-background/20 transition">
                        <td className="py-3.5 px-4 font-sans font-bold">
                          {teams.find(t => t.id === reg.team_id)?.name || "Unknown"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-text-primary font-bold">
                          {reg.utr_number || "NO UTR PROVIDED"}
                        </td>
                        <td className="py-3.5 px-4">
                          {reg.payment_screenshot_url && (
                            <a
                              href={reg.payment_screenshot_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent font-semibold hover:underline flex items-center gap-1"
                            >
                              <span>View Receipt 🔍</span>
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center text-text-primary font-bold">
                          ₹{reg.payment_amount}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprovePayment(reg.id)}
                              className="p-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition"
                              title="Approve Entry"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleRejectPayment(reg.id)}
                              className="p-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                              title="Reject Entry"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: TOURNAMENT CREATOR SUB TAB */}
        {activeSubTab === "tournaments" && (() => {
          const selectedGameConfig = games.find(g => g.id === newTourneyGame);
          const estimatedIntake = newTourneyCapacity * newTourneyFee;

          return (
            <div className="max-w-xl mx-auto bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6">
              
              {/* Stepper Header */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold font-display text-text-primary uppercase tracking-wide">
                    Construct Arena Tournament
                  </h3>
                  <span className="text-[10px] text-accent font-mono font-bold uppercase">
                    Step {creationStep} of 4
                  </span>
                </div>
                
                {/* Stepper Dots & Progress Line */}
                <div className="relative flex items-center justify-between w-full">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-border -z-10" />
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-500 transition-all duration-300 -z-10" 
                    style={{ width: `${((creationStep - 1) / 3) * 100}%` }}
                  />
                  {[1, 2, 3, 4].map((step) => {
                    const label = step === 1 ? "Game" : step === 2 ? "Rules" : step === 3 ? "Prize" : "Verify";
                    return (
                      <button
                        key={step}
                        disabled={step > creationStep}
                        onClick={() => setCreationStep(step)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition relative cursor-pointer ${
                          creationStep === step 
                            ? "bg-red-500 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                            : creationStep > step
                            ? "bg-surface border-red-500 text-red-400"
                            : "bg-background border-border text-text-secondary"
                        }`}
                      >
                        <span>{step}</span>
                        <span className="absolute top-8 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-wider font-semibold opacity-80 whitespace-nowrap">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step Forms */}
              <div className="pt-6">
                {creationStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                        Tournament League Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Valorant Challengers Cup, FF Grand Masters"
                        value={newTourneyName}
                        onChange={(e) => setNewTourneyName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent text-text-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                        Esports Game Format
                      </label>
                      <select
                        value={newTourneyGame}
                        onChange={(e) => setNewTourneyGame(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-accent text-text-primary cursor-pointer"
                      >
                        {games.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (!newTourneyName.trim()) {
                            alert("Please enter a Tournament Name first.");
                            return;
                          }
                          setCreationStep(2);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Next: Schedule & Settings
                      </button>
                    </div>
                  </div>
                )}

                {creationStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                          Tournament Start Date
                        </label>
                        <input
                          type="datetime-local"
                          value={newTourneyStartDate}
                          onChange={(e) => setNewTourneyStartDate(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-accent text-text-primary font-mono cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                          Registration Deadline
                        </label>
                        <input
                          type="datetime-local"
                          value={newTourneyDeadline}
                          onChange={(e) => setNewTourneyDeadline(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-accent text-text-primary font-mono cursor-pointer"
                        />
                      </div>
                    </div>

                    {selectedGameConfig && (
                      <div className="p-4 bg-background/50 border border-border/80 rounded-xl space-y-3">
                        <div className="flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-wider">
                          <Sparkles size={14} />
                          <span>Game Engine Settings Loaded</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-text-secondary block text-[10px] uppercase font-semibold">Teams Per Room</span>
                            <span className="text-text-primary font-bold">{selectedGameConfig.teams_per_room} teams</span>
                          </div>
                          <div>
                            <span className="text-text-secondary block text-[10px] uppercase font-semibold">Finalists Count</span>
                            <span className="text-text-primary font-bold">{selectedGameConfig.finalists} teams</span>
                          </div>
                          <div>
                            <span className="text-text-secondary block text-[10px] uppercase font-semibold">Qualification Format</span>
                            <span className="text-text-primary font-bold capitalize">{selectedGameConfig.qualification} stage</span>
                          </div>
                          <div>
                            <span className="text-text-secondary block text-[10px] uppercase font-semibold">Point Multipliers</span>
                            <span className="text-text-primary font-bold font-mono">
                              Kill = {selectedGameConfig.points_config?.kill ?? 0} pts
                            </span>
                          </div>
                        </div>

                        {/* Point Config preview */}
                        {selectedGameConfig.points_config && Object.keys(selectedGameConfig.points_config).length > 0 && (
                          <div className="pt-2 border-t border-border/40">
                            <span className="text-text-secondary block text-[9px] uppercase font-bold tracking-wider mb-1">JSON Scoring Config</span>
                            <pre className="text-[9px] bg-background border border-border p-2 rounded font-mono text-green-400 overflow-x-auto">
                              {JSON.stringify(selectedGameConfig.points_config, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-4 flex justify-between gap-2">
                      <button
                        onClick={() => setCreationStep(1)}
                        className="bg-surface border border-border hover:border-text-secondary/50 text-text-secondary hover:text-text-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          if (!newTourneyStartDate || !newTourneyDeadline) {
                            alert("Please select both a Start Date and a Registration Deadline.");
                            return;
                          }
                          setCreationStep(3);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Next: Economics
                      </button>
                    </div>
                  </div>
                )}

                {creationStep === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                          Entry Fee (INR)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={newTourneyFee}
                          onChange={(e) => setNewTourneyFee(Number(e.target.value))}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent text-text-primary font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                          Prize Pool (INR)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={newTourneyPrize}
                          onChange={(e) => setNewTourneyPrize(Number(e.target.value))}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent text-text-primary font-mono"
                        />
                      </div>
                    </div>

                    {/* Cost Preview estimation */}
                    <div className="p-4 bg-background/50 border border-border/80 rounded-xl space-y-2">
                      <div className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">
                        Economics Projections
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Max Capacity Registrations:</span>
                          <span className="font-bold text-text-primary font-mono">{newTourneyCapacity} Teams</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ticket Cost per Team:</span>
                          <span className="font-bold text-text-primary font-mono">₹{newTourneyFee}</span>
                        </div>
                        <div className="flex justify-between border-t border-border/40 pt-1.5 font-bold">
                          <span>Estimated Platform Revenue:</span>
                          <span className="text-green-400 font-mono">₹{estimatedIntake}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Net Prize Pool Payout:</span>
                          <span className="text-red-400 font-mono">₹{newTourneyPrize}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between gap-2">
                      <button
                        onClick={() => setCreationStep(2)}
                        className="bg-surface border border-border hover:border-text-secondary/50 text-text-secondary hover:text-text-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setCreationStep(4)}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Next: Final Review
                      </button>
                    </div>
                  </div>
                )}

                {creationStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                          Capacity (Max Teams)
                        </label>
                        <input
                          type="number"
                          min={2}
                          value={newTourneyCapacity}
                          onChange={(e) => setNewTourneyCapacity(Number(e.target.value))}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent text-text-primary font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                          Qualifier Advance Spots Count
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newTourneyQualifiers}
                          onChange={(e) => setNewTourneyQualifiers(Number(e.target.value))}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent text-text-primary font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                        Regulations & Rules Sheet
                      </label>
                      <textarea
                        placeholder="Insert rules, schedules, server configs, gameplay maps..."
                        value={newTourneyRules}
                        onChange={(e) => setNewTourneyRules(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent text-text-primary h-20 resize-none font-sans"
                      />
                    </div>

                    {/* Final Verification Block */}
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2 text-xs">
                      <div className="text-red-400 font-bold uppercase tracking-wider text-[10px]">
                        Verify Tournament Information
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-sans text-text-secondary">
                        <p>Name: <span className="font-semibold text-text-primary">{newTourneyName}</span></p>
                        <p>Format Game: <span className="font-semibold text-text-primary">{selectedGameConfig?.name}</span></p>
                        <p>Entry Cost: <span className="font-semibold text-text-primary">₹{newTourneyFee}</span></p>
                        <p>Prize Fund: <span className="font-semibold text-text-primary">₹{newTourneyPrize}</span></p>
                        <p className="col-span-2">Starts: <span className="font-semibold text-text-primary font-mono">{new Date(newTourneyStartDate).toLocaleString()}</span></p>
                        <p className="col-span-2">Deadline: <span className="font-semibold text-text-primary font-mono">{new Date(newTourneyDeadline).toLocaleString()}</span></p>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between gap-2">
                      <button
                        onClick={() => setCreationStep(3)}
                        className="bg-surface border border-border hover:border-text-secondary/50 text-text-secondary hover:text-text-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => handleCreateTournament()}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] transition cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                      >
                        <span>Construct & Publish Tournament</span>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* SECTION 4: MATCH ROOMS CONTROL AND RESULTS SPREADSHEET */}
        {activeSubTab === "matches" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left selector pane */}
            <div className="space-y-4">
              <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-widest">
                  Configure Matches
                </h3>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">League Selector</label>
                    <select
                      value={selectedTourneyId}
                      onChange={(e) => { setSelectedTourneyId(e.target.value); setSelectedRoomId(""); }}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-accent text-text-primary cursor-pointer"
                    >
                      {tournaments.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateGroups}
                      className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 p-2.5 rounded-lg text-xs font-bold uppercase transition flex items-center justify-center gap-1.5"
                    >
                      <Layers size={14} />
                      <span>Generate Groups</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Match rooms listing */}
              <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-widest">
                  Active Rooms Draw
                </h3>

                {rooms.filter(r => r.tournament_id === selectedTourneyId).length === 0 ? (
                  <p className="text-xs text-text-secondary italic">Draw not conducted. Click Generate Groups above.</p>
                ) : (
                  <div className="space-y-2">
                    {rooms.filter(r => r.tournament_id === selectedTourneyId).map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`w-full p-3 border rounded-xl text-left flex justify-between items-center transition ${
                          selectedRoomId === room.id
                            ? "bg-red-500/10 border-red-500/50 text-red-400"
                            : "bg-background/50 border-border hover:border-border/80 text-text-primary"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{room.room_label}</span>
                          <span className="text-[9px] uppercase tracking-wider mt-0.5 opacity-60">
                            {room.round_type === "grand_final" ? "Finals Round" : "Qualifiers"}
                          </span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                          room.status === "completed" ? "bg-slate-500/10 text-slate-400" : "bg-green-500/10 text-green-400"
                        }`}>
                          {room.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Winners Podium Widget */}
              {selectedTourney && (
                <div className="bg-gradient-to-tr from-yellow-500/10 via-background to-surface border border-yellow-500/30 rounded-2xl p-5 space-y-4 shadow-[0_0_20px_rgba(234,179,8,0.05)]">
                  <h3 className="text-xs font-bold font-display text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Trophy size={14} /> Winners Podium
                  </h3>
                  
                  {selectedTourney.status === "completed" ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs space-y-2">
                        <p className="text-yellow-400 font-bold uppercase tracking-wider text-[10px]">🏆 Tournament Completed</p>
                        <div className="space-y-1 text-text-primary">
                          <p>
                            Champion: <span className="font-semibold">{teams.find(t => t.id === selectedTourney.champion_team_id)?.name || "N/A"}</span>
                          </p>
                          <p>
                            Runner Up: <span className="font-semibold">{teams.find(t => t.id === selectedTourney.runner_up_team_id)?.name || "N/A"}</span>
                          </p>
                          <p>
                            MVP Player: <span className="font-semibold font-sans">{db.getProfiles().find(p => p.id === selectedTourney.mvp_player_id)?.name || "N/A"}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <p className="text-[10px] text-text-secondary">
                        Close matches and dispatch final tournament standings to the public channel.
                      </p>
                      
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-semibold">Champion Team</label>
                          <select
                            value={podiumChampionId}
                            onChange={(e) => setPodiumChampionId(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-yellow-500 text-text-primary cursor-pointer font-sans"
                          >
                            <option value="">-- Select Champion --</option>
                            {registeredTeams.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-semibold">Runner Up Team</label>
                          <select
                            value={podiumRunnerUpId}
                            onChange={(e) => setPodiumRunnerUpId(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-yellow-500 text-text-primary cursor-pointer font-sans"
                          >
                            <option value="">-- Select Runner Up --</option>
                            {registeredTeams.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-semibold">Tournament MVP</label>
                          <select
                            value={podiumMvpId}
                            onChange={(e) => setPodiumMvpId(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-yellow-500 text-text-primary cursor-pointer font-sans"
                          >
                            <option value="">-- Select MVP Player --</option>
                            {registeredPlayers.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.telegram_username ? `@${p.telegram_username}` : "No TG"})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleDeclareWinners}
                        disabled={!podiumChampionId || !podiumRunnerUpId || !podiumMvpId}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 disabled:cursor-not-allowed text-black py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.01] transition duration-200 cursor-pointer"
                      >
                        <Award size={14} />
                        <span>Declare Winners & Close League</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right credentials + Results entry spreadsheet pane */}
            <div className="lg:col-span-2 space-y-4">
              
              {selectedRoomId ? (
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-6">
                  
                  {/* Part A: Set room custom ID & Password */}
                  <div className="space-y-4 border-b border-border/40 pb-5">
                    <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-widest">
                      1. Dispatch Room Credentials
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">In-Game Room ID</label>
                        <input
                          type="text"
                          placeholder="e.g. 9812741"
                          value={roomCredentialsCode}
                          onChange={(e) => setRoomCredentialsCode(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-accent text-text-primary font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">Password</label>
                        <input
                          type="text"
                          placeholder="e.g. 54321"
                          value={roomCredentialsPass}
                          onChange={(e) => setRoomCredentialsPass(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-accent text-text-primary font-mono"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveRoomCredentials}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Save size={14} />
                      <span>Lock & Broadcast Room Info</span>
                    </button>
                  </div>

                  {/* Part B: Match results spreadsheet sheet */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold font-display text-text-primary uppercase tracking-widest">
                        2. Results spreadsheet Entry Sheet
                      </h3>
                      <span className="text-[10px] text-text-secondary">Points configs auto-calculated</span>
                    </div>

                    {resultsRows.length === 0 ? (
                      <p className="text-xs text-text-secondary italic">No seeded teams assigned to this room draw.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-border text-text-secondary uppercase text-[9px] font-bold">
                                <th className="py-2 px-1">Team Name</th>
                                <th className="py-2 px-1 text-center w-24">Placement Rank</th>
                                <th className="py-2 px-1 text-center w-24">Kills count</th>
                                <th className="py-2 px-1 text-right w-24">Total Match Points</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20 font-mono">
                              {resultsRows.map((row) => (
                                <tr key={row.teamId}>
                                  <td className="py-2.5 px-1 font-sans font-bold text-text-primary">
                                    {teams.find(t => t.id === row.teamId)?.name || "Unknown"}
                                  </td>
                                  <td className="py-2 px-1">
                                    <input
                                      type="number"
                                      min={1}
                                      value={row.position}
                                      onChange={(e) => handleResultsRowChange(row.teamId, "position", Number(e.target.value))}
                                      className="w-16 mx-auto block bg-background border border-border rounded px-1.5 py-1 text-center font-mono focus:outline-none focus:border-accent"
                                    />
                                  </td>
                                  <td className="py-2 px-1">
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.kills}
                                      onChange={(e) => handleResultsRowChange(row.teamId, "kills", Number(e.target.value))}
                                      className="w-16 mx-auto block bg-background border border-border rounded px-1.5 py-1 text-center font-mono focus:outline-none focus:border-accent"
                                    />
                                  </td>
                                  <td className="py-2.5 px-1 text-right text-accent font-extrabold">
                                    {row.totalPoints}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <button
                          onClick={handleSaveMatchResults}
                          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer mt-2"
                        >
                          <FileText size={14} />
                          <span>Publish Match Results</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-surface border border-border rounded-2xl p-12 text-center text-text-secondary h-full flex flex-col justify-center items-center">
                  <Sparkles size={32} className="opacity-30 mb-2" />
                  <p className="text-xs">Select a generated Room draw from the list to update credentials or compile result sheets.</p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* SECTION 5: ROLE MANAGER SUB TAB */}
        {activeSubTab === "roles" && (
          <div className="space-y-6">
            
            {/* Overview Counters for Roles */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase block font-bold">Total Users</span>
                  <span className="text-xl font-extrabold text-accent font-mono mt-1 block">{profiles.length}</span>
                </div>
                <Users size={20} className="text-accent" />
              </div>
              <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase block font-bold">Admins</span>
                  <span className="text-xl font-extrabold text-red-400 font-mono mt-1 block">
                    {profiles.filter(p => p.role === "admin").length}
                  </span>
                </div>
                <ShieldAlert size={20} className="text-red-400" />
              </div>
              <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase block font-bold">Players</span>
                  <span className="text-xl font-extrabold text-green-400 font-mono mt-1 block">
                    {profiles.filter(p => p.role === "player").length}
                  </span>
                </div>
                <CheckSquare size={20} className="text-green-400" />
              </div>
            </div>

            {/* Role Manager Content */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold font-display text-text-primary uppercase tracking-wider">
                    Fighter & Admin Directory
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Manage system access, promote co-organizers, or toggle tournament authority.
                  </p>
                </div>
                {/* Search */}
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search name, game UID, TG..."
                    value={roleSearchQuery}
                    onChange={(e) => setRoleSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-accent text-text-primary"
                  />
                </div>
              </div>

              {filteredProfiles.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-secondary">
                  No registered users match your search criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-text-secondary uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-4">User / IGN</th>
                        <th className="py-3 px-4">Username</th>
                        <th className="py-3 px-4">Game UID</th>
                        <th className="py-3 px-4">Telegram</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredProfiles.map((user) => {
                        const isCurrentUser = db && db.getCurrentUser()?.id === user.id;
                        return (
                          <tr key={user.id} className="hover:bg-background/20 transition group">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img
                                src={user.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`}
                                alt={user.display_name}
                                className="w-8 h-8 rounded-lg border border-border bg-background group-hover:border-accent/40 transition"
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-text-primary font-sans">
                                  {user.display_name}
                                </span>
                                <span className="text-[10px] text-text-secondary font-mono">
                                  {user.city || "No City Specified"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-text-secondary font-semibold">
                              @{user.username}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-text-primary">
                              {user.game_uid || "Not Linked"}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {user.telegram_username ? (
                                <span className="text-accent font-semibold">@{user.telegram_username}</span>
                              ) : (
                                <span className="text-text-secondary/50">None</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                user.role === "admin"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-accent/10 text-accent border border-accent/20"
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleToggleUserRole(user.id, user.role)}
                                disabled={isCurrentUser && user.role === "admin"}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer ${
                                  user.role === "admin"
                                    ? "border-accent/30 text-accent hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                    : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                }`}
                              >
                                {user.role === "admin" ? "Demote to Player" : "Promote to Admin"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </Shell>
  );
}
