'use client';

import { IconFileText } from '@/client/components/icons';

export function BillingSummary({ billings }: { billings: any[] }) {
  const handlePrint = (id: string) => {
    window.open(`/api/pdf/invoice/${id}`, '_blank');
  };

  if (!billings || billings.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Recent Billing</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>No billing records found for this patient.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Recent Billing</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {billings.map((bill) => (
          <div key={bill.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-3)', border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--radius-md)', backgroundColor: 'white'
          }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>Invoice #{bill.invoiceNumber || bill.id.substring(0,8)}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                {new Date(bill.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>₹{bill.totalAmount}</div>
                <span className={`badge ${bill.status === 'PAID' ? 'badge-success' : bill.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', marginTop: '4px' }}>
                  {bill.status}
                </span>
              </div>
              <button 
                onClick={() => handlePrint(bill.id)}
                className="btn btn-ghost btn-icon" 
                title="View Invoice PDF"
              >
                <IconFileText size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
