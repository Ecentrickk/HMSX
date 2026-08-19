'use client';

import { useState, useEffect } from 'react';
import { IconPlus, IconRefresh, IconSearch, IconList } from '@/client/components/icons';

export default function AccountantServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accountant/services');
      const data = await res.json();
      if (data.services) setServices(data.services);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Manage hospital services and pricing.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchServices} className="btn btn-secondary">
            <IconRefresh size={18} />
          </button>
          <button className="btn btn-primary">
            <IconPlus size={18} /> Add Service
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative w-64">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Service Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3 text-right">Unit Price (₹)</th>
                <th className="px-6 py-3 text-right">Tax (%)</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No services found.</td></tr>
              ) : (
                services.map((srv) => (
                  <tr key={srv.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{srv.code}</td>
                    <td className="px-6 py-4 text-gray-700">{srv.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {srv.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{srv.unit}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">₹{srv.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{srv.taxRate}%</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
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
