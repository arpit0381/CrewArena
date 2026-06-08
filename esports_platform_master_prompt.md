# 🎮 ESPORTS TOURNAMENT MANAGEMENT PLATFORM — MASTER BUILD PROMPT

> **Project Codename:** `Crew Arena`
> **Version:** MVP V1
> **Stack:** Next.js 15 · TypeScript · Tailwind CSS · Shadcn UI · Supabase · Telegraf.js · Vercel

---

## 🧭 PROJECT OVERVIEW

Build a **fully automated, game-driven esports tournament management platform** called **Crew Arena**. The core philosophy: *the admin should never manually calculate groups, qualifiers, finalists, points, or room distribution.* The system auto-configures everything based on the selected game.

The platform supports: **Free Fire, BGMI, Valorant, CS2, COD Mobile, PUBG PC** — and is architected to support any future game without rewriting logic.

---

## 🎨 UI/UX DESIGN SYSTEM

### Visual Identity
- **Aesthetic:** Dark cyberpunk-meets-premium esports. Think neon-lit arenas, deep blacks, electric accents.
- **Primary Theme (Dark):** Background `#0A0A0F`, surface `#111118`, border `#1E1E2E`
- **Accent Colors:** Electric Blue `#00D4FF`, Neon Green `#00FF88`, Hot Magenta `#FF0080`, Gold `#FFD700`
- **Typography:**
  - Display / Headings: `Rajdhani` or `Orbitron` (Google Fonts) — sharp, angular, futuristic
  - Body: `DM Sans` or `Outfit` — clean, highly readable
  - Monospace (IDs, codes): `JetBrains Mono`
- **Borders:** Subtle `1px` neon-glow borders on cards, `border-color: rgba(0,212,255,0.15)`
- **Glassmorphism:** Cards use `backdrop-filter: blur(12px)` with `bg-white/5`
- **Motion:** Framer Motion for page transitions, staggered list reveals, live score counters, notification slides

### Multiple Themes (User-Selectable)
Store preference in `localStorage` + Supabase user profile.

| Theme Name | Primary BG | Accent | Vibe |
|---|---|---|---|
| `cyber-dark` (default) | `#0A0A0F` | `#00D4FF` | Dark cyberpunk |
| `neon-night` | `#050510` | `#FF0080` | Deep purple-magenta |
| `forest-ops` | `#0D1A0D` | `#00FF88` | Military green |
| `gold-elite` | `#0F0A00` | `#FFD700` | Premium gold |
| `light-arena` | `#F0F4FF` | `#4F46E5` | Clean light mode |

Implement via CSS custom properties on `:root` with a `ThemeProvider` context. Theme switcher in Settings and accessible from the top nav.

### Responsive Breakpoints
- Mobile-first. All layouts must work at 320px+
- Breakpoints: `sm:640px` `md:768px` `lg:1024px` `xl:1280px` `2xl:1536px`
- Mobile navigation: bottom tab bar (5 icons)
- Desktop navigation: collapsible left sidebar + top header
- Tournament brackets: horizontal scroll on mobile, full view on desktop
- Leaderboard tables: card stacks on mobile, full table on desktop

### Micro-interactions & Animations
- Page load: staggered card entrance (150ms delay each)
- Live point updates: animated counter increment
- Qualification badge: pulse animation on `Qualified` status
- Room password reveal: blur → unblur on tap/click
- Match countdown: animated circular progress ring
- Toast notifications: slide-in from top-right with auto-dismiss

---

## 🏗️ COMPLETE FEATURE SPECIFICATION

---

### 1. 🔐 AUTHENTICATION SYSTEM

**Pages:** `/login` `/register` `/forgot-password`

**Implementation:**
- Supabase Auth (email + password)
- OAuth: Google (optional future)
- After registration → Profile Setup flow (username, game ID, phone)
- Telegram linking step (inline bot link with OTP verification)
- Roles: `player`, `team_captain`, `admin` — stored in `profiles.role`

**UI Requirements:**
- Split-screen login: left = animated game montage (CSS-only particle effect or video loop), right = form
- Form fields with neon focus rings
- Password strength indicator
- "Connect Telegram" button with bot avatar and animated status (disconnected → connecting → connected ✓)
- Smooth transition between login/register with shared layout animation

---

### 2. 👤 PLAYER PROFILE & DASHBOARD

**Route:** `/dashboard` (player home after login)

**Sections:**

#### Hero Stats Bar
```
[ Avatar + IGN ] [ Tournaments Played: 12 ] [ Total Kills: 847 ] [ Win Rate: 34% ] [ Earnings: ₹4,200 ]
```

#### Active Tournament Card
- Game badge (Free Fire / BGMI / etc.)
- Match countdown timer (live)
- Quick action: "View Room Details" (blurred until T-15min)
- Qualification status pill: `Qualified ✓` / `Eliminated` / `Pending`

#### My Teams Panel
- List of teams user belongs to
- Captain badge indicator
- "Create Team" / "Join Team" CTA

#### Recent Results Feed
- Timeline of match results with placement + kill count
- Points earned per match
- Animated bar chart of performance trend (last 5 matches)

#### Telegram Status Widget
- Shows bot connection status
- Last notification received
- "Test Notification" button

---

### 3. 👥 TEAM MANAGEMENT

**Routes:** `/teams` `/teams/create` `/teams/[id]` `/teams/[id]/manage`

**Team Creation Flow:**
1. Team Name + Tag (e.g., `ALPHA`, max 5 chars)
2. Upload Team Logo (Supabase Storage, auto-resized)
3. Select primary game
4. Generate invite link / code
5. Set roster size requirement (auto-loaded from game config)

**Team Detail Page:**
- Team banner with logo, name, tag, win/loss record
- Roster grid: player cards with IGN, kills avg, role
- Tournament history table
- Captain controls: invite / remove members, disband

**Roster Rules (auto-enforced per game):**
```
Free Fire: 4 players (min 4, max 6 with subs)
BGMI: 4 players
Valorant: 5 players
CS2: 5 players
CODM: 5 players
PUBG PC: 4 players
```

---

### 4. 🏆 TOURNAMENT BROWSER

**Route:** `/tournaments`

**Layout:**
- Filter bar: Game · Status (Upcoming/Live/Completed) · Entry Fee · Prize Pool
- Toggle: Grid view / List view
- Search by tournament name

**Tournament Card:**
```
┌─────────────────────────────┐
│ [GAME BADGE]  FREE FIRE     │
│ Summer Clash 2025           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🏆 ₹50,000   📅 Jun 15     │
│ 💰 ₹100/team  👥 32/64     │
│ [REGISTER NOW →]            │
└─────────────────────────────┘
```

**Tournament Detail Page:** `/tournaments/[id]`

Tabs:
- **Overview** — Prize breakdown, schedule, rules, format
- **Teams** — Registered teams grid with avatars
- **Groups** — Room/group assignments (shown after draw)
- **Leaderboard** — Live points table (auto-updates via Supabase Realtime)
- **Bracket** — Visual bracket (for elimination formats like Valorant)
- **Results** — Match-by-match result history

---

### 5. 📝 TOURNAMENT REGISTRATION FLOW

**Multi-step modal/page flow:**

```
Step 1: Select Your Team
        → Shows teams user captains
        → Checks team has required roster count

Step 2: Review Entry
        → Tournament rules summary
        → Prize pool breakdown
        → Entry fee: ₹XXX
        → "Confirm & Proceed to Payment"

Step 3: Payment Upload
        → UPI QR code display (admin-configured)
        → Upload screenshot of payment
        → Enter UTR/transaction ID
        → Submit → Status: "Pending Approval"

Step 4: Confirmation
        → "Registration submitted! Admin will verify payment."
        → Telegram notification: "Payment submitted, awaiting approval"
```

**Status flow:** `pending_payment` → `payment_submitted` → `approved` / `rejected`

---

### 6. 🤖 AUTOMATION ENGINE (CORE MVP)

This is the heart of the platform. All logic is server-side via Next.js API Routes / Server Actions.

#### 6A. Auto Room Generation

**Trigger:** Admin clicks "Generate Groups" on tournament

**Logic:**
```typescript
function generateRooms(teams: Team[], teamsPerMatch: number): Room[] {
  const shuffled = shuffleArray(teams); // Fisher-Yates random seeding
  const rooms: Room[] = [];
  for (let i = 0; i < shuffled.length; i += teamsPerMatch) {
    rooms.push({
      name: `Room ${String.fromCharCode(65 + rooms.length)}`, // A, B, C...
      teams: shuffled.slice(i, i + teamsPerMatch)
    });
  }
  return rooms;
}
```

**Result display:** Animated room reveal — cards flip in one by one showing team assignments.

#### 6B. Dynamic Points Calculation

**Trigger:** Admin submits match results

**Engine:**
```typescript
function calculatePoints(
  game: GameConfig,
  result: MatchResult
): TeamMatchScore {
  const placementPoints = game.points[result.position] ?? 0;
  const killPoints = result.kills * game.points.kill;
  return { total: placementPoints + killPoints, placement: placementPoints, kills: killPoints };
}
```

**Supported configs (stored in `games` table):**
```json
// Free Fire
{ "1":12, "2":9, "3":8, "4":7, "5":6, "6":5, "7":4, "8":3, "9":2, "10":1, "kill":1 }

// BGMI
{ "1":15, "2":12, "3":10, "4":8, "5":6, "6":4, "7":2, "8":1, "kill":1 }

// COD Mobile / PUBG PC — same pattern
```

#### 6C. Auto Qualification Engine

**Trigger:** After all group stage matches are entered

**Logic per format:**
```
POINTS FORMAT (Free Fire, BGMI):
  → Aggregate all teams' total points across all rooms
  → Sort descending
  → Top N teams = Qualified (N is tournament's qualifier_count setting)

ELIMINATION FORMAT (Valorant, CS2):
  → Already bracket-based, winners auto-advance
  → System marks match winner and advances to next round
```

#### 6D. Auto Grand Final Generation

**Trigger:** Qualification round ends (all matches entered)

```
1. Query all teams with status = 'qualified'
2. Create new Match record: type = 'grand_final'
3. Assign qualified teams to GF rooms (auto-distributed)
4. Schedule GF notifications
5. Notify admin: "Grand Final ready — set room ID/password"
```

#### 6E. Telegram Notification Scheduler

**Bot triggers (Telegraf.js on Vercel Edge or separate Node service):**

```
T-24h: "🎮 Match tomorrow! [Tournament Name] starts at [time]"
T-15m: "⚡ Match in 15 mins!\nRoom ID: [id]\nPassword: [pass]\n[Game deep link]"
On Qualification: "🏆 Your team [Name] has QUALIFIED for the Grand Final!"
On Elimination: "❌ Unfortunately [Team] did not qualify. Better luck next time!"
On Results: "📊 Match results are live! Check leaderboard: [link]"
On GF: "🔥 GRAND FINAL ROOM DETAILS:\nRoom: [id]\nPass: [pass]"
```

**Security:** Room IDs/passwords only sent to players with `status = 'approved'` in that specific match.

---

### 7. 📊 LIVE LEADERBOARD

**Route:** `/tournaments/[id]/leaderboard`

**Features:**
- Supabase Realtime subscription on `match_results` table
- Columns: Rank · Team · Logo · Matches Played · Total Kills · Total Points · Status
- Rank change animations: ↑↓ arrows with color flash on position change
- Filter: Group stage / Overall / Grand Final
- Export CSV button (admin only)
- "Qualified" badge with pulsing green glow on qualifying teams
- Mobile: collapsible stat columns, tap to expand team detail

**Realtime update flow:**
```
Admin enters result → DB insert → Supabase broadcast → 
Client receives event → Recalculate standings in-memory → 
Animate rank changes → Update UI
```

---

### 8. 🗂️ ADMIN DASHBOARD

**Route:** `/admin` (role-gated, redirect if not admin)

#### 8A. Analytics Overview
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Teams  │ │Total Players │ │  Revenue     │ │Live Tourneys │
│    1,247     │ │    4,832     │ │  ₹1,24,500   │ │      3       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```
- Revenue chart: 30-day line chart (Recharts)
- Registration trend: bar chart per tournament
- Game distribution: donut chart

#### 8B. Tournament Management Panel

List view of all tournaments with quick actions:
```
[Tournament Name] [Game] [Status] [Teams] [Actions]
Summer Clash       FF    Live      53/64   [Results] [Rooms] [Notify] [End]
```

**Tournament Creation Form** (`/admin/tournaments/create`):

```
Step 1 — Select Game
  [ Free Fire ▼ ] → Auto-loads: 10 teams/room, points scoring, qualifier logic

Step 2 — Tournament Details
  Name: ______________
  Date & Time: ________________
  Registration Deadline: ________________
  Entry Fee (₹): ______
  Prize Pool (₹): ______
  Max Teams: ______
  Qualifier Spots (Top N): ______  ← auto-suggested based on game + team count
  Rules / Description: [rich text]
  Banner Image: [upload]

Step 3 — Prize Distribution
  1st: ₹___  2nd: ₹___  3rd: ₹___  (auto-splits or manual)

Step 4 — Payment Details
  UPI ID: ________________
  QR Code: [upload or generate]

→ [Create Tournament]
```

#### 8C. Payment Approval Queue

```
[Team Name] [Captain] [UTR#] [Screenshot] [Amount] [Actions]
Team Alpha   Rahul K   8234xxxx  [View 🔍]  ₹100    [✓ Approve] [✗ Reject]
```
- Screenshot opens in modal lightbox
- Bulk approve option
- Rejection sends auto-Telegram message with reason

#### 8D. Match Management

Per tournament → Per round → Per room:
```
Room A | Free Fire | Jun 15 @ 6PM
Teams: Alpha, Hydra, Wolf, Storm... (10 teams)
Room ID: [________] Password: [________] [💾 Save & Schedule Notif]

Results Entry:
[Team]     [Position ▼] [Kills] [Points Auto-calc]
Alpha           1         8       12+8 = 20
Hydra           3         5       8+5 = 13
...
[Submit Results] → triggers auto leaderboard update + qualification check
```

#### 8E. Broadcast Panel

Send custom Telegram messages to:
- All registered players (tournament)
- Specific room
- Qualified teams only
- All platform users

---

### 9. 🗄️ DATABASE SCHEMA (Supabase PostgreSQL)

```sql
-- GAMES ENGINE TABLE
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- 'free-fire', 'bgmi', 'valorant'
  icon_url TEXT,
  teams_per_match INTEGER NOT NULL,
  roster_size INTEGER NOT NULL,
  qualification_mode TEXT NOT NULL, -- 'points' | 'elimination' | 'hybrid'
  points_config JSONB NOT NULL,
  format_config JSONB NOT NULL, -- rounds structure for elimination
  is_active BOOLEAN DEFAULT true
);

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  telegram_id BIGINT UNIQUE,
  telegram_username TEXT,
  telegram_linked_at TIMESTAMPTZ,
  role TEXT DEFAULT 'player', -- 'player' | 'admin'
  preferred_game UUID REFERENCES games(id),
  preferred_theme TEXT DEFAULT 'cyber-dark',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAMS
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL, -- max 5 chars
  logo_url TEXT,
  captain_id UUID REFERENCES profiles(id),
  primary_game UUID REFERENCES games(id),
  invite_code TEXT UNIQUE DEFAULT generate_invite_code(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM MEMBERS
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  player_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member', -- 'captain' | 'member' | 'substitute'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- TOURNAMENTS
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  game_id UUID REFERENCES games(id),
  banner_url TEXT,
  status TEXT DEFAULT 'draft', -- 'draft'|'registration'|'ongoing'|'completed'|'cancelled'
  format TEXT, -- auto-set from game: 'points_based' | 'elimination'
  entry_fee INTEGER DEFAULT 0,
  prize_pool INTEGER DEFAULT 0,
  prize_distribution JSONB,
  max_teams INTEGER,
  qualifier_spots INTEGER, -- top N who qualify
  teams_per_room INTEGER, -- loaded from game config
  registration_deadline TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  rules TEXT,
  upi_id TEXT,
  upi_qr_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TOURNAMENT REGISTRATIONS
CREATE TABLE tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  team_id UUID REFERENCES teams(id),
  registered_by UUID REFERENCES profiles(id),
  payment_status TEXT DEFAULT 'pending', -- 'pending'|'submitted'|'approved'|'rejected'
  payment_screenshot_url TEXT,
  utr_number TEXT,
  payment_amount INTEGER,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, team_id)
);

-- MATCH ROOMS (auto-generated)
CREATE TABLE match_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  round_number INTEGER DEFAULT 1, -- 1=qualifier, 2=semis, etc.
  round_type TEXT, -- 'qualifier'|'semi_final'|'grand_final'
  room_label TEXT, -- 'Room A', 'Room B'
  room_id_code TEXT, -- actual in-game room ID (admin enters)
  room_password TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending'|'live'|'completed'
  notification_sent_15m BOOLEAN DEFAULT false,
  notification_sent_24h BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROOM TEAM ASSIGNMENTS (auto-generated)
CREATE TABLE room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES match_rooms(id),
  team_id UUID REFERENCES teams(id),
  seed_number INTEGER -- random seeding order
);

-- MATCH RESULTS
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES match_rooms(id),
  team_id UUID REFERENCES teams(id),
  position INTEGER NOT NULL,
  kills INTEGER DEFAULT 0,
  placement_points INTEGER DEFAULT 0,
  kill_points INTEGER DEFAULT 0,
  total_points INTEGER GENERATED ALWAYS AS (placement_points + kill_points) STORED,
  result_screenshot_url TEXT,
  entered_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, team_id)
);

-- TOURNAMENT STANDINGS (materialized/computed)
CREATE TABLE tournament_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  team_id UUID REFERENCES teams(id),
  total_matches INTEGER DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  current_rank INTEGER,
  qualification_status TEXT DEFAULT 'pending', -- 'pending'|'qualified'|'eliminated'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, team_id)
);

-- NOTIFICATIONS LOG
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_telegram_id BIGINT,
  team_id UUID REFERENCES teams(id),
  tournament_id UUID REFERENCES tournaments(id),
  notification_type TEXT, -- 'room_details'|'qualified'|'eliminated'|'reminder'|'result'
  message_text TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false
);
```

**Supabase RLS Policies:**
- Players: can read own profile, own team data, public tournament data
- Captains: can manage own team, submit registrations
- Admins: full access to all tables
- Match results: publicly readable after `room.status = 'completed'`

---

### 10. 📱 COMPLETE PAGE/ROUTE MAP

```
PUBLIC ROUTES
/                           → Landing page (tournaments list + hero)
/tournaments                → Browse all tournaments
/tournaments/[id]           → Tournament detail (tabs: overview/teams/groups/leaderboard/bracket)
/tournaments/[id]/leaderboard → Full leaderboard view

AUTH ROUTES
/login                      → Login page
/register                   → Registration + Telegram linking
/forgot-password            → Password reset

PLAYER ROUTES (authenticated)
/dashboard                  → Player home
/profile                    → Edit profile, theme, Telegram settings
/teams                      → My teams list
/teams/create               → Create new team
/teams/[id]                 → Team detail
/teams/[id]/manage          → Manage roster (captain only)
/my-tournaments             → My registrations + status
/my-results                 → Match history + stats

ADMIN ROUTES (/admin, role-gated)
/admin                      → Analytics dashboard
/admin/tournaments          → All tournaments list
/admin/tournaments/create   → Create tournament
/admin/tournaments/[id]     → Tournament control panel
/admin/tournaments/[id]/groups   → Room generation + assignments
/admin/tournaments/[id]/matches  → Match management + result entry
/admin/tournaments/[id]/results  → Review/publish results
/admin/payments             → Payment approval queue
/admin/broadcast            → Send Telegram notifications
/admin/games                → Game engine config (manage games table)
/admin/users                → User management
```

---

### 11. 🔄 KEY USER FLOWS (UX STORIES)

#### Flow A: Player Registration Journey
```
Land on /tournaments → Click tournament → "Register Now" → 
Login prompt (if not logged in) → Login/Register → 
Telegram linking onboarding → Select Team (or create one) → 
Payment QR shown → Upload screenshot → 
"Pending approval" state → Admin approves → 
Telegram: "You're in! 🎮" → Dashboard shows active tournament
```

#### Flow B: Admin Tournament Lifecycle
```
/admin/tournaments/create → Select Game (auto-configures) → 
Fill details → Publish → Players register → 
Payment queue → Approve teams → 
Registration deadline hits → Click "Generate Groups" → 
Rooms auto-created (A-F with random teams) → 
Enter Room ID + Password for each room → 
System schedules T-24h + T-15m notifications → 
Match time → Players receive room details on Telegram → 
Match ends → Admin enters results → 
Points auto-calculated → Leaderboard auto-updated → 
Qualification auto-determined → Qualified teams notified → 
"Generate Finals" → Grand Final auto-created → 
Repeat result entry → Winners announced → Tournament closed
```

#### Flow C: Live Match Day
```
T-24h: All players get Telegram reminder
T-15m: Room details pushed to qualified players only
Match live: Leaderboard shows "Match in Progress"
Admin opens result entry panel
Enters position + kills for each team
[Submit] clicked →
  → Points calculated via scoring engine
  → Standings table updated in realtime
  → All connected browsers update live (Supabase Realtime)
  → Qualification thresholds checked
  → Newly qualified teams get Telegram notification instantly
```

---

### 12. 🧩 COMPONENT ARCHITECTURE

```
src/
├── app/                         # Next.js 15 App Router
│   ├── (public)/
│   │   ├── page.tsx             # Landing
│   │   └── tournaments/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (player)/
│   │   ├── dashboard/
│   │   ├── teams/
│   │   └── profile/
│   └── admin/
│       ├── page.tsx             # Analytics
│       ├── tournaments/
│       └── payments/
│
├── components/
│   ├── ui/                      # Shadcn base components
│   ├── layout/
│   │   ├── Sidebar.tsx          # Admin/Player nav
│   │   ├── MobileNav.tsx        # Bottom tab bar
│   │   └── TopBar.tsx
│   ├── tournament/
│   │   ├── TournamentCard.tsx
│   │   ├── TournamentBracket.tsx  # Elimination bracket viz
│   │   ├── RoomCard.tsx
│   │   └── RegistrationFlow.tsx
│   ├── leaderboard/
│   │   ├── LeaderboardTable.tsx
│   │   └── LiveUpdatesHook.ts
│   ├── admin/
│   │   ├── ResultEntryForm.tsx
│   │   ├── PaymentQueue.tsx
│   │   └── RoomGenerator.tsx
│   └── theme/
│       ├── ThemeProvider.tsx
│       └── ThemeSwitcher.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── realtime.ts
│   ├── engines/
│   │   ├── roomGenerator.ts      # Auto room creation logic
│   │   ├── pointsEngine.ts       # Dynamic scoring
│   │   ├── qualificationEngine.ts
│   │   └── bracketEngine.ts
│   └── telegram/
│       ├── bot.ts               # Telegraf setup
│       └── notifications.ts
│
├── hooks/
│   ├── useRealtimeLeaderboard.ts
│   ├── useTelegramLink.ts
│   └── useTheme.ts
│
└── types/
    ├── database.types.ts         # Generated from Supabase
    └── game.types.ts
```

---

### 13. 📲 TELEGRAM BOT SPEC

**Bot commands:**
```
/start     → Welcome + link account
/status    → Check qualification status for active tournament
/room      → Get room details (if match time)
/results   → Latest match results
/standing  → Your team's current rank
/help      → Command list
```

**Deep link flow for account linking:**
```
User clicks "Connect Telegram" on web →
Redirects to t.me/CrewArenaBot?start=link_[user_uuid] →
Bot receives /start link_[uuid] →
Bot messages: "Tap to confirm linking your account" [Confirm Button] →
On confirm: updates profiles.telegram_id = chat.id →
Web page polls for link completion → Shows "Linked ✓"
```

---

### 14. 🚀 DEPLOYMENT ARCHITECTURE

```
Vercel (Frontend + API Routes)
├── Next.js app (SSR + Client)
├── API Routes: /api/admin/* /api/tournaments/* /api/payments/*
├── Cron Jobs (Vercel Cron):
│   ├── Every 5min: check upcoming matches → send T-15m notifications
│   └── Daily: send T-24h reminders

Supabase
├── PostgreSQL DB (all tables above)
├── Auth (user sessions)
├── Storage Buckets:
│   ├── avatars/ (player + team logos)
│   ├── payment-screenshots/ (private, admin-only read)
│   ├── banners/ (tournament banners, public)
│   └── result-screenshots/ (match proofs)
└── Realtime (match_results changes → leaderboard pushes)

Telegram Bot
├── Hosted on Vercel Edge Function OR Railway/Render
├── Webhook endpoint: /api/telegram/webhook
└── Scheduled notifications via Vercel Cron
```

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
NEXTAUTH_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

### 15. 🎯 MVP SCOPE BOUNDARIES

**IN SCOPE (V1):**
- ✅ All features in this document
- ✅ Games: Free Fire, BGMI, Valorant, CS2, CODM, PUBG PC
- ✅ Scoring formats: Points-based + Elimination bracket
- ✅ Payment: Manual UPI screenshot approval
- ✅ Notifications: Telegram only
- ✅ Multiple themes (5 themes)
- ✅ Fully responsive (mobile + desktop)

**OUT OF SCOPE (V2+):**
- ❌ Automated payment gateway (Razorpay/UPI API)
- ❌ Live streaming integration
- ❌ In-app chat/team communication
- ❌ Mobile apps (React Native)
- ❌ API for third-party organizers
- ❌ VOD/replay storage

---

## ⚡ IMPLEMENTATION PRIORITIES

Build in this order:

1. **Database + Auth** — Supabase schema, RLS, Supabase Auth
2. **Game Engine** — Seed games table with all 6 games + configs
3. **Core Layout + Theme System** — Sidebar, mobile nav, 5 themes
4. **Tournament CRUD** — Create/list/detail pages
5. **Registration Flow** — Team creation → join → payment upload
6. **Admin Payment Approval** — Queue + approve/reject
7. **Automation Engines** — Room gen, points calc, qualification
8. **Result Entry + Live Leaderboard** — Admin form + Realtime
9. **Telegram Bot** — Linking + notifications
10. **Polish** — Animations, responsive audit, theme QA

---

*Crew Arena — Where Champions Are Made Automatically* 🏆
