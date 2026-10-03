import { useEffect, useState } from 'react'
import { supabase, type StudentWithDept, type Department } from '../lib/supabase'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import { Plus, Pencil, Trash2, Mail, Phone, Search } from 'lucide-react'

const statusBadge: Record<string, string> = {
  active: 'badge-green',
  graduated: 'badge-blue',
  suspended: 'badge-red',
}

export default function Students() {
  const [students, setStudents] = useState<StudentWithDept[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StudentWithDept | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudentWithDept | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', enrollment_date: '', year: '1', department_id: '', status: 'active' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*, department:departments(*)')
      .order('name')
    setStudents(data as StudentWithDept[] || [])
    const { data: depts } = await supabase.from('departments').select('*').order('name')
    setDepartments(depts || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', enrollment_date: new Date().toISOString().split('T')[0], year: '1', department_id: '', status: 'active' })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (s: StudentWithDept) => {
    setEditing(s)
    setForm({
      name: s.name,
      email: s.email,
      phone: s.phone || '',
      enrollment_date: s.enrollment_date,
      year: String(s.year),
      department_id: s.department_id || '',
      status: s.status,
    })
    setError('')
    setModalOpen(true)
  }

  const save = async () => {
    setError('')
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      enrollment_date: form.enrollment_date,
      year: parseInt(form.year),
      department_id: form.department_id || null,
      status: form.status,
    }
    if (editing) {
      const { error } = await supabase.from('students').update(payload).eq('id', editing.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('students').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('students').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const filtered = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <div className="toolbar">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <div className="search-bar">
            <Search />
            <input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus /> Add Student
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No students yet"
            message="Add your first student to get started."
            action={<button className="btn btn-primary" onClick={openAdd}><Plus /> Add Student</button>}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Year</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-600)' }}>
                          <Mail size={13} /> {s.email}
                        </span>
                        {s.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-500)', fontSize: 13 }}>
                            <Phone size={13} /> {s.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>Year {s.year}</td>
                    <td>{s.department ? <span className="badge badge-blue">{s.department.code}</span> : <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                    <td><span className={`badge ${statusBadge[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-icon" onClick={() => openEdit(s)}><Pencil size={16} /></button>
                      <button className="btn btn-icon danger" onClick={() => setDeleteTarget(s)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Student' : 'Add Student'} onClose={() => setModalOpen(false)}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jane Doe" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. jdoe@college.edu" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +1 555-0100" />
            </div>
            <div className="form-group">
              <label>Enrollment Date</label>
              <input className="form-input" type="date" value={form.enrollment_date} onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Year of Study</label>
              <select className="form-select" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Department</label>
            <select className="form-select" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Select department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
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
          title="Delete Student"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will also remove all their enrollments.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
