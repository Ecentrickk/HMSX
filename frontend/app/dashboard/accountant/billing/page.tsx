'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconRefresh, IconSearch, IconDollarSign, IconCheck } from '@/client/components/icons';

export default function AccountantBillingPage() {
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBillings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accountant/billing');
      const data = await res.json();
      if (data.billings) setBillings(data.billings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage patient invoices and payments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchBillings} className="btn btn-secondary">
            <IconRefresh size={18} />
          </button>
          <button className="btn btn-primary">
            <IconPlus size={18} /> New Invoice
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Invoice # or Patient..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Total Amount</th>
                <th className="px-6 py-3 text-right">Paid</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading billings...</td></tr>
              ) : billings.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No invoices found.</td></tr>
              ) : (
                billings.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-blue-600">{bill.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{bill.patient?.name}</div>
                      <div className="text-xs text-gray-500">{bill.patient?.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      ₹{bill.totalAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      ₹{bill.paidAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        bill.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        bill.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
