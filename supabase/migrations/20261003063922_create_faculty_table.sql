/*
# Create faculty table

1. New Tables
- `faculty` — stores faculty members
  - id, name, email (unique), phone, designation, department_id (fk → departments),
    hire_date, created_at
2. Security
- RLS enabled, anon + authenticated full CRUD
*/

CREATE TABLE IF NOT EXISTS faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  designation text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  hire_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_faculty" ON faculty;
CREATE POLICY "anon_select_faculty" ON faculty
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_faculty" ON faculty;
CREATE POLICY "anon_insert_faculty" ON faculty
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_faculty" ON faculty;
CREATE POLICY "anon_update_faculty" ON faculty
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_faculty" ON faculty;
CREATE POLICY "anon_delete_faculty" ON faculty
  FOR DELETE TO anon, authenticated USING (true);
