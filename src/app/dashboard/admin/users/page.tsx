'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { IconSearch, IconPlus, IconEdit, IconX, IconCheck, IconUser } from '@/client/components/icons';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

const ROLES = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'ADMIN'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'DOCTOR', department: '', phone: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || 'Failed to create user');
        setFormLoading(false);
        return;
      }

      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'DOCTOR', department: '', phone: '' });
      fetchUsers();
    } catch {
      setFormError('Network error');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchUsers();
    } catch {
      console.error('Toggle failed');
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header__title">User Management</h1>
          <p className="page-header__subtitle">Create, manage, and deactivate staff accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="create-user">
          <IconPlus size={14} /> Create User
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div className="pharmacy-toolbar" variants={itemVariants}>
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <span className="search-bar__icon"><IconSearch size={16} /></span>
          <input className="search-bar__input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} id="user-search" />
        </div>
        <div className="pharmacy-filters">
          {['ALL', ...ROLES].map(r => (
            <button key={r} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setRoleFilter(r)}>
              {r === 'ALL' ? 'All Roles' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* User Table */}
      <motion.div className="glass-card--static data-table-container" variants={itemVariants}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            {users.length === 0 ? 'No users found. Create your first user above.' : 'No users match your filters.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div className="avatar avatar--sm">
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{user.email}</td>
                  <td><span className="badge badge-neutral">{user.role}</span></td>
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{user.department || '—'}</td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-primary' : 'badge-neutral'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => toggleActive(user.id, user.isActive)}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <IconX size={14} /> : <IconCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Create Modal */}
      {showModal && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowModal(false)}>
          <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Staff Account</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><IconX size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="input-group">
                    <label className="input-label">Full Name *</label>
                    <input className="input-field" placeholder="e.g. Dr. Sarah Wilson" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email *</label>
                    <input className="input-field" type="email" placeholder="email@h1ms.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label">Role *</label>
                      <select className="select-field" value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
                        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Department</label>
                      <input className="input-field" placeholder="e.g. Cardiology" value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Phone</label>
                    <input className="input-field" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Password *</label>
                    <input className="input-field" type="password" placeholder="Set initial password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required />
                  </div>
                  {formError && (
                    <div style={{ padding: 'var(--space-3)', background: 'rgba(113,113,122,0.08)', border: '1px solid rgba(113,113,122,0.15)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {formError}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
