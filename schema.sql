-- ==========================================
-- CREW ARENA DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ==========================================

-- 1. GAMES ENGINE TABLE
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- 'free-fire', 'bgmi', 'valorant'
  teams_per_room INTEGER NOT NULL,
  finalists INTEGER NOT NULL,
  qualification TEXT NOT NULL CHECK (qualification IN ('points', 'bracket')),
  points_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS (Profiles - Extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  game_uid TEXT,
  telegram_username TEXT,
  telegram_id BIGINT UNIQUE,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Allow users to insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- 3. TEAMS
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL UNIQUE, -- SH-7284 format
  logo_url TEXT,
  captain_id UUID REFERENCES users(id) ON DELETE CASCADE,
  primary_game UUID REFERENCES games(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEAM MEMBERS (Includes join request queue status)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  role TEXT DEFAULT 'member' CHECK (role IN ('captain', 'member', 'substitute')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- 5. TOURNAMENTS
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  entry_fee INTEGER DEFAULT 0,
  prize_pool INTEGER DEFAULT 0,
  max_teams INTEGER DEFAULT 32,
  qualifier_spots INTEGER DEFAULT 12,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'registration', 'ongoing', 'completed')),
  rules TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  champion_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  runner_up_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  mvp_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TOURNAMENT REGISTRATIONS
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, team_id)
);

-- 7. PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  utr_number TEXT UNIQUE NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MATCHES (Lobby Rooms)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER DEFAULT 1,
  round_type TEXT DEFAULT 'qualifier' CHECK (round_type IN ('qualifier', 'semi_final', 'grand_final')),
  room_label TEXT NOT NULL, -- Group A, Group B, Grand Final
  room_id_code TEXT, -- actual in-game room ID (admin enters)
  room_password TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.5 MATCH ROOM ASSIGNMENTS
CREATE TABLE room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  seed_number INTEGER,
  UNIQUE(room_id, team_id)
);

-- 9. RESULTS
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  kills INTEGER DEFAULT 0,
  placement_points INTEGER DEFAULT 0,
  kill_points INTEGER DEFAULT 0,
  total_points INTEGER GENERATED ALWAYS AS (placement_points + kill_points) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, team_id)
);

-- 10. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

-- ==========================================
-- SEED INITIAL DATA (GAMES)
-- ==========================================
INSERT INTO games (id, name, slug, teams_per_room, finalists, qualification, points_config)
VALUES 
  ('bf81850d-d421-4ea9-a111-ce1515bb5c81', 'Free Fire', 'free-fire', 10, 12, 'points', '{"1":12, "2":9, "3":8, "4":7, "5":6, "6":5, "7":4, "8":3, "9":2, "10":1, "kill":1}'),
  ('e12bd84d-2df9-4c12-841f-1ad078d10b72', 'BGMI', 'bgmi', 25, 16, 'points', '{"1":15, "2":12, "3":10, "4":8, "5":6, "6":4, "7":2, "8":1, "kill":1}'),
  ('c26be6fd-1d88-43e5-8b83-a9d02f5a5423', 'Valorant', 'valorant', 2, 2, 'bracket', '{"1":1, "2":0, "kill":0}');

-- ==========================================
-- RLS DISABLE FOR MVP / DEVELOPMENT TABLES
-- ==========================================
-- Supabase enables RLS by default. To allow the frontend application to perform inserts
-- and updates directly, execute these queries in your Supabase SQL Editor:
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

