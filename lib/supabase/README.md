# MasteX Database — Schema v2.0

## Running the Schema

Open the Supabase SQL editor for your project and run the files in this order:

```
1. schema.sql   — creates all tables, RLS policies, indexes, triggers, and views
2. seed.sql     — inserts the 4 subjects and all Core Mathematics Year 1 content
```

The schema is **idempotent**: it drops every existing object before recreating it, so it is safe to re-run when you need to reset or migrate.

---

## Table Relationships

```
auth.users
    │
    └── students (1:1 via id FK)
            │
            ├── onboarding_profiles (1:1)
            │
            ├── study_sessions (1:many)
            │       └── question_attempts (1:many)
            │
            ├── sub_topic_progress (1:many)
            │
            ├── daily_goals (1:many)
            │
            ├── quest_submissions (1:many)
            │
            ├── payments (1:many)
            │
            ├── rank_snapshots (1:many)
            │
            ├── referrals as referrer (1:many)
            └── referrals as referred (1:1)


subjects (static seed data)
    │
    └── topics (1:many)
            │
            └── sub_topics (1:many)
                    │
                    ├── explanations (1:3 — one per student_level)
                    │
                    ├── questions (1:many)
                    │       └── question_attempts (via questions)
                    │
                    └── sub_topic_progress (1:many via students)


weekly_quests
    ├── references subjects
    ├── references topics
    ├── references sub_topics
    ├── part_a_id → questions
    ├── part_b_id → questions
    └── part_c_id → questions
            │
            └── quest_submissions (1:many via students)
```

---

## Spaced Repetition — How It Works

Every time a student completes a study session on a sub-topic, the system
decides when they should review it next. The schedule is stored on
`sub_topic_progress.spaced_interval_index` and `next_review_date`.

```
spaced_interval_index | Interval  | Next review
──────────────────────|───────────|──────────────
          0           |  1 day    | tomorrow
          1           |  3 days   | in 3 days
          2           |  7 days   | in 1 week
          3           |  21 days  | in 3 weeks  → sub-topic is "Mastered"
```

**Advancing:** When a student passes a review session (accuracy ≥ 70%),
`spaced_interval_index` increments by 1 and `next_review_date` is set
to `now() + interval`.

**Resetting:** When a student answers a sub-topic incorrectly during review,
`spaced_interval_index` resets to 0 and `next_review_date` = tomorrow.
The `consecutive_wrong` counter also increments.

**Dashboard queue:** The dashboard shows sub-topics where
`next_review_date <= today` and `mastery_state != 'unseen'`.

---

## Mastery State Progression

```
unseen
  │  (first session started)
  ▼
introduced
  │  (2+ correct answers on definition/fill_blank frames)
  ▼
practicing
  │  (correct across 4+ frames; 2+ spaced sessions passed)
  ▼
consolidating
  │  (correct on all 6 frames; 3+ spaced sessions passed)
  ▼
mastered
  │  (mastered + applied correctly in a weekly quest)
  ▼
locked_in
```

Stored in: `sub_topic_progress.mastery_state`
Frames completed tracked in: `sub_topic_progress.frames_completed` (text[])

---

## Support Mode — How It Is Triggered

Support mode activates when a student is consistently struggling with a
sub-topic. The system tracks this via `sub_topic_progress`:

| Signal                        | Threshold         |
|-------------------------------|-------------------|
| `consecutive_wrong`           | ≥ 3 wrong in a row|
| `attempts_at_level_1`         | ≥ 6 attempts with low accuracy on foundational (L1) questions |

When triggered (`support_mode_active = true`):
- The study session switches to the **beginner** explanation level
- Claude generates a simpler `explanations` record for `student_level = 'beginner'`
- Worked examples are shown before any questions
- Hints are pre-revealed on the first question
- The student's `learning_pace` may be updated to `'slow'`

Support mode is cleared automatically after 2 consecutive correct answers.

---

## Leaderboard — Column Restriction

The `students` table contains sensitive fields (email, referral details,
discount percentages). The **`student_leaderboard` view** exposes only the
safe public columns:

```
id, full_name, school_name, year_group,
rank_overall, rank_year, rank_core_math, rank_english,
rank_integrated_science, rank_social_studies,
xp_overall, xp_year, xp_core_math, xp_english,
xp_integrated_science, xp_social_studies,
rank_position_overall, rank_position_year,
study_streak_days, subscription_status
```

Always query `student_leaderboard` for leaderboard UI, never the
`students` table directly from a leaderboard context.

---

## XP Sync Trigger

The `trg_sync_student_xp` trigger fires after any insert or update on
`sub_topic_progress.xp_earned_total`. It calls `fn_sync_student_xp()`,
which recomputes the student's per-subject XP by summing all their
`sub_topic_progress` rows, then writes the totals to the `students` table:

```
students.xp_core_math          = SUM(xp_earned_total WHERE subject_id = 'core_math')
students.xp_english            = SUM(xp_earned_total WHERE subject_id = 'english')
students.xp_integrated_science = SUM(...)
students.xp_social_studies     = SUM(...)
students.xp_year               = sum of all 4
students.xp_overall            = same as xp_year
```

This keeps leaderboard data always current without requiring a nightly
batch job for XP fields.

---

## Seed Data Coverage

`seed.sql` seeds the following content:

| Item          | Count | Notes                                    |
|---------------|-------|------------------------------------------|
| Subjects      | 4     | All core WAEC subjects                   |
| Topics        | 12    | Core Mathematics Year 1 only             |
| Sub-topics    | 61    | All sub-topics for the 12 Maths topics   |
| Prerequisites | 10    | Topic prerequisite chains set correctly  |

Topics for English, Integrated Science, Social Studies Year 1,
and all Year 2 and Year 3 content should be added in subsequent seeds
following the same `DO $$ ... $$` pattern.
