-- MasteX Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
create table if not exists students (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  school_name text not null,
  year_group smallint not null check (year_group in (1, 2, 3)),
  referral_code text not null unique,
  referred_by text,
  subscription_status text not null default 'inactive' check (subscription_status in ('active', 'inactive', 'paused')),
  subscription_expires_at timestamptz,
  discount_pct numeric(5,2) not null default 0,
  active_referral_count integer not null default 0,
  -- Subject XP
  xp_maths integer not null default 0,
  xp_english integer not null default 0,
  xp_science integer not null default 0,
  xp_social integer not null default 0,
  -- Aggregate XP
  xp_year integer not null default 0,
  xp_overall integer not null default 0,
  -- Ranks
  rank_maths text not null default 'F3',
  rank_english text not null default 'F3',
  rank_science text not null default 'F3',
  rank_social text not null default 'F3',
  rank_year text not null default 'F3',
  rank_overall text not null default 'F3',
  -- Positions
  rank_year_position integer not null default 9999,
  rank_overall_position integer not null default 9999,
  -- Streak
  study_streak_days integer not null default 0,
  last_study_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SUBJECTS TABLE (seeded)
-- ============================================================
create table if not exists subjects (
  id text primary key,
  name text not null,
  code text not null unique,
  color text not null,
  icon text not null,
  description text not null
);

insert into subjects (id, name, code, color, icon, description) values
  ('maths', 'Core Mathematics', 'maths', '#F59E0B', '📐', 'Numbers, algebra, geometry, and statistics'),
  ('english', 'English Language', 'english', '#A78BFA', '📝', 'Reading, writing, comprehension, and grammar'),
  ('science', 'Integrated Science', 'science', '#34D399', '🔬', 'Physics, chemistry, biology, and earth science'),
  ('social', 'Social Studies', 'social', '#60A5FA', '🌍', 'History, geography, civics, and economics')
on conflict (id) do nothing;

-- ============================================================
-- TOPICS TABLE
-- ============================================================
create table if not exists topics (
  id uuid primary key default uuid_generate_v4(),
  subject_id text not null references subjects(id),
  name text not null,
  waec_code text,
  year_group smallint not null check (year_group in (1, 2, 3)),
  order_index integer not null default 0,
  prerequisite_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- TOPIC PROGRESS TABLE
-- ============================================================
create table if not exists topic_progress (
  student_id uuid not null references students(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  mastery_state text not null default 'unseen' check (
    mastery_state in ('unseen', 'introduced', 'practicing', 'consolidating', 'mastered', 'locked_in')
  ),
  frames_completed text[] not null default '{}',
  spaced_sessions_passed integer not null default 0,
  next_review_date date,
  xp_earned integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_id, topic_id)
);

-- ============================================================
-- QUESTIONS TABLE
-- ============================================================
create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references topics(id) on delete cascade,
  subject_id text not null references subjects(id),
  frame text not null check (
    frame in ('definition', 'fill_blank', 'application', 'data_interpretation', 'comparison', 'evaluation')
  ),
  cognitive_level smallint not null check (cognitive_level in (1, 2, 3)),
  type text not null check (type in ('mcq', 'fill_blank')),
  prompt text not null,
  options jsonb,
  correct_answer text not null,
  mark_scheme text not null,
  explanation text not null,
  xp_reward integer not null default 5,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  generated_by_ai boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- QUESTION ATTEMPTS TABLE
-- ============================================================
create table if not exists question_attempts (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer text not null,
  is_correct boolean not null,
  xp_awarded integer not null default 0,
  used_hint boolean not null default false,
  attempted_at timestamptz not null default now()
);

-- ============================================================
-- WEEKLY QUESTS TABLE
-- ============================================================
create table if not exists weekly_quests (
  id uuid primary key default uuid_generate_v4(),
  subject_id text not null references subjects(id),
  year_group smallint not null check (year_group in (1, 2, 3)),
  week_start date not null,
  week_end date not null,
  title text not null,
  topic_id uuid references topics(id),
  part_a jsonb not null,
  part_b jsonb not null,
  part_c jsonb not null,
  created_at timestamptz not null default now(),
  unique (subject_id, year_group, week_start)
);

-- ============================================================
-- QUEST SUBMISSIONS TABLE
-- ============================================================
create table if not exists quest_submissions (
  id uuid primary key default uuid_generate_v4(),
  quest_id uuid not null references weekly_quests(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  answer_a text not null default '',
  answer_b text not null default '',
  answer_c text not null default '',
  grade_a jsonb,
  grade_b jsonb,
  grade_c jsonb,
  overall_score numeric(5,2),
  total_xp integer not null default 0,
  submitted_at timestamptz not null default now(),
  graded_at timestamptz,
  unique (quest_id, student_id)
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  amount numeric(10,2) not null default 40.00,
  discount_pct numeric(5,2) not null default 0,
  amount_paid numeric(10,2) not null,
  method text not null default 'momo' check (method in ('momo', 'bank', 'paystack')),
  reference text not null,
  month text not null, -- e.g. "2024-04"
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  confirmed_at timestamptz,
  confirmed_by text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RANK SNAPSHOTS TABLE
-- ============================================================
create table if not exists rank_snapshots (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  snapshot_date date not null default current_date,
  rank_overall text not null,
  rank_year text not null,
  xp_overall integer not null,
  xp_year integer not null,
  created_at timestamptz not null default now(),
  unique (student_id, snapshot_date)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Students table
alter table students enable row level security;

create policy "Students can read own data"
  on students for select
  using (auth.uid() = id);

create policy "Students can update own data"
  on students for update
  using (auth.uid() = id);

create policy "Leaderboard readable by all authenticated users"
  on students for select
  using (auth.role() = 'authenticated');

-- Topics: readable by all authenticated users
alter table topics enable row level security;
create policy "Topics readable by authenticated"
  on topics for select
  using (auth.role() = 'authenticated');

-- Topic progress
alter table topic_progress enable row level security;

create policy "Students can read own progress"
  on topic_progress for select
  using (auth.uid() = student_id);

create policy "Students can upsert own progress"
  on topic_progress for all
  using (auth.uid() = student_id);

-- Questions: readable by all authenticated users
alter table questions enable row level security;
create policy "Questions readable by authenticated"
  on questions for select
  using (auth.role() = 'authenticated');

-- Question attempts
alter table question_attempts enable row level security;

create policy "Students can read own attempts"
  on question_attempts for select
  using (auth.uid() = student_id);

create policy "Students can insert own attempts"
  on question_attempts for insert
  with check (auth.uid() = student_id);

-- Weekly quests: readable by all authenticated
alter table weekly_quests enable row level security;
create policy "Quests readable by authenticated"
  on weekly_quests for select
  using (auth.role() = 'authenticated');

-- Quest submissions
alter table quest_submissions enable row level security;

create policy "Students can read own submissions"
  on quest_submissions for select
  using (auth.uid() = student_id);

create policy "Students can insert own submissions"
  on quest_submissions for insert
  with check (auth.uid() = student_id);

create policy "Students can update own submissions"
  on quest_submissions for update
  using (auth.uid() = student_id);

-- Payments
alter table payments enable row level security;

create policy "Students can read own payments"
  on payments for select
  using (auth.uid() = student_id);

create policy "Students can insert own payments"
  on payments for insert
  with check (auth.uid() = student_id);

-- Rank snapshots
alter table rank_snapshots enable row level security;

create policy "Students can read own snapshots"
  on rank_snapshots for select
  using (auth.uid() = student_id);

-- ============================================================
-- SAMPLE TOPICS (Year 1 — Core Mathematics)
-- ============================================================
insert into topics (subject_id, name, waec_code, year_group, order_index) values
  ('maths', 'Number and Numeration', 'CM-1-01', 1, 1),
  ('maths', 'Fractions, Decimals and Percentages', 'CM-1-02', 1, 2),
  ('maths', 'Indices and Logarithms', 'CM-1-03', 1, 3),
  ('maths', 'Algebraic Expressions', 'CM-1-04', 1, 4),
  ('maths', 'Linear Equations', 'CM-1-05', 1, 5),
  ('maths', 'Sets', 'CM-1-06', 1, 6),
  ('maths', 'Statistics: Data Collection', 'CM-1-07', 1, 7),
  ('maths', 'Geometry: Lines and Angles', 'CM-1-08', 1, 8),
  ('english', 'Comprehension Skills', 'EL-1-01', 1, 1),
  ('english', 'Summary Writing', 'EL-1-02', 1, 2),
  ('english', 'Vocabulary and Grammar', 'EL-1-03', 1, 3),
  ('english', 'Essay Writing', 'EL-1-04', 1, 4),
  ('english', 'Literature: Prose', 'EL-1-05', 1, 5),
  ('science', 'Diversity of Matter', 'IS-1-01', 1, 1),
  ('science', 'Cells and Tissues', 'IS-1-02', 1, 2),
  ('science', 'Forces and Motion', 'IS-1-03', 1, 3),
  ('science', 'Energy Types and Sources', 'IS-1-04', 1, 4),
  ('science', 'The Periodic Table', 'IS-1-05', 1, 5),
  ('social', 'History of Ghana', 'SS-1-01', 1, 1),
  ('social', 'Geography of Ghana', 'SS-1-02', 1, 2),
  ('social', 'Government and Citizenship', 'SS-1-03', 1, 3),
  ('social', 'Economic Concepts', 'SS-1-04', 1, 4),
  ('social', 'Social Issues in Ghana', 'SS-1-05', 1, 5)
on conflict do nothing;

-- ============================================================
-- HELPER FUNCTION: Update student XP aggregates
-- ============================================================
create or replace function update_student_xp_totals(p_student_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update students
  set
    xp_year = xp_maths + xp_english + xp_science + xp_social,
    xp_overall = xp_maths + xp_english + xp_science + xp_social,
    updated_at = now()
  where id = p_student_id;
end;
$$;
