import { Game, Tournament, Team, TeamMember, TournamentRegistration, MatchRoom, RoomAssignment, MatchResult, TournamentStanding, User, NotificationLog, Payment } from "@/types/database.types";
import { supabase } from "./supabase/client";

// Helper to generate UUIDs complying with standard UUID formats (RFC4122)
export const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback valid UUID format generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate team code like "SH-7284" based on team name
export const generateTeamCode = (teamName: string): string => {
  const words = teamName.trim().split(/\s+/);
  let prefix = "";
  if (words.length >= 2) {
    prefix = (words[0][0] + words[1][0]).toUpperCase();
  } else if (teamName.length >= 2) {
    prefix = teamName.substring(0, 2).toUpperCase();
  } else {
    prefix = (teamName[0] || "T") + "X";
  }
  const suffix = Math.floor(1000 + Math.random() * 9000); // random 4-digit code
  return `${prefix}-${suffix}`;
};

export class LocalDatabase {
  private games: Game[] = [];
  private profiles: User[] = [];
  private teams: Team[] = [];
  private teamMembers: TeamMember[] = [];
  private tournaments: Tournament[] = [];
  private registrations: TournamentRegistration[] = [];
  private payments: Payment[] = [];
  private rooms: MatchRoom[] = [];
  private roomAssignments: RoomAssignment[] = [];
  private results: MatchResult[] = [];
  private standings: TournamentStanding[] = [];
  private notificationLogs: NotificationLog[] = [];
  private currentUserId: string = "";

  constructor() {
    if (typeof window !== "undefined") {
      this.load();
      this.syncFromSupabase();
    } else {
      this.games = [];
      this.profiles = [];
      this.teams = [];
      this.tournaments = [];
      this.registrations = [];
      this.payments = [];
      this.teamMembers = [];
    }
  }

  // Load from localStorage cache (isolated fresh key space to avoid loading old mock entries)
  private load() {
    this.games = this.getItem("games", []);
    this.profiles = this.getItem("profiles", []);
    this.teams = this.getItem("teams", []);
    this.teamMembers = this.getItem("team_members", []);
    this.tournaments = this.getItem("tournaments", []);
    this.registrations = this.getItem("registrations", []);
    this.payments = this.getItem("payments", []);
    this.rooms = this.getItem("rooms", []);
    this.roomAssignments = this.getItem("room_assignments", []);
    this.results = this.getItem("results", []);
    this.standings = this.getItem("standings", []);
    this.notificationLogs = this.getItem("notification_logs", []);
    this.currentUserId = localStorage.getItem("crewarena-supabase-current-user-id") || "";
  }

  // Save to localStorage cache
  private save() {
    if (typeof window === "undefined") return;
    this.setItem("games", this.games);
    this.setItem("profiles", this.profiles);
    this.setItem("teams", this.teams);
    this.setItem("team_members", this.teamMembers);
    this.setItem("tournaments", this.tournaments);
    this.setItem("registrations", this.registrations);
    this.setItem("payments", this.payments);
    this.setItem("rooms", this.rooms);
    this.setItem("room_assignments", this.roomAssignments);
    this.setItem("results", this.results);
    this.setItem("standings", this.standings);
    this.setItem("notification_logs", this.notificationLogs);
    localStorage.setItem("crewarena-supabase-current-user-id", this.currentUserId);
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(`crewarena-supabase-${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem(key: string, val: any) {
    localStorage.setItem(`crewarena-supabase-${key}`, JSON.stringify(val));
  }

  // Supabase Sync Pull Handler
  async syncFromSupabase() {
    if (!supabase) return;
    try {
      const [
        gamesRes,
        profilesRes,
        teamsRes,
        membersRes,
        tournamentsRes,
        registrationsRes,
        paymentsRes,
        matchesRes,
        assignmentsRes,
        resultsRes,
        notificationsRes
      ] = await Promise.all([
        supabase.from("games").select("*"),
        supabase.from("users").select("*"),
        supabase.from("teams").select("*"),
        supabase.from("team_members").select("*"),
        supabase.from("tournaments").select("*"),
        supabase.from("registrations").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("matches").select("*"),
        supabase.from("room_assignments").select("*"),
        supabase.from("results").select("*"),
        supabase.from("notifications").select("*")
      ]);

      // Log sync errors
      const results = [
        { name: "games", ...gamesRes },
        { name: "users", ...profilesRes },
        { name: "teams", ...teamsRes },
        { name: "team_members", ...membersRes },
        { name: "tournaments", ...tournamentsRes },
        { name: "registrations", ...registrationsRes },
        { name: "payments", ...paymentsRes },
        { name: "matches", ...matchesRes },
        { name: "room_assignments", ...assignmentsRes },
        { name: "results", ...resultsRes },
        { name: "notifications", ...notificationsRes }
      ];

      results.forEach(res => {
        if (res.error) {
          console.error(`Supabase sync query error on table "${res.name}":`, res.error.message, res.error.details);
        }
      });

      const gamesData = gamesRes.data;
      const profilesData = profilesRes.data;
      const teamsData = teamsRes.data;
      const membersData = membersRes.data;
      const tournamentsData = tournamentsRes.data;
      const registrationsData = registrationsRes.data;
      const paymentsData = paymentsRes.data;
      const matchesData = matchesRes.data;
      const assignmentsData = assignmentsRes.data;
      const resultsData = resultsRes.data;
      const notificationsData = notificationsRes.data;

      const defaultGames: Game[] = [
        { id: "bf81850d-d421-4ea9-a111-ce1515bb5c81", name: "Free Fire", slug: "free-fire", teams_per_room: 10, finalists: 12, qualification: "points" as const, points_config: { "1": 12, "2": 9, "3": 8, "4": 7, "5": 6, "6": 5, "7": 4, "8": 3, "9": 2, "10": 1, "kill": 1 }, created_at: new Date().toISOString() },
        { id: "e12bd84d-2df9-4c12-841f-1ad078d10b72", name: "BGMI", slug: "bgmi", teams_per_room: 25, finalists: 16, qualification: "points" as const, points_config: { "1": 15, "2": 12, "3": 10, "4": 8, "5": 6, "6": 4, "7": 2, "8": 1, "kill": 1 }, created_at: new Date().toISOString() },
        { id: "c26be6fd-1d88-43e5-8b83-a9d02f5a5423", name: "Valorant", slug: "valorant", teams_per_room: 2, finalists: 2, qualification: "bracket" as const, points_config: { "1": 1, "2": 0, "kill": 0 }, created_at: new Date().toISOString() },
        { id: "d37cf7fe-2e99-4d23-9c94-b0d03f5a5424", name: "COD Mobile", slug: "cod-mobile", teams_per_room: 10, finalists: 12, qualification: "points" as const, points_config: { "1": 15, "2": 12, "3": 10, "4": 8, "5": 6, "6": 4, "7": 2, "8": 1, "kill": 1 }, created_at: new Date().toISOString() },
        { id: "e48df8ff-3fa0-4e34-ad05-c1d04f5a5425", name: "PUBG PC", slug: "pubg-pc", teams_per_room: 16, finalists: 16, qualification: "points" as const, points_config: { "1": 10, "2": 6, "3": 5, "4": 4, "5": 3, "6": 2, "7": 1, "8": 1, "kill": 1 }, created_at: new Date().toISOString() },
        { id: "f59ef900-4fb1-4f45-be16-d2e05f5a5426", name: "CS2", slug: "cs2", teams_per_room: 2, finalists: 2, qualification: "bracket" as const, points_config: { "1": 1, "2": 0, "kill": 0 }, created_at: new Date().toISOString() }
      ];

      if (gamesData) {
        const existingIds = gamesData.map(g => g.id);
        const missingGames = defaultGames.filter(dg => !existingIds.includes(dg.id));
        if (missingGames.length > 0) {
          for (const mg of missingGames) {
            this.dbWrite("games", "insert", mg);
          }
          this.games = [...gamesData, ...missingGames];
        } else {
          this.games = gamesData;
        }
      } else {
        this.games = defaultGames;
      }
      if (profilesData) this.profiles = profilesData;
      if (teamsData) this.teams = teamsData;
      if (membersData) this.teamMembers = membersData;
      if (tournamentsData) this.tournaments = tournamentsData;
      if (registrationsData) this.registrations = registrationsData;
      if (paymentsData) this.payments = paymentsData;
      if (matchesData) this.rooms = matchesData;
      if (assignmentsData) {
        this.roomAssignments = assignmentsData.map((a: any) => ({
          id: a.id,
          room_id: a.room_id,
          team_id: a.team_id,
          seed_number: a.seed_number
        }));
      }
      if (resultsData) this.results = resultsData;
      if (notificationsData) this.notificationLogs = notificationsData;

      // Update local storage so cache is warmed up
      this.save();

      // Trigger recalculation of standings based on Supabase inputs
      this.tournaments.forEach(t => this.recalculateStandings(t.id));

      // Dispatch event to trigger state reload in all listening UI pages
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("db-sync"));
      }
    } catch (err) {
      console.error("Supabase initial sync error:", err);
    }
  }

  // Supabase Async Write Handler Helper
  private async dbWrite(table: string, action: "insert" | "update" | "delete" | "upsert", data: any, matchField?: string, matchValue?: any) {
    if (!supabase) return;
    try {
      let query = supabase.from(table);
      let res;
      if (action === "insert") {
        res = await query.insert(data);
      } else if (action === "update") {
        if (matchField && matchValue !== undefined) {
          res = await query.update(data).eq(matchField, matchValue);
        }
      } else if (action === "upsert") {
        res = await query.upsert(data);
      } else if (action === "delete") {
        if (matchField && matchValue !== undefined) {
          res = await query.delete().eq(matchField, matchValue);
        }
      }

      if (res && res.error) {
        console.error(`Supabase DB Write Error on table "${table}":`, res.error.message, res.error.details, res.error.hint);
      }
    } catch (err) {
      console.error(`Supabase sync write exception on ${table}:`, err);
    }
  }

  // Auth Operations
  getCurrentUser(): User {
    if (this.currentUserId) {
      const user = this.profiles.find(p => p.id === this.currentUserId);
      if (user) return user;

      // Self-healing: If currentUserId is set but no profile exists in cache, create a default profile row!
      const defaultUsername = `gamer_${this.currentUserId.substring(0, 6)}`;
      const newProfile: User = {
        id: this.currentUserId,
        username: defaultUsername,
        name: "Gamer",
        display_name: "Gamer",
        avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${defaultUsername}`,
        phone: "",
        city: "",
        game_uid: "",
        telegram_username: "",
        telegram_id: null,
        role: "player",
        created_at: new Date().toISOString()
      };

      this.profiles.push(newProfile);
      this.save();

      // Write-through to Supabase
      this.dbWrite("users", "upsert", newProfile);
      return newProfile;
    }

    // Return blank anonymous profile to prevent application crashes when not logged in
    return {
      id: "",
      username: "anonymous",
      name: "Anonymous",
      display_name: "Anonymous",
      avatar_url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=anonymous",
      phone: "",
      city: "",
      game_uid: "",
      telegram_username: "",
      telegram_id: null,
      role: "player",
      created_at: new Date().toISOString()
    };
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
    this.save();
  }

  getProfiles(): User[] {
    return this.profiles;
  }

  createProfile(
    username: string,
    displayName: string,
    phone: string,
    city: string = "",
    gameUid: string = "",
    telegramUser: string = "",
    role: "player" | "admin" = "player"
  ): User {
    const profile: User = {
      id: generateUUID(),
      username,
      name: displayName || username,
      display_name: displayName || username,
      avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
      phone,
      city,
      game_uid: gameUid,
      telegram_username: telegramUser,
      telegram_id: null,
      role,
      created_at: new Date().toISOString()
    };
    this.profiles.push(profile);
    this.currentUserId = profile.id;
    this.save();

    // Supabase push
    this.dbWrite("users", "insert", profile);
    return profile;
  }

  updateProfile(data: Partial<User>) {
    const user = this.getCurrentUser();
    const updated = { ...user, ...data };
    this.profiles = this.profiles.map(p => p.id === user.id ? updated : p);
    this.save();

    // Use upsert to write the full updated profile row to Supabase
    this.dbWrite("users", "upsert", updated);
  }

  updateUserRole(userId: string, newRole: "player" | "admin") {
    const profile = this.profiles.find(p => p.id === userId);
    if (!profile) return;
    profile.role = newRole;
    this.profiles = this.profiles.map(p => p.id === userId ? { ...profile } : p);
    this.save();
    this.dbWrite("users", "upsert", profile);
  }

  linkTelegram(telegramUsername: string, chatId: number) {
    const user = this.getCurrentUser();
    if (!user.id) return;
    user.telegram_username = telegramUsername;
    user.telegram_id = chatId;
    this.profiles = this.profiles.map(p => p.id === user.id ? { ...user } : p);
    this.save();

    // Use upsert to write the full updated profile row to Supabase
    this.dbWrite("users", "upsert", user);
    this.pushNotification(chatId, `✅ Account Connected Successfully!\nStored Telegram ID ${chatId} in database.`);
  }

  // Games Operations
  getGames(): Game[] {
    return this.games;
  }

  // Tournaments Operations
  getTournaments(): Tournament[] {
    return this.tournaments;
  }

  getTournamentById(id: string): Tournament | undefined {
    return this.tournaments.find(t => t.id === id);
  }

  createTournament(data: Partial<Tournament>): Tournament {
    const tourney: Tournament = {
      id: generateUUID(),
      name: data.name || "New Tournament",
      slug: (data.name || "new").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      game_id: data.game_id || "bf81850d-d421-4ea9-a111-ce1515bb5c81",
      entry_fee: data.entry_fee || 0,
      prize_pool: data.prize_pool || 0,
      max_teams: data.max_teams || 12,
      qualifier_spots: data.qualifier_spots || 4,
      status: "registration",
      rules: data.rules || "Standard rules apply.",
      start_date: data.start_date || new Date(Date.now() + 172800000).toISOString(),
      end_date: null,
      champion_team_id: null,
      runner_up_team_id: null,
      mvp_player_id: null,
      created_at: new Date().toISOString()
    };
    this.tournaments.push(tourney);
    this.save();

    // Supabase push
    this.dbWrite("tournaments", "insert", tourney);

    // Trigger Telegram Channel automation announcement
    this.pushNotification(9999, `📢 NEW TOURNAMENT ANNOUNCEMENT:\n🏆 *${tourney.name}* is now open for registration!\nPrize Pool: *₹${tourney.prize_pool}*\nEntry Fee: *${tourney.entry_fee === 0 ? "FREE" : `₹${tourney.entry_fee}`}*`);
    return tourney;
  }

  endTournament(tournamentId: string, championId: string, runnerUpId: string, mvpId: string) {
    this.tournaments = this.tournaments.map(t => {
      if (t.id === tournamentId) {
        const updated = {
          ...t,
          status: "completed" as const,
          champion_team_id: championId,
          runner_up_team_id: runnerUpId,
          mvp_player_id: mvpId,
          end_date: new Date().toISOString()
        };
        
        // Supabase push
        this.dbWrite("tournaments", "update", {
          status: "completed",
          champion_team_id: championId,
          runner_up_team_id: runnerUpId,
          mvp_player_id: mvpId,
          end_date: updated.end_date
        }, "id", tournamentId);

        // Pushes channel notification
        const champ = this.getTeamById(championId);
        const runner = this.getTeamById(runnerUpId);
        const mvp = this.profiles.find(p => p.id === mvpId);

        this.pushNotification(9999, `🔥 TOURNAMENT closed - WINNERS DECLARED:\n🏆 Champion: *${champ?.name}*\n🥈 Runner Up: *${runner?.name}*\n🌟 MVP: *${mvp?.name}*`);
        return updated;
      }
      return t;
    });
    this.save();
  }

  // Teams Operations
  getTeams(): Team[] {
    return this.teams;
  }

  getTeamById(id: string): Team | undefined {
    return this.teams.find(t => t.id === id);
  }

  createTeam(name: string, primaryGameId: string): Team {
    const code = generateTeamCode(name);
    const team: Team = {
      id: generateUUID(),
      name,
      tag: code,
      logo_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
      captain_id: this.currentUserId,
      primary_game: primaryGameId,
      created_at: new Date().toISOString()
    };
    this.teams.push(team);

    // Supabase push
    this.dbWrite("teams", "insert", team);

    // Auto-approve Captain as TeamMember
    const member: TeamMember = {
      id: generateUUID(),
      team_id: team.id,
      player_id: this.currentUserId,
      status: "approved",
      role: "captain",
      joined_at: new Date().toISOString()
    };
    this.teamMembers.push(member);

    // Supabase push
    this.dbWrite("team_members", "insert", member);

    this.save();
    return team;
  }

  // Captain Join Request Approvals Queue
  getTeamMembers(teamId: string): TeamMember[] {
    return this.teamMembers.filter(tm => tm.team_id === teamId);
  }

  sendJoinRequest(teamTag: string): boolean {
    const team = this.teams.find(t => t.tag === teamTag.toUpperCase());
    if (!team) return false;

    // Check if already requested
    const existing = this.teamMembers.find(tm => tm.team_id === team.id && tm.player_id === this.currentUserId);
    if (existing) return true;

    const request: TeamMember = {
      id: generateUUID(),
      team_id: team.id,
      player_id: this.currentUserId,
      status: "pending",
      role: "member",
      joined_at: new Date().toISOString()
    };
    this.teamMembers.push(request);
    this.save();

    // Supabase push
    this.dbWrite("team_members", "insert", request);
    return true;
  }

  approveJoinRequest(memberId: string) {
    this.teamMembers = this.teamMembers.map(tm => {
      if (tm.id === memberId) {
        const updated = { ...tm, status: "approved" as const };
        const player = this.profiles.find(p => p.id === tm.player_id);
        if (player?.telegram_id) {
          this.pushNotification(player.telegram_id, `✅ Your request to join team roster has been APPROVED by the Captain!`);
        }
        
        // Supabase push
        this.dbWrite("team_members", "update", { status: "approved" }, "id", memberId);
        return updated;
      }
      return tm;
    });
    this.save();
  }

  rejectJoinRequest(memberId: string) {
    this.teamMembers = this.teamMembers.map(tm => {
      if (tm.id === memberId) {
        const updated = { ...tm, status: "rejected" as const };
        const player = this.profiles.find(p => p.id === tm.player_id);
        if (player?.telegram_id) {
          this.pushNotification(player.telegram_id, `❌ Your request to join team roster has been rejected by the Captain.`);
        }

        // Supabase push
        this.dbWrite("team_members", "update", { status: "rejected" }, "id", memberId);
        return updated;
      }
      return tm;
    });
    this.save();
  }

  // Registrations Operations
  getRegistrations(): TournamentRegistration[] {
    return this.registrations;
  }

  getRegistrationsForTournament(tournamentId: string): TournamentRegistration[] {
    return this.registrations.filter(r => r.tournament_id === tournamentId);
  }

  getPayments(): Payment[] {
    return this.payments;
  }

  registerTeam(tournamentId: string, teamId: string, utr: string, screenshotUrl: string): TournamentRegistration {
    const existing = this.registrations.find(r => r.tournament_id === tournamentId && r.team_id === teamId);
    if (existing) return existing;

    const tourney = this.getTournamentById(tournamentId);
    const reg: TournamentRegistration = {
      id: generateUUID(),
      tournament_id: tournamentId,
      team_id: teamId,
      status: tourney?.entry_fee === 0 ? "approved" : "pending",
      created_at: new Date().toISOString()
    };
    this.registrations.push(reg);

    // Supabase push
    this.dbWrite("registrations", "insert", reg);

    // Save payment details if required
    const payAmount = tourney?.entry_fee || 0;
    const payment: Payment = {
      id: generateUUID(),
      registration_id: reg.id,
      amount: payAmount,
      utr_number: utr || "FREE-ENTRY",
      screenshot_url: screenshotUrl || null,
      status: tourney?.entry_fee === 0 ? "approved" : "pending",
      created_at: new Date().toISOString()
    };
    this.payments.push(payment);

    // Supabase push
    this.dbWrite("payments", "insert", payment);
    this.save();

    // Trigger immediate notifications
    const team = this.getTeamById(teamId);
    const captain = this.profiles.find(p => p.id === team?.captain_id);
    if (captain?.telegram_id) {
      if (tourney?.entry_fee === 0) {
        this.pushNotification(
          captain.telegram_id,
          `🤖 Bot: Your Team ${team?.name} Has Been Registered Successfully for ${tourney.name}!`
        );
      } else {
        this.pushNotification(
          captain.telegram_id,
          `🤖 Bot: Payment submitted. Registration for ${team?.name} is pending admin verification.`
        );
      }
    }
    return reg;
  }

  approveRegistration(regId: string) {
    const reg = this.registrations.find(r => r.id === regId);
    if (!reg) return;
    reg.status = "approved";

    // Supabase push
    this.dbWrite("registrations", "update", { status: "approved" }, "id", regId);

    // Update payment
    this.payments = this.payments.map(p => {
      if (p.registration_id === regId) {
        this.dbWrite("payments", "update", { status: "approved" }, "registration_id", regId);
        return { ...p, status: "approved" as const };
      }
      return p;
    });
    this.save();

    const team = this.getTeamById(reg.team_id);
    const tourney = this.getTournamentById(reg.tournament_id);
    const captain = this.profiles.find(p => p.id === team?.captain_id);
    if (captain?.telegram_id) {
      this.pushNotification(
        captain.telegram_id,
        `🤖 Bot: Your Team *${team?.name}* Has Been Registered Successfully for *${tourney?.name}*!`
      );
    }
  }

  rejectRegistration(regId: string, reason: string) {
    const reg = this.registrations.find(r => r.id === regId);
    if (!reg) return;
    reg.status = "rejected";

    // Supabase push
    this.dbWrite("registrations", "update", { status: "rejected" }, "id", regId);

    // Update payment
    this.payments = this.payments.map(p => {
      if (p.registration_id === regId) {
        this.dbWrite("payments", "update", { status: "rejected" }, "registration_id", regId);
        return { ...p, status: "rejected" as const };
      }
      return p;
    });
    this.save();

    const team = this.getTeamById(reg.team_id);
    const tourney = this.getTournamentById(reg.tournament_id);
    const captain = this.profiles.find(p => p.id === team?.captain_id);
    if (captain?.telegram_id) {
      this.pushNotification(
        captain.telegram_id,
        `❌ Registration for *${tourney?.name}* rejected.\nReason: ${reason}`
      );
    }
  }

  // Room Generation & Match Ops
  getRooms(): MatchRoom[] {
    return this.rooms;
  }

  getRoomsForTournament(tournamentId: string): MatchRoom[] {
    return this.rooms.filter(r => r.tournament_id === tournamentId);
  }

  getRoomAssignments(roomId: string): RoomAssignment[] {
    return this.roomAssignments.filter(a => a.room_id === roomId);
  }

  saveRoomsAndAssignments(newRooms: MatchRoom[], newAssignments: RoomAssignment[]) {
    this.rooms = [...this.rooms, ...newRooms];
    this.roomAssignments = [...this.roomAssignments, ...newAssignments];
    this.save();

    // Supabase push
    newRooms.forEach(room => this.dbWrite("matches", "insert", room));
    newAssignments.forEach(assign => this.dbWrite("room_assignments", "insert", {
      id: assign.id,
      room_id: assign.room_id,
      team_id: assign.team_id,
      seed_number: assign.seed_number
    }));
  }

  updateRoomDetails(roomId: string, roomCode: string, password: string) {
    this.rooms = this.rooms.map(r => {
      if (r.id === roomId) {
        const updated = { ...r, room_id_code: roomCode, room_password: password };
        
        // Supabase push
        this.dbWrite("matches", "update", { room_id_code: roomCode, room_password: password }, "id", roomId);

        // Push notification details immediately to all players
        const assignments = this.getRoomAssignments(roomId);
        assignments.forEach(assign => {
          const team = this.getTeamById(assign.team_id);
          if (team) {
            const captain = this.profiles.find(p => p.id === team.captain_id);
            if (captain?.telegram_id) {
              this.pushNotification(
                captain.telegram_id,
                `⚡ Match Starts In 15 Minutes\nRoom ID: \`${roomCode}\`\nPassword: \`${password}\`\nOnly eligible teams receive it.`
              );
            }
          }
        });
        return updated;
      }
      return r;
    });
    this.save();
  }

  // Results
  getResults(): MatchResult[] {
    return this.results;
  }

  getResultsForRoom(roomId: string): MatchResult[] {
    return this.results.filter(r => r.match_id === roomId);
  }

  enterResults(roomId: string, matchResults: Omit<MatchResult, "id" | "total_points" | "created_at">[]) {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;

    // Remove existing results locally
    this.results = this.results.filter(r => r.match_id !== roomId);

    // Supabase clean
    this.dbWrite("results", "delete", null, "match_id", roomId);

    matchResults.forEach(res => {
      const entryId = generateUUID();
      const entry: MatchResult = {
        ...res,
        id: entryId,
        total_points: res.placement_points + res.kills,
        created_at: new Date().toISOString()
      };
      this.results.push(entry);

      // Supabase insert
      this.dbWrite("results", "insert", {
        id: entryId,
        match_id: res.match_id,
        team_id: res.team_id,
        position: res.position,
        kills: res.kills,
        placement_points: res.placement_points,
        kill_points: res.kill_points
      });
    });

    room.status = "completed";
    
    // Supabase match status update
    this.dbWrite("matches", "update", { status: "completed" }, "id", roomId);
    
    this.save();

    // Recalculate standings
    this.recalculateStandings(room.tournament_id);

    // Notify all players about match results
    const assignments = this.getRoomAssignments(roomId);
    assignments.forEach(assign => {
      const team = this.getTeamById(assign.team_id);
      const teamResult = this.results.find(res => res.match_id === roomId && res.team_id === assign.team_id);
      if (team && teamResult) {
        const captain = this.profiles.find(p => p.id === team.captain_id);
        if (captain?.telegram_id) {
          this.pushNotification(
            captain.telegram_id,
            `📊 MATCH RESULTS ARE LIVE for *${room.room_label}*:\nPlacement: *#${teamResult.position}* (${teamResult.placement_points} pts)\nKills: *${teamResult.kills}* (${teamResult.kill_points} pts)\nTotal Match Points: *${teamResult.placement_points + teamResult.kill_points}*`
          );
        }
      }
    });

    // Public channel results automation trigger
    const tourney = this.getTournamentById(room.tournament_id);
    this.pushNotification(
      9999,
      `📊 MATCH RESULTS PUBLIC BROADCAST:\nLobby: *${room.room_label}* (${tourney?.name})\nScores updated in real-time on leaderboards.`
    );
  }

  // Standings / Leaderboards
  getStandings(tournamentId: string): TournamentStanding[] {
    return this.standings.filter(s => s.tournament_id === tournamentId);
  }

  recalculateStandings(tournamentId: string) {
    const tourney = this.getTournamentById(tournamentId);
    if (!tourney) return;

    const tourneyRooms = this.getRoomsForTournament(tournamentId);
    const completedRoomIds = tourneyRooms.filter(r => r.status === "completed").map(r => r.id);

    this.standings = this.standings.filter(s => s.tournament_id !== tournamentId);

    // Get all approved registered teams
    const approvedRegs = this.registrations.filter(r => r.tournament_id === tournamentId && r.status === "approved");
    const standingsMap: { [teamId: string]: Omit<TournamentStanding, "id" | "current_rank"> } = {};

    approvedRegs.forEach(reg => {
      standingsMap[reg.team_id] = {
        tournament_id: tournamentId,
        team_id: reg.team_id,
        total_matches: 0,
        total_kills: 0,
        total_points: 0,
        qualification_status: "pending",
        updated_at: new Date().toISOString()
      };
    });

    this.results.forEach(res => {
      if (completedRoomIds.includes(res.match_id) && standingsMap[res.team_id]) {
        standingsMap[res.team_id].total_matches += 1;
        standingsMap[res.team_id].total_kills += res.kills;
        standingsMap[res.team_id].total_points += (res.placement_points + res.kill_points);
      }
    });

    const sortedStandings = Object.values(standingsMap).sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return b.total_kills - a.total_kills;
    });

    sortedStandings.forEach((st, idx) => {
      const standingWithRank: TournamentStanding = {
        ...st,
        id: "st-" + generateUUID(),
        current_rank: idx + 1
      };

      const allRoomsDone = tourneyRooms.length > 0 && tourneyRooms.every(r => r.status === "completed");
      if (allRoomsDone) {
        if (idx < tourney.qualifier_spots) {
          standingWithRank.qualification_status = "qualified";
          const team = this.getTeamById(st.team_id);
          const captain = this.profiles.find(p => p.id === team?.captain_id);
          if (captain?.telegram_id && team) {
            this.pushNotification(
              captain.telegram_id,
              `🏆 Congratulations! Your team *${team.name}* has QUALIFIED for the Grand Final of *${tourney.name}*!`
            );
          }
        } else {
          standingWithRank.qualification_status = "eliminated";
          const team = this.getTeamById(st.team_id);
          const captain = this.profiles.find(p => p.id === team?.captain_id);
          if (captain?.telegram_id && team) {
            this.pushNotification(
              captain.telegram_id,
              `❌ Unfortunately, your team *${team.name}* did not qualify for the finals of *${tourney.name}*.`
            );
          }
        }
      }

      this.standings.push(standingWithRank);
    });

    this.save();
  }

  // Telegram Notifications Simulator queue
  getNotifications(): NotificationLog[] {
    return this.notificationLogs;
  }

  pushNotification(telegramId: number, text: string) {
    const log: NotificationLog = {
      id: generateUUID(),
      telegram_id: telegramId,
      message_text: text,
      sent_at: new Date().toISOString(),
      status: "sent"
    };
    this.notificationLogs.unshift(log); // newest first
    this.save();

    // Supabase push
    this.dbWrite("notifications", "insert", log);
  }

  clearNotifications() {
    this.notificationLogs = [];
    this.save();
    
    // Supabase clear
    if (supabase) {
      supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000").then();
    }
  }
}

// Global DB instance
export const db = (typeof window !== "undefined" ? new LocalDatabase() : null) as unknown as LocalDatabase;
