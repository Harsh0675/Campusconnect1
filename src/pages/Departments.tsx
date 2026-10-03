import { useEffect, useState } from 'react'
import { supabase, type Department } from '../lib/supabase'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import { Plus, Pencil, Trash2, Building2, Search } from 'lucide-react'

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('departments').select('*').order('name')
    setDepartments(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setName('')
    setCode('')
    setError('')
    setModalOpen(true)
  }

  const openEdit = (d: Department) => {
    setEditing(d)
    setName(d.name)
    setCode(d.code)
    setError('')
    setModalOpen(true)
  }

  const save = async () => {
    setError('')
    if (!name.trim() || !code.trim()) {
      setError('Name and code are required')
      return
    }
    setSaving(true)
    if (editing) {
      const { error } = await supabase
        .from('departments')
        .update({ name: name.trim(), code: code.trim().toUpperCase() })
        .eq('id', editing.id)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('departments')
        .insert({ name: name.trim(), code: code.trim().toUpperCase() })
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('departments').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const filtered = departments.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="toolbar">
        <div className="search-bar">
          <Search />
          <input placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus /> Add Department
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No departments yet"
            message="Create your first department to get started."
            action={<button className="btn btn-primary" onClick={openAdd}><Plus /> Add Department</button>}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="stat-icon blue" style={{ width: 36, height: 36 }}>
                          <Building2 size={18} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{d.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{d.code}</span></td>
                    <td>{new Date(d.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-icon" onClick={() => openEdit(d)}><Pencil size={16} /></button>
                      <button className="btn btn-icon danger" onClick={() => setDeleteTarget(d)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Department' : 'Add Department'} onClose={() => setModalOpen(false)}>
          <div className="form-group">
            <label>Department Name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Computer Science" />
          </div>
          <div className="form-group">
            <label>Department Code</label>
            <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CS" style={{ textTransform: 'uppercase' }} />
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
          title="Delete Department"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will not delete associated students or faculty but will unlink them.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
