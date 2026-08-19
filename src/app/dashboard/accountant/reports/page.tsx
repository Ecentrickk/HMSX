'use client';

import { IconBarChart, IconDownload } from '@/client/components/icons';

export default function AccountantReportsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-1">View revenue, outstanding dues, and tax summaries.</p>
        </div>
        <button className="btn btn-secondary">
          <IconDownload size={18} /> Export CSV
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Total Revenue (MTD)</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <IconBarChart size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹24,500.00</p>
          <p className="text-sm text-green-600 mt-2 font-medium">+12.5% from last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Outstanding Dues</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <IconBarChart size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹8,450.00</p>
          <p className="text-sm text-gray-500 mt-2 font-medium">12 pending invoices</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Tax Collected (MTD)</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <IconBarChart size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹1,225.00</p>
          <p className="text-sm text-gray-500 mt-2 font-medium">Across 45 transactions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <p className="text-gray-500 text-sm">Detailed financial reports and interactive charts will be displayed here.</p>
      </div>
    </div>
  );
}
