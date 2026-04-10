-- Migration 001: Add missing INSERT policy on students table
-- Run this in the Supabase SQL Editor to fix signup immediately.
--
-- Background: RLS was enabled on the students table but only SELECT
-- and UPDATE policies existed. signUp() creates the auth.users row,
-- then the app inserts into students with the new user's UID. Without
-- an INSERT policy, Supabase rejects the insert with:
--   "new row violates row-level security policy for table students"

CREATE POLICY "students_insert_own" ON students
  FOR INSERT WITH CHECK (auth.uid() = id);
