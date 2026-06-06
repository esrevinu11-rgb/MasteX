-- Migrate from 19-tier (F3→S) to 6-grade (F→A) rank system
-- Take only the first character of each rank string

UPDATE students SET
  rank_core_math          = LEFT(rank_core_math, 1),
  rank_english            = LEFT(rank_english, 1),
  rank_integrated_science = LEFT(rank_integrated_science, 1),
  rank_social_studies     = LEFT(rank_social_studies, 1),
  rank_year               = LEFT(rank_year, 1),
  rank_overall            = LEFT(rank_overall, 1);

-- Map old S rank (no longer exists) to A
UPDATE students SET
  rank_overall            = 'A' WHERE rank_overall = 'S';
UPDATE students SET
  rank_year               = 'A' WHERE rank_year = 'S';
UPDATE students SET
  rank_core_math          = 'A' WHERE rank_core_math = 'S';
UPDATE students SET
  rank_english            = 'A' WHERE rank_english = 'S';
UPDATE students SET
  rank_integrated_science = 'A' WHERE rank_integrated_science = 'S';
UPDATE students SET
  rank_social_studies     = 'A' WHERE rank_social_studies = 'S';

-- Update column defaults
ALTER TABLE students ALTER COLUMN rank_core_math          SET DEFAULT 'F';
ALTER TABLE students ALTER COLUMN rank_english            SET DEFAULT 'F';
ALTER TABLE students ALTER COLUMN rank_integrated_science SET DEFAULT 'F';
ALTER TABLE students ALTER COLUMN rank_social_studies     SET DEFAULT 'F';
ALTER TABLE students ALTER COLUMN rank_year               SET DEFAULT 'F';
ALTER TABLE students ALTER COLUMN rank_overall            SET DEFAULT 'F';

-- Update rank_snapshots if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rank_snapshots') THEN
    UPDATE rank_snapshots SET
      rank_overall = LEFT(rank_overall, 1),
      rank_year    = LEFT(rank_year, 1);
  END IF;
END $$;
