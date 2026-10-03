import { useEffect, useState } from 'react'
import { supabase, type CourseWithDetails, type Department, type Faculty } from '../lib/supabase'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import { Plus, Pencil, Trash2, BookOpen, Search } from 'lucide-react'

export default function Courses() {
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CourseWithDetails | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CourseWithDetails | null>(null)
  const [form, setForm] = useState({ title: '', code: '', credits: '3', department_id: '', faculty_id: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('courses')
      .select('*, department:departments(*), faculty:faculty(*)')
      .order('title')
    setCourses(data as CourseWithDetails[] || [])
    const { data: depts } = await supabase.from('departments').select('*').order('name')
    setDepartments(depts || [])
    const { data: fac } = await supabase.from('faculty').select('*').order('name')
    setFaculty(fac || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ title: '', code: '', credits: '3', department_id: '', faculty_id: '', description: '' })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (c: CourseWithDetails) => {
    setEditing(c)
    setForm({
      title: c.title,
      code: c.code,
      credits: String(c.credits),
      department_id: c.department_id || '',
      faculty_id: c.faculty_id || '',
      description: c.description || '',
    })
    setError('')
    setModalOpen(true)
  }

  const save = async () => {
    setError('')
    if (!form.title.trim() || !form.code.trim()) {
      setError('Title and code are required')
      return
    }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      code: form.code.trim().toUpperCase(),
      credits: parseInt(form.credits),
      department_id: form.department_id || null,
      faculty_id: form.faculty_id || null,
      description: form.description.trim() || null,
    }
    if (editing) {
      const { error } = await supabase.from('courses').update(payload).eq('id', editing.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('courses').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('courses').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.department?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="toolbar">
        <div className="search-bar">
          <Search />
          <input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus /> Add Course
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No courses yet"
            message="Add your first course to get started."
            action={<button className="btn btn-primary" onClick={openAdd}><Plus /> Add Course</button>}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Credits</th>
                  <th>Department</th>
                  <th>Faculty</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="stat-icon cyan" style={{ width: 36, height: 36 }}>
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.title}</div>
                          {c.description && <div style={{ fontSize: 13, color: 'var(--gray-500)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{c.code}</span></td>
                    <td>{c.credits}</td>
                    <td>{c.department ? <span className="badge badge-gray">{c.department.code}</span> : <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                    <td>{c.faculty?.name || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-icon" onClick={() => openEdit(c)}><Pencil size={16} /></button>
                      <button className="btn btn-icon danger" onClick={() => setDeleteTarget(c)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Course' : 'Add Course'} onClose={() => setModalOpen(false)}>
          <div className="form-row">
            <div className="form-group">
              <label>Course Title</label>
              <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Introduction to Programming" />
            </div>
            <div className="form-group">
              <label>Course Code</label>
              <input className="form-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS101" style={{ textTransform: 'uppercase' }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Credits</label>
              <input className="form-input" type="number" min="1" max="10" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select className="form-select" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Assigned Faculty</label>
            <select className="form-select" value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}>
              <option value="">Select faculty member</option>
              {faculty.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief course description..." />
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
          title="Delete Course"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This will also remove all student enrollments for this course.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
