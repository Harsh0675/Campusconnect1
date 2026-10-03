import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Loading from '../components/Loading'
import { Users, GraduationCap, BookOpen, ClipboardList, Building2, TrendingUp, Award, ArrowRight } from 'lucide-react'

type Page = 'dashboard' | 'students' | 'faculty' | 'courses' | 'enrollments' | 'departments'

type Props = {
  onNavigate: (p: Page) => void
}

type Stats = {
  students: number
  faculty: number
  courses: number
  enrollments: number
  departments: number
  activeStudents: number
  completedEnrollments: number
}

export default function Dashboard({ onNavigate }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([])
  const [deptCounts, setDeptCounts] = useState<{ name: string; code: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [students, faculty, courses, enrollments, departments, activeStudents, completedEnrollments] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('faculty').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      ])

      setStats({
        students: students.count || 0,
        faculty: faculty.count || 0,
        courses: courses.count || 0,
        enrollments: enrollments.count || 0,
        departments: departments.count || 0,
        activeStudents: activeStudents.count || 0,
        completedEnrollments: completedEnrollments.count || 0,
      })

      const { data: recent } = await supabase
        .from('enrollments')
        .select('*, student:students(name), course:courses(title,code)')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentEnrollments(recent || [])

      const { data: depts } = await supabase.from('departments').select('*').order('name')
      if (depts && depts.length > 0) {
        const counts = await Promise.all(
          depts.map(async (d) => {
            const { count } = await supabase
              .from('students')
              .select('*', { count: 'exact', head: true })
              .eq('department_id', d.id)
            return { name: d.name, code: d.code, count: count || 0 }
          })
        )
        setDeptCounts(counts)
      }

      setLoading(false)
    })()
  }, [])

  if (loading) return <Loading />

  const statCards = [
    { label: 'Total Students', value: stats?.students || 0, icon: Users, color: 'blue', page: 'students' as Page },
    { label: 'Faculty Members', value: stats?.faculty || 0, icon: GraduationCap, color: 'green', page: 'faculty' as Page },
    { label: 'Courses', value: stats?.courses || 0, icon: BookOpen, color: 'cyan', page: 'courses' as Page },
    { label: 'Enrollments', value: stats?.enrollments || 0, icon: ClipboardList, color: 'amber', page: 'enrollments' as Page },
    { label: 'Departments', value: stats?.departments || 0, icon: Building2, color: 'purple', page: 'departments' as Page },
    { label: 'Active Students', value: stats?.activeStudents || 0, icon: TrendingUp, color: 'green', page: 'students' as Page },
  ]

  const statusBadge: Record<string, string> = {
    enrolled: 'badge-blue',
    completed: 'badge-green',
    dropped: 'badge-red',
  }

  return (
    <div>
      <div className="stat-grid">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => onNavigate(card.page)}
            >
              <div className="stat-card-top">
                <div className={`stat-icon ${card.color}`}>
                  <Icon />
                </div>
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3>Recent Enrollments</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('enrollments')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          {recentEnrollments.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No enrollments yet
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <tbody>
                  {recentEnrollments.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.student?.name || 'Unknown'}</td>
                      <td>
                        <span className="badge badge-gray">{e.course?.code}</span>
                        <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--gray-600)' }}>{e.course?.title}</span>
                      </td>
                      <td><span className={`badge ${statusBadge[e.status] || 'badge-gray'}`}>{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Students by Department</h3>
            <Award size={20} style={{ color: 'var(--gray-400)' }} />
          </div>
          <div className="card-body">
            {deptCounts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No departments yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {deptCounts.map((d) => {
                  const maxCount = Math.max(...deptCounts.map((x) => x.count), 1)
                  const pct = (d.count / maxCount) * 100
                  return (
                    <div key={d.code}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</span>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{d.count}</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'var(--primary-500)',
                            borderRadius: 4,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: '20px 24px', background: 'var(--primary-50)', borderRadius: 'var(--radius)', border: '1px solid var(--primary-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div className="stat-icon green" style={{ width: 36, height: 36 }}>
            <Award size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--gray-900)' }}>
              {stats?.completedEnrollments || 0} Completed Courses
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Out of {stats?.enrollments || 0} total enrollments
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
