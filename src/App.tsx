import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Building2,
  Menu,
  X,
  GraduationCap as LogoIcon,
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Faculty from './pages/Faculty'
import Courses from './pages/Courses'
import Enrollments from './pages/Enrollments'
import Departments from './pages/Departments'

type Page = 'dashboard' | 'students' | 'faculty' | 'courses' | 'enrollments' | 'departments'

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'faculty', label: 'Faculty', icon: GraduationCap },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'enrollments', label: 'Enrollments', icon: ClipboardList },
  { id: 'departments', label: 'Departments', icon: Building2 },
]

const pageMeta: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your college at a glance' },
  students: { title: 'Students', subtitle: 'Manage student records and enrollment status' },
  faculty: { title: 'Faculty', subtitle: 'Manage faculty members and their assignments' },
  courses: { title: 'Courses', subtitle: 'Manage the course catalog and assignments' },
  enrollments: { title: 'Enrollments', subtitle: 'Track student course enrollments and grades' },
  departments: { title: 'Departments', subtitle: 'Manage academic departments' },
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigate = (p: Page) => {
    setPage(p)
    setSidebarOpen(false)
  }

  return (
    <div className="app">
      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <LogoIcon size={22} />
            </div>
            <div className="sidebar-logo-text">
              <h1>Campus Connect</h1>
              <span>College Management System</span>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.id)}
              >
                <Icon />
                {item.label}
              </div>
            )
          })}
        </nav>
      </aside>

      <div className="main-content">
        <div className="mobile-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <LogoIcon size={18} />
            </div>
            <h1>Campus Connect</h1>
          </div>
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        <div className="topbar">
          <div>
            <h2>{pageMeta[page].title}</h2>
            <p>{pageMeta[page].subtitle}</p>
          </div>
        </div>

        <div className="page-content">
          {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {page === 'students' && <Students />}
          {page === 'faculty' && <Faculty />}
          {page === 'courses' && <Courses />}
          {page === 'enrollments' && <Enrollments />}
          {page === 'departments' && <Departments />}
        </div>
      </div>
    </div>
  )
}
