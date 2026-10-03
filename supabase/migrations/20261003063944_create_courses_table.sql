/*
# Create courses table

1. New Tables
- `courses` — stores course catalog
  - id, title, code (unique), credits, department_id (fk → departments),
    faculty_id (fk → faculty), description, created_at
2. Security
- RLS enabled, anon + authenticated full CRUD
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  code text UNIQUE NOT NULL,
  credits int NOT NULL DEFAULT 3 CHECK (credits > 0),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  faculty_id uuid REFERENCES faculty(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses
  FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_faculty ON courses(faculty_id);
