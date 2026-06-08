# 🏆 Crew Arena

Crew Arena is a premium, automated, game-driven esports tournament management and matchmaking platform. Designed for modern competitive gaming communities, it automates the entire tournament lifecycle—from registration, verification, bracket generation, and real-time standings calculations, to Telegram-based lobby dispatch and winner awards.

It is built with **Next.js 16 (Turbopack)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Recharts**, with a hybrid database layer powered by **Supabase PostgreSQL** and a robust client-side fallback cache.

---

## ⚡ Key Features

### 👤 1. Cyberpunk Player Dashboard
* **Dynamic Analytics:** Computes player stats (Matches Played, Average Kills, Win Rate, and Total Earnings) in real-time from match history.
* **Onboarding & Fighter Cards:** Interactive profile setup widget tracking Gamer UID, phone, city, and Telegram accounts.
* **Live Roster Renders:** Interactive list matching the user's active tournament status, displaying team countdowns to upcoming lobby matches.

### 👥 2. Dynamic Team & Invite Systems
* **Roster Builder:** Allows users to create squads, assign primary games, and auto-generate unique team tag identifiers (e.g., `SH-7284`).
* **Invite Codes:** Captures team tag invite requests to join team list rosters.
* **Captain Deck Console:** Captains receive real-time approval queues with options to **Approve** or **Reject** pending player applications.

### 🎮 3. Multi-Game Engine Configuration
* Fully seeded out-of-the-box support for popular competitive titles:
  * **Free Fire:** 10 teams per room, points-based qualifier, custom positioning scale.
  * **BGMI (Battlegrounds Mobile India):** 25 teams per room, points-based layout, standard Battle Royale point config.
  * **Valorant:** 2 teams per room, bracket-based qualification.

### 🛡️ 4. Payment Verification (UPI & Screenshots)
* **Real-time Registration Workflow:** Generates entry checkpoints. For paid tournaments, captures mock UPI transactions with UTR receipt references and screenshot upload mockups.
* **Admin Verification:** Safe admin approval board to authorize pending tournament registrations and payment records.

### 🤖 5. Automated Lobby Rooms & Telegram Dispatch
* **Fisher-Yates Draw Engine:** Divides registered and approved teams into separate match rooms (Lobbies) dynamically.
* **Lobby Credentials Broadcaster:** Admins enter in-game Room IDs and passwords. The system immediately simulates Telegram push messages to all team captains in that lobby.
* **Telegram OTP Simulator:** Integrates a sandbox Telegram interface in the panel to test account linking using OTP verification codes (e.g., `/start VERIFY123`).

### 📊 6. Interactive Admin Spreadsheet & Standings
* **Real-time Results Spreadsheet:** In-browser Excel-style spreadsheet interface for inputting placements and kills per team.
* **Auto-Scoring Engine:** Automatically calculates total placement and kill points on saving, instantly publishing lobby results.
* **Qualifier Advancement System:** Computes leaderboard standings, identifies top-scoring teams, and automatically creates final match brackets.

### 🏆 7. Winners Podium Widget
* Interactive widget inside the Admin Cockpit to select the **Champion**, **Runner Up**, and tournament **MVP**.
* Locks tournament statuses, marks matches completed, and renders trophy winners in a premium podium highlight screen on leaderboards.

### 🎨 8. Premium Theme Engine
* Interactive theme drawer toggle in the footer supporting **5 theme presets**:
  * **Midnight Cyberpunk (Default):** High-contrast neon purple and aqua accents.
  * **Emerald Matrix:** Cyber green terminal theme.
  * **Crimson Rage:** Deep red gaming layout.
  * **Golden Royal:** Harmonious luxury esports gold accents.
  * **Sleek Light:** Clean light-mode developer style.

---

## 📁 Project Directory Layout

```
├── .next/                  # Built Next.js output
├── public/                 # Static SVG icons and image files
├── src/
│   ├── app/                # Next.js App Router Pages
│   │   ├── admin/          # Admin Cockpit (Payments, Matches, Results, Podium)
│   │   ├── dashboard/      # Player Dashboard (Stats, Profile Onboarding)
│   │   ├── leaderboard/    # Standings & Public Rankings Directory
│   │   ├── login/          # User Authentication Portal (Sign In)
│   │   ├── register/       # Registration Portal (Sign Up / Onboarding)
│   │   ├── team/           # Team Roster Deck & Captain Roster approval queues
│   │   ├── tournament/[id] # Tournament details (Tabs: Teams, Groups, Standings, Bracket)
│   │   ├── globals.css     # Tailwinds design system + Cyberpunk themes
│   │   └── layout.tsx      # Entry HTML wrappers & Context providers
│   ├── components/         # Reusable Components
│   │   ├── layout/         # Shell, Sidebar, Header (TopBar), Telegram Simulator
│   │   ├── theme/          # Custom Theme Context Providers & Theme Switcher
│   │   └── tournament/     # Payment entry & Roster attachment modal flows
│   ├── lib/                # Platform Helper Libraries
│   │   ├── engines/        # Auto-matchmaking, Scoring, & Advancement systems
│   │   ├── supabase/       # Live Supabase client hook initializer
│   │   └── db.ts           # Hybrid Database Client (Supabase sync & LocalStorage fallback)
│   └── types/              # Database schema typings & models
├── schema.sql              # Supabase database initialization SQL schema
├── .env.example            # Sample Environment Configurations
└── package.json            # Scripts & Dependency dependencies
```

---

## 🛠️ Installation & Setup

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher
* **Supabase Project:** (Optional, falls back to local storage browser database if not configured)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/arpit0381/CrewArena.git
cd CrewArena
npm install
```

### 2. Environment Configuration
Duplicate `.env.example` as `.env.local` in the project root:
```bash
cp .env.example .env.local
```
Provide your Supabase URL, API keys, and Telegram credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_USERNAME=your-bot-username
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
> **Self-Healing Local Mode:** If `NEXT_PUBLIC_SUPABASE_URL` is left blank, Crew Arena will automatically run in high-fidelity mock mode using browser LocalStorage, allowing you to try the full application offline.

### 3. Setup Supabase Database Schema
If connecting to a live Supabase instance:
1. Open the [Supabase Dashboard](https://supabase.com/).
2. Select your project and navigate to the **SQL Editor** tab.
3. Open `schema.sql` from the project root, copy the contents, paste them into the SQL Editor, and click **Run**.
4. (Optional) In the Supabase Auth Settings, disable **"Confirm Email"** if you want users to register and sign in instantly without needing email verification.

### 4. Run Locally
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Recommended Walkthrough Demo Flow
To experience the entire automated tournament workflow in under 5 minutes:

1. **Create Account:** Go to `/register` and create a player profile.
2. **Setup Roster:** Navigate to the `/team` page, create a team named "Alpha Squad" for BGMI, and copy your auto-generated team tag (e.g., `AL-8172`).
3. **Register for Tournament:** Open the *Tournaments* grid on the dashboard, select the active tournament, click **Register Team**, enter a mock UPI UTR reference code, and submit.
4. **Command as Admin:** Toggle your role in the top header bar to **Admin Deck**.
   * Under the **Payments** tab, locate your team registration and click **Approve**.
   * Under **Match Management**, select your tournament and click **Generate Groups** to draw groups.
   * View the room lobby list, select the lobby, input room credentials (e.g., Room ID: `12345`, Pass: `54321`), and save. Notice the simulated Telegram notification pop up!
   * Under **Results Spreadsheet**, enter mock kills and placements for teams in the lobby, then click **Publish Match Results**.
   * Under **Winners Podium**, select the champion, runner up, and MVP players, then click **Declare Winners & Close League**.
5. **Celebrate Standings:** Switch back to Player mode, navigate to `/leaderboard` or your tournament detail view, and see the official championship podium highlighted!

---

## 📄 License
This project is licensed under the MIT License.