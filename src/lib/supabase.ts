import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Department = {
  id: string
  name: string
  code: string
  created_at: string
}

export type Faculty = {
  id: string
  name: string
  email: string
  phone: string | null
  designation: string | null
  department_id: string | null
  hire_date: string | null
  created_at: string
}

export type Student = {
  id: string
  name: string
  email: string
  phone: string | null
  enrollment_date: string
  year: number
  department_id: string | null
  status: string
  created_at: string
}

export type Course = {
  id: string
  title: string
  code: string
  credits: number
  department_id: string | null
  faculty_id: string | null
  description: string | null
  created_at: string
}

export type Enrollment = {
  id: string
  student_id: string
  course_id: string
  enrollment_date: string
  grade: string | null
  status: string
  created_at: string
}

export type FacultyWithDept = Faculty & { department: Department | null }
export type StudentWithDept = Student & { department: Department | null }
export type CourseWithDetails = Course & {
  department: Department | null
  faculty: Faculty | null
}
export type EnrollmentWithDetails = Enrollment & {
  student: Student | null
  course: Course | null
}
