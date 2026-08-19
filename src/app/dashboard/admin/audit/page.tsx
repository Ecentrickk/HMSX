'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import '@/client/styles/admin.css';

interface AuditRecord {
  id: string; action: string; entity: string; entityId: string | null;
  details: any; createdAt: string;
  user: { name: string; role: string };
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const actionColors: Record<string, string> = {
  PRESCRIPTION_SIGNED: 'success', VITALS_RECORDED: 'accent', APPOINTMENT_CREATED: 'warning',
  INVENTORY_ITEM_CREATED: 'primary', USER_DEACTIVATED: 'danger', USER_UPDATED: 'primary',
  REPORT_SIGNED: 'success', REPORT_CREATED: 'primary', DIAGNOSIS_CREATED: 'primary',
  MEDICATION_ADMINISTERED: 'accent', PATIENT_REGISTERED: 'warning', NOTIFICATION_SENT: 'neutral',
  USER_CREATED: 'primary', BILLING_CREATED: 'warning', BILLING_UPDATED: 'success',
  PRESCRIPTION_FULFILLED: 'success', MEDICATION_SKIPPED: 'neutral',
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?page=${page}&limit=30`);
      if (res.ok) { const data = await res.json(); setLogs(data.logs); setTotal(data.total); }
    } catch { /* */ } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / 30);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants}>
        <h1 className="page-header__title">Audit Logs</h1>
        <p className="page-header__subtitle">Complete system activity trail — {total} entries</p>
      </motion.div>

      <motion.div className="glass-card--static" style={{ padding: 'var(--space-5)' }} variants={itemVariants}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs yet</div>
        ) : (
          <div className="audit-log">
            {logs.map(log => (
              <motion.div key={log.id} className="audit-log-item" variants={itemVariants} whileHover={{ x: 4 }}>
                <div className="audit-log-item__time">
                  {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
                <div className="audit-log-item__action">
                  <div>
                    <strong>{log.user.name}</strong>{' '}
                    <span className={`badge badge-${actionColors[log.action] || 'neutral'}`} style={{ fontSize: '0.55rem' }}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="audit-log-item__entity" style={{ marginTop: 2 }}>
                    {log.entity}{log.entityId ? ` #${log.entityId.slice(-6)}` : ''}
                    {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 && (
                      <span style={{ color: 'var(--text-muted)' }}> — {JSON.stringify(log.details).slice(0, 80)}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
