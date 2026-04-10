-- MasteX Database Schema v2.0
-- Supports: personalised learning, sub-topic mastery,
-- spaced repetition, onboarding profiles, daily goals,
-- support mode detection, AI-generated explanations

-- ══════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ══════════════════════════════════════════════════════════════
-- CLEAN SLATE: drop all existing objects before recreating
-- ══════════════════════════════════════════════════════════════

-- Views
drop view if exists student_leaderboard cascade;

-- Functions (cascade drops dependent triggers)
drop function if exists fn_update_updated_at() cascade;
drop function if exists fn_sync_student_xp() cascade;

-- Tables — children first, then parents, all with cascade
drop table if exists referrals            cascade;
drop table if exists rank_snapshots       cascade;
drop table if exists payments             cascade;
drop table if exists quest_submissions    cascade;
drop table if exists weekly_quests        cascade;
drop table if exists daily_goals          cascade;
drop table if exists question_attempts    cascade;
drop table if exists sub_topic_progress   cascade;
drop table if exists study_sessions       cascade;
drop table if exists explanations         cascade;
drop table if exists questions            cascade;
drop table if exists sub_topics           cascade;
drop table if exists topics               cascade;
drop table if exists onboarding_profiles  cascade;
drop table if exists subjects             cascade;
drop table if exists students             cascade;


-- ══════════════════════════════════════════════════════════════
-- TABLE: students
-- ══════════════════════════════════════════════════════════════

create table students (
  id                      uuid        primary key references auth.users(id) on delete cascade,
  full_name               text        not null,
  email                   text        not null unique,
  school_name             text        not null,
  year_group              integer     not null check (year_group in (1, 2, 3)),
  referral_code           text        not null unique,
  referred_by             text,

  -- Subscription
  subscription_status     text        not null default 'inactive'
                            check (subscription_status in ('active', 'inactive', 'paused')),
  subscription_expires_at timestamptz,
  discount_pct            integer     not null default 0 check (discount_pct between 0 and 50),
  active_referral_count   integer     not null default 0,

  -- Subject XP (denormalised for fast leaderboard sorting)
  xp_core_math            integer     not null default 0,
  xp_english              integer     not null default 0,
  xp_integrated_science   integer     not null default 0,
  xp_social_studies       integer     not null default 0,
  xp_year                 integer     not null default 0,  -- sum of all 4 subject XPs
  xp_overall              integer     not null default 0,  -- cumulative all-time

  -- Rank display strings e.g. "B2", "S"
  rank_core_math          text        not null default 'F3',
  rank_english            text        not null default 'F3',
  rank_integrated_science text        not null default 'F3',
  rank_social_studies     text        not null default 'F3',
  rank_year               text        not null default 'F3',
  rank_overall            text        not null default 'F3',

  -- Rank positions (ordinal within tier)
  rank_position_year      integer,
  rank_position_overall   integer,

  -- Streaks
  study_streak_days       integer     not null default 0,
  longest_streak          integer     not null default 0,
  last_study_date         date,

  -- Daily goal
  daily_goal_xp           integer     not null default 50,
  daily_xp_today          integer     not null default 0,
  daily_goal_last_reset   date,

  -- Learning profile
  learning_pace           text        not null default 'medium'
                            check (learning_pace in ('slow', 'medium', 'fast')),
  onboarding_completed    boolean     not null default false,
  focus_subject           text,       -- subject_id of weakest subject

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: onboarding_profiles
-- ══════════════════════════════════════════════════════════════

create table onboarding_profiles (
  id                              uuid        primary key default uuid_generate_v4(),
  student_id                      uuid        not null unique references students(id) on delete cascade,

  -- Self-reported confidence (1=struggle, 2=some parts, 3=comfortable, 4=strong)
  confidence_core_math            integer     check (confidence_core_math between 1 and 4),
  confidence_english              integer     check (confidence_english between 1 and 4),
  confidence_integrated_science   integer     check (confidence_integrated_science between 1 and 4),
  confidence_social_studies       integer     check (confidence_social_studies between 1 and 4),

  -- Diagnostic scores (actual measured ability 0–100 per subject)
  diagnostic_core_math            integer     check (diagnostic_core_math between 0 and 100),
  diagnostic_english              integer     check (diagnostic_english between 0 and 100),
  diagnostic_integrated_science   integer     check (diagnostic_integrated_science between 0 and 100),
  diagnostic_social_studies       integer     check (diagnostic_social_studies between 0 and 100),

  -- Learning preferences
  prefers_examples_first          boolean     not null default true,
  focus_duration_minutes          integer     not null default 20
                                    check (focus_duration_minutes in (10, 20, 30)),
  preferred_study_time            text
                                    check (preferred_study_time in ('morning', 'afternoon', 'evening')),

  -- Goals
  main_goal                       text
                                    check (main_goal in ('pass_waec', 'excellent_grades', 'improve_specific')),
  study_days_per_week             integer     not null default 5
                                    check (study_days_per_week between 1 and 7),
  daily_goal_level                text        not null default 'standard'
                                    check (daily_goal_level in ('light', 'standard', 'intense')),

  -- Subject flags
  weak_subjects                   text[]      not null default '{}',
  strong_subjects                 text[]      not null default '{}',

  completed_at                    timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: subjects
-- Seeded once, never changes.
-- ══════════════════════════════════════════════════════════════

create table subjects (
  id          text    primary key,
  name        text    not null,
  short_name  text    not null,
  icon        text    not null,
  color       text    not null,
  order_index integer not null
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: topics
-- Top-level topic within a subject.
-- ══════════════════════════════════════════════════════════════

create table topics (
  id               uuid        primary key default uuid_generate_v4(),
  subject_id       text        not null references subjects(id),
  name             text        not null,
  description      text,
  waec_code        text,
  year_group       integer     not null check (year_group in (1, 2, 3)),
  order_index      integer     not null default 0,
  prerequisite_ids uuid[]      not null default '{}',
  created_at       timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: sub_topics
-- Specific concept within a topic. Core unit of learning.
-- ══════════════════════════════════════════════════════════════

create table sub_topics (
  id               uuid        primary key default uuid_generate_v4(),
  topic_id         uuid        not null references topics(id) on delete cascade,
  subject_id       text        not null references subjects(id),
  name             text        not null,
  description      text,
  waec_code        text,
  order_index      integer     not null default 0,
  difficulty_level integer     not null default 1 check (difficulty_level in (1, 2, 3)),
  prerequisite_ids uuid[]      not null default '{}',
  estimated_minutes integer    not null default 20,
  created_at       timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: explanations
-- AI-generated explanations stored per sub-topic per level.
-- ══════════════════════════════════════════════════════════════

create table explanations (
  id              uuid        primary key default uuid_generate_v4(),
  sub_topic_id    uuid        not null references sub_topics(id) on delete cascade,
  student_level   text        not null check (student_level in ('beginner', 'intermediate', 'advanced')),

  content         text        not null,  -- full explanation text
  worked_example  text        not null,  -- fully solved WAEC-style example
  guided_practice text        not null,  -- practice problem with hints
  guided_hints    jsonb       not null default '[]',  -- array of hint strings

  generated_at    timestamptz not null default now(),
  model_used      text        not null default 'claude-sonnet-4-20250514',

  unique (sub_topic_id, student_level)
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: questions
-- ══════════════════════════════════════════════════════════════

create table questions (
  id              uuid        primary key default uuid_generate_v4(),
  sub_topic_id    uuid        not null references sub_topics(id) on delete cascade,
  topic_id        uuid        not null references topics(id),
  subject_id      text        not null references subjects(id),

  frame           text        not null
                    check (frame in (
                      'definition', 'fill_blank', 'application',
                      'data_interpretation', 'comparison', 'evaluation'
                    )),
  cognitive_level integer     not null check (cognitive_level in (1, 2, 3)),
  type            text        not null check (type in ('mcq', 'fill_blank', 'short_answer', 'theory')),
  difficulty      text        not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),

  prompt          text        not null,
  options         jsonb,                  -- MCQ options array; null for non-MCQ
  correct_answer  text,                  -- null for open-ended / theory
  mark_scheme     text        not null,
  explanation     text        not null,  -- shown when student gets it wrong
  waec_standard   boolean     not null default true,
  xp_reward       integer     not null default 5,

  generated_by_ai boolean     not null default true,
  times_attempted integer     not null default 0,
  times_correct   integer     not null default 0,

  created_at      timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: study_sessions
-- One row per complete (or abandoned) study session.
-- ══════════════════════════════════════════════════════════════

create table study_sessions (
  id                    uuid        primary key default uuid_generate_v4(),
  student_id            uuid        not null references students(id) on delete cascade,
  sub_topic_id          uuid        not null references sub_topics(id),
  topic_id              uuid        not null references topics(id),
  subject_id            text        not null references subjects(id),

  session_number        integer     not null default 1,  -- nth time studying this sub-topic
  phase_reached         text        not null default 'explanation'
                          check (phase_reached in (
                            'explanation', 'worked_example',
                            'guided_practice', 'questions', 'review'
                          )),
  completed             boolean     not null default false,

  -- Performance metrics
  questions_attempted   integer     not null default 0,
  questions_correct     integer     not null default 0,
  accuracy_pct          integer     not null default 0,
  xp_earned             integer     not null default 0,
  time_spent_seconds    integer     not null default 0,

  -- Support mode
  support_mode_triggered boolean    not null default false,
  hints_used            integer     not null default 0,

  -- Spaced repetition (set on completion)
  next_review_date      date,

  started_at            timestamptz not null default now(),
  completed_at          timestamptz
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: sub_topic_progress
-- One row per student per sub-topic. The heart of the system.
-- ══════════════════════════════════════════════════════════════

create table sub_topic_progress (
  id                    uuid        primary key default uuid_generate_v4(),
  student_id            uuid        not null references students(id) on delete cascade,
  sub_topic_id          uuid        not null references sub_topics(id) on delete cascade,
  topic_id              uuid        not null references topics(id),
  subject_id            text        not null references subjects(id),

  mastery_state         text        not null default 'unseen'
                          check (mastery_state in (
                            'unseen', 'introduced', 'practicing',
                            'consolidating', 'mastered', 'locked_in'
                          )),
  frames_completed      text[]      not null default '{}',
  sessions_completed    integer     not null default 0,
  sessions_passed       integer     not null default 0,  -- sessions with accuracy >= 70%
  consecutive_correct   integer     not null default 0,
  consecutive_wrong     integer     not null default 0,

  -- Support mode detection
  support_mode_active   boolean     not null default false,
  attempts_at_level_1   integer     not null default 0,

  -- Spaced repetition
  spaced_interval_index integer     not null default 0,  -- 0→1day, 1→3days, 2→7days, 3→21days
  next_review_date      date,
  last_reviewed_date    date,

  xp_earned_total       integer     not null default 0,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (student_id, sub_topic_id)
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: question_attempts
-- Every single question a student has ever attempted.
-- ══════════════════════════════════════════════════════════════

create table question_attempts (
  id              uuid        primary key default uuid_generate_v4(),
  student_id      uuid        not null references students(id) on delete cascade,
  question_id     uuid        not null references questions(id) on delete cascade,
  session_id      uuid        not null references study_sessions(id) on delete cascade,
  sub_topic_id    uuid        not null references sub_topics(id),

  answer          text        not null,
  is_correct      boolean     not null,
  xp_awarded      integer     not null default 0,
  used_hint       boolean     not null default false,
  time_seconds    integer,
  attempt_number  integer     not null default 1,

  attempted_at    timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: daily_goals
-- Tracks daily goal progress per student per calendar day.
-- ══════════════════════════════════════════════════════════════

create table daily_goals (
  id                  uuid    primary key default uuid_generate_v4(),
  student_id          uuid    not null references students(id) on delete cascade,
  date                date    not null,
  goal_xp             integer not null,
  earned_xp           integer not null default 0,
  goal_met            boolean not null default false,
  sessions_completed  integer not null default 0,
  study_minutes       integer not null default 0,
  created_at          timestamptz not null default now(),

  unique (student_id, date)
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: weekly_quests
-- One quest per subject per year group per week.
-- ══════════════════════════════════════════════════════════════

create table weekly_quests (
  id           uuid    primary key default uuid_generate_v4(),
  subject_id   text    not null references subjects(id),
  year_group   integer not null check (year_group in (1, 2, 3)),
  week_start   date    not null,
  week_end     date    not null,
  title        text    not null,
  topic_id     uuid    references topics(id),
  sub_topic_id uuid    references sub_topics(id),
  part_a_id    uuid    references questions(id),  -- Level 1 — Knowledge recall
  part_b_id    uuid    references questions(id),  -- Level 2 — Application
  part_c_id    uuid    references questions(id),  -- Level 3 — Critical thinking
  created_at   timestamptz not null default now(),

  unique (subject_id, year_group, week_start)
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: quest_submissions
-- ══════════════════════════════════════════════════════════════

create table quest_submissions (
  id            uuid    primary key default uuid_generate_v4(),
  quest_id      uuid    not null references weekly_quests(id) on delete cascade,
  student_id    uuid    not null references students(id) on delete cascade,

  answer_a      text    not null default '',
  answer_b      text    not null default '',
  answer_c      text    not null default '',

  -- JSONB grading results from Claude
  -- { score, grade, xp_awarded, relevance, accuracy, depth, clarity, feedback }
  grade_a       jsonb,
  grade_b       jsonb,
  grade_c       jsonb,

  overall_score text    check (overall_score in ('needs_work', 'good', 'excellent', 'outstanding')),
  total_xp      integer not null default 0,

  submitted_at  timestamptz not null default now(),
  graded_at     timestamptz,

  unique (quest_id, student_id)
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: payments
-- Manual MoMo/bank and future Paystack records.
-- ══════════════════════════════════════════════════════════════

create table payments (
  id           uuid    primary key default uuid_generate_v4(),
  student_id   uuid    not null references students(id) on delete cascade,
  amount       integer not null,       -- GHC, no decimals (e.g. 40)
  discount_pct integer not null default 0,
  amount_paid  integer not null,       -- after discount
  method       text    not null check (method in ('momo', 'bank', 'paystack')),
  reference    text,
  month        text    not null,       -- "YYYY-MM" e.g. "2024-04"
  status       text    not null default 'pending'
                 check (status in ('pending', 'confirmed', 'failed')),
  confirmed_at timestamptz,
  confirmed_by uuid,                   -- admin's auth.users id
  paystack_ref text,
  notes        text,
  created_at   timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: rank_snapshots
-- Daily snapshot for rank history and progress graphs.
-- ══════════════════════════════════════════════════════════════

create table rank_snapshots (
  id               uuid    primary key default uuid_generate_v4(),
  student_id       uuid    not null references students(id) on delete cascade,
  snapshot_date    date    not null,
  rank_overall     text,
  rank_year        text,
  rank_core_math   text,
  rank_english     text,
  rank_science     text,
  rank_social      text,
  xp_overall       integer,
  xp_year          integer,
  position_overall integer,
  position_year    integer,
  created_at       timestamptz not null default now(),

  unique (student_id, snapshot_date)
);


-- ══════════════════════════════════════════════════════════════
-- TABLE: referrals
-- Individual referral relationships between students.
-- ══════════════════════════════════════════════════════════════

create table referrals (
  id                  uuid    primary key default uuid_generate_v4(),
  referrer_id         uuid    not null references students(id) on delete cascade,
  referred_student_id uuid    not null references students(id) on delete cascade,
  referral_code_used  text    not null,
  status              text    not null default 'pending'
                        check (status in ('pending', 'active', 'lapsed')),
  activated_at        timestamptz,
  lapsed_at           timestamptz,
  created_at          timestamptz not null default now(),

  unique (referred_student_id)  -- each student can only be referred once
);


-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

alter table students            enable row level security;
alter table onboarding_profiles enable row level security;
alter table subjects            enable row level security;
alter table topics              enable row level security;
alter table sub_topics          enable row level security;
alter table explanations        enable row level security;
alter table questions           enable row level security;
alter table study_sessions      enable row level security;
alter table sub_topic_progress  enable row level security;
alter table question_attempts   enable row level security;
alter table daily_goals         enable row level security;
alter table weekly_quests       enable row level security;
alter table quest_submissions   enable row level security;
alter table payments            enable row level security;
alter table rank_snapshots      enable row level security;
alter table referrals           enable row level security;


-- ── students ──────────────────────────────────────────────────
-- Own row: full read/write access
create policy "students_insert_own"
  on students for insert
  with check (auth.uid() = id);

create policy "students_select_own"
  on students for select
  using (auth.uid() = id);

create policy "students_update_own"
  on students for update
  using (auth.uid() = id);

-- Leaderboard: all authenticated users can see all rows
-- (column restriction enforced via student_leaderboard view)
create policy "students_select_leaderboard"
  on students for select
  using (auth.role() = 'authenticated');

-- ── onboarding_profiles ───────────────────────────────────────
create policy "onboarding_select_own"
  on onboarding_profiles for select
  using (auth.uid() = student_id);

create policy "onboarding_insert_own"
  on onboarding_profiles for insert
  with check (auth.uid() = student_id);

create policy "onboarding_update_own"
  on onboarding_profiles for update
  using (auth.uid() = student_id);

-- ── subjects — readable by all authenticated ──────────────────
create policy "subjects_select_all"
  on subjects for select
  using (auth.role() = 'authenticated');

-- ── topics — readable by all authenticated ────────────────────
create policy "topics_select_all"
  on topics for select
  using (auth.role() = 'authenticated');

-- ── sub_topics — readable by all authenticated ───────────────
create policy "sub_topics_select_all"
  on sub_topics for select
  using (auth.role() = 'authenticated');

-- ── explanations — readable by all authenticated ─────────────
create policy "explanations_select_all"
  on explanations for select
  using (auth.role() = 'authenticated');

-- ── questions — readable by all authenticated ─────────────────
create policy "questions_select_all"
  on questions for select
  using (auth.role() = 'authenticated');

-- ── study_sessions ────────────────────────────────────────────
create policy "sessions_select_own"
  on study_sessions for select
  using (auth.uid() = student_id);

create policy "sessions_insert_own"
  on study_sessions for insert
  with check (auth.uid() = student_id);

create policy "sessions_update_own"
  on study_sessions for update
  using (auth.uid() = student_id);

-- ── sub_topic_progress ────────────────────────────────────────
create policy "progress_select_own"
  on sub_topic_progress for select
  using (auth.uid() = student_id);

create policy "progress_insert_own"
  on sub_topic_progress for insert
  with check (auth.uid() = student_id);

create policy "progress_update_own"
  on sub_topic_progress for update
  using (auth.uid() = student_id);

-- ── question_attempts ─────────────────────────────────────────
create policy "attempts_select_own"
  on question_attempts for select
  using (auth.uid() = student_id);

create policy "attempts_insert_own"
  on question_attempts for insert
  with check (auth.uid() = student_id);

-- ── daily_goals ───────────────────────────────────────────────
create policy "daily_goals_select_own"
  on daily_goals for select
  using (auth.uid() = student_id);

create policy "daily_goals_insert_own"
  on daily_goals for insert
  with check (auth.uid() = student_id);

create policy "daily_goals_update_own"
  on daily_goals for update
  using (auth.uid() = student_id);

-- ── weekly_quests — readable by all authenticated ─────────────
create policy "quests_select_all"
  on weekly_quests for select
  using (auth.role() = 'authenticated');

-- ── quest_submissions ─────────────────────────────────────────
create policy "submissions_select_own"
  on quest_submissions for select
  using (auth.uid() = student_id);

create policy "submissions_insert_own"
  on quest_submissions for insert
  with check (auth.uid() = student_id);

create policy "submissions_update_own"
  on quest_submissions for update
  using (auth.uid() = student_id);

-- ── payments — students can only read their own ───────────────
create policy "payments_select_own"
  on payments for select
  using (auth.uid() = student_id);

create policy "payments_insert_own"
  on payments for insert
  with check (auth.uid() = student_id);

-- ── rank_snapshots ────────────────────────────────────────────
create policy "snapshots_select_own"
  on rank_snapshots for select
  using (auth.uid() = student_id);

-- ── referrals ─────────────────────────────────────────────────
create policy "referrals_select_own"
  on referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_student_id);


-- ══════════════════════════════════════════════════════════════
-- VIEW: student_leaderboard
-- Safe public view — exposes only non-sensitive columns.
-- Use this for all leaderboard queries in the application.
-- ══════════════════════════════════════════════════════════════

create or replace view student_leaderboard as
  select
    id,
    full_name,
    school_name,
    year_group,
    rank_overall,
    rank_year,
    rank_core_math,
    rank_english,
    rank_integrated_science,
    rank_social_studies,
    xp_overall,
    xp_year,
    xp_core_math,
    xp_english,
    xp_integrated_science,
    xp_social_studies,
    rank_position_overall,
    rank_position_year,
    study_streak_days,
    subscription_status
  from students;


-- ══════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════

-- sub_topic_progress
create index idx_stp_student          on sub_topic_progress (student_id);
create index idx_stp_student_review   on sub_topic_progress (student_id, next_review_date);
create index idx_stp_sub_topic        on sub_topic_progress (sub_topic_id);

-- study_sessions
create index idx_sessions_student     on study_sessions (student_id);
create index idx_sessions_completed   on study_sessions (student_id, completed_at);

-- question_attempts
create index idx_attempts_student     on question_attempts (student_id);
create index idx_attempts_question    on question_attempts (question_id);

-- questions
create index idx_questions_sub_topic  on questions (sub_topic_id);
create index idx_questions_topic_lvl  on questions (topic_id, cognitive_level);

-- daily_goals
create index idx_daily_goals          on daily_goals (student_id, date);

-- students — for leaderboard sorting
create index idx_students_year_xp     on students (year_group, xp_year desc);
create index idx_students_overall_xp  on students (xp_overall desc);
create index idx_students_ref_code    on students (referral_code);

-- rank_snapshots
create index idx_snapshots            on rank_snapshots (student_id, snapshot_date);

-- referrals
create index idx_referrals_referrer   on referrals (referrer_id);


-- ══════════════════════════════════════════════════════════════
-- FUNCTION: fn_update_updated_at
-- Generic trigger function to stamp updated_at on any table.
-- ══════════════════════════════════════════════════════════════

create or replace function fn_update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ══════════════════════════════════════════════════════════════
-- FUNCTION: fn_sync_student_xp
-- Recalculates a student's per-subject and total XP from
-- sub_topic_progress whenever a progress row is inserted or
-- updated. Fires AFTER the DML so we read the final values.
-- ══════════════════════════════════════════════════════════════

create or replace function fn_sync_student_xp()
returns trigger
language plpgsql
security definer
as $$
declare
  v_student   uuid := new.student_id;
  v_math      integer;
  v_english   integer;
  v_science   integer;
  v_social    integer;
begin
  select coalesce(sum(xp_earned_total), 0) into v_math
    from sub_topic_progress
   where student_id = v_student and subject_id = 'core_math';

  select coalesce(sum(xp_earned_total), 0) into v_english
    from sub_topic_progress
   where student_id = v_student and subject_id = 'english';

  select coalesce(sum(xp_earned_total), 0) into v_science
    from sub_topic_progress
   where student_id = v_student and subject_id = 'integrated_science';

  select coalesce(sum(xp_earned_total), 0) into v_social
    from sub_topic_progress
   where student_id = v_student and subject_id = 'social_studies';

  update students
     set xp_core_math          = v_math,
         xp_english            = v_english,
         xp_integrated_science = v_science,
         xp_social_studies     = v_social,
         xp_year               = v_math + v_english + v_science + v_social,
         xp_overall            = v_math + v_english + v_science + v_social
   where id = v_student;

  return new;
end;
$$;


-- ══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════

-- Auto-update updated_at on students
create trigger trg_students_updated_at
  before update on students
  for each row
  execute function fn_update_updated_at();

-- Auto-update updated_at on sub_topic_progress
create trigger trg_stp_updated_at
  before update on sub_topic_progress
  for each row
  execute function fn_update_updated_at();

-- Sync student XP whenever sub_topic_progress XP changes
create trigger trg_sync_student_xp
  after insert or update of xp_earned_total on sub_topic_progress
  for each row
  execute function fn_sync_student_xp();
