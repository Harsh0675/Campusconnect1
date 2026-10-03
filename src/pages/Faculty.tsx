import { useEffect, useState } from 'react'
import { supabase, type FacultyWithDept, type Department } from '../lib/supabase'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import { Plus, Pencil, Trash2, Mail, Phone, Search } from 'lucide-react'

export default function Faculty() {
  const [faculty, setFaculty] = useState<FacultyWithDept[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FacultyWithDept | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FacultyWithDept | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', designation: '', department_id: '', hire_date: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('faculty')
      .select('*, department:departments(*)')
      .order('name')
    setFaculty(data as FacultyWithDept[] || [])
    const { data: depts } = await supabase.from('departments').select('*').order('name')
    setDepartments(depts || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', designation: '', department_id: '', hire_date: '' })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (f: FacultyWithDept) => {
    setEditing(f)
    setForm({
      name: f.name,
      email: f.email,
      phone: f.phone || '',
      designation: f.designation || '',
      department_id: f.department_id || '',
      hire_date: f.hire_date || '',
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
      designation: form.designation.trim() || null,
      department_id: form.department_id || null,
      hire_date: form.hire_date || null,
    }
    if (editing) {
      const { error } = await supabase.from('faculty').update(payload).eq('id', editing.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('faculty').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('faculty').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const filtered = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      (f.department?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="toolbar">
        <div className="search-bar">
          <Search />
          <input placeholder="Search faculty..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus /> Add Faculty
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No faculty members yet"
            message="Add your first faculty member to get started."
            action={<button className="btn btn-primary" onClick={openAdd}><Plus /> Add Faculty</button>}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.name}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-600)' }}>
                          <Mail size={13} /> {f.email}
                        </span>
                        {f.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-500)', fontSize: 13 }}>
                            <Phone size={13} /> {f.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{f.designation || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                    <td>{f.department ? <span className="badge badge-blue">{f.department.code}</span> : <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-icon" onClick={() => openEdit(f)}><Pencil size={16} /></button>
                      <button className="btn btn-icon danger" onClick={() => setDeleteTarget(f)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Faculty' : 'Add Faculty'} onClose={() => setModalOpen(false)}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dr. John Smith" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. jsmith@college.edu" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +1 555-0100" />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input className="form-input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Professor" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select className="form-select" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Hire Date</label>
              <input className="form-input" type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
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
          title="Delete Faculty Member"
          message={`Are you sure you want to delete "${deleteTarget.name}"? Courses assigned to them will be unlinked.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
