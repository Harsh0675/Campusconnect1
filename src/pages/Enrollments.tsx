import { useEffect, useState } from 'react'
import { supabase, type EnrollmentWithDetails, type Student, type Course } from '../lib/supabase'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import { Plus, Trash2, Search, Pencil } from 'lucide-react'

const statusBadge: Record<string, string> = {
  enrolled: 'badge-blue',
  completed: 'badge-green',
  dropped: 'badge-red',
}

const gradeBadge: Record<string, string> = {
  A: 'badge-green',
  B: 'badge-green',
  C: 'badge-amber',
  D: 'badge-amber',
  F: 'badge-red',
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EnrollmentWithDetails | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EnrollmentWithDetails | null>(null)
  const [form, setForm] = useState({ student_id: '', course_id: '', grade: '', status: 'enrolled' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('enrollments')
      .select('*, student:students(*), course:courses(*)')
      .order('enrollment_date', { ascending: false })
    setEnrollments(data as EnrollmentWithDetails[] || [])
    const { data: studs } = await supabase.from('students').select('*').order('name')
    setStudents(studs || [])
    const { data: crs } = await supabase.from('courses').select('*').order('title')
    setCourses(crs || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditTarget(null)
    setForm({ student_id: '', course_id: '', grade: '', status: 'enrolled' })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (e: EnrollmentWithDetails) => {
    setEditTarget(e)
    setForm({ student_id: e.student_id, course_id: e.course_id, grade: e.grade || '', status: e.status })
    setError('')
    setModalOpen(true)
  }

  const save = async () => {
    setError('')
    if (!form.student_id || !form.course_id) {
      setError('Student and course are required')
      return
    }
    setSaving(true)
    const payload = {
      student_id: form.student_id,
      course_id: form.course_id,
      grade: form.grade || null,
      status: form.status,
    }
    if (editTarget) {
      const { error } = await supabase.from('enrollments').update(payload).eq('id', editTarget.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('enrollments').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('enrollments').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const filtered = enrollments.filter((e) => {
    const studentName = e.student?.name || ''
    const courseTitle = e.course?.title || ''
    const courseCode = e.course?.code || ''
    const matchesSearch =
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      courseCode.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <div className="toolbar">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <div className="search-bar">
            <Search />
            <input placeholder="Search by student or course..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="enrolled">Enrolled</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus /> Add Enrollment
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No enrollments yet"
            message="Enroll a student in a course to get started."
            action={<button className="btn btn-primary" onClick={openAdd}><Plus /> Add Enrollment</button>}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Enrollment Date</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.student?.name || 'Unknown'}</td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600 }}>{e.course?.title || 'Unknown'}</span>
                        <span style={{ marginLeft: 8 }} className="badge badge-gray">{e.course?.code}</span>
                      </div>
                    </td>
                    <td>{new Date(e.enrollment_date).toLocaleDateString()}</td>
                    <td>{e.grade ? <span className={`badge ${gradeBadge[e.grade] || 'badge-gray'}`}>{e.grade}</span> : <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                    <td><span className={`badge ${statusBadge[e.status] || 'badge-gray'}`}>{e.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-icon" onClick={() => openEdit(e)}><Pencil size={16} /></button>
                      <button className="btn btn-icon danger" onClick={() => setDeleteTarget(e)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editTarget ? 'Edit Enrollment' : 'Add Enrollment'} onClose={() => setModalOpen(false)}>
          <div className="form-group">
            <label>Student</label>
            <select className="form-select" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} disabled={!!editTarget}>
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Course</label>
            <select className="form-select" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} disabled={!!editTarget}>
              <option value="">Select course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Grade</label>
              <select className="form-select" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                <option value="">Not graded</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="F">F</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="enrolled">Enrolled</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
          </div>
          {error && <p style={{ color: 'var(--error-600)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Enrollment"
          message={`Remove ${deleteTarget.student?.name}'s enrollment in ${deleteTarget.course?.title}?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
