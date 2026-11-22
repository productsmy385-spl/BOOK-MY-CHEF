import React, { useState } from 'react';

export default function AdminUsers() {
  const [customers, setCustomers] = useState([
    { id: 'usr-1', name: 'Meera Nambiar', phone: '+91 98401 12044', email: 'meera.n@example.com', bookingsCount: 3, totalSpent: '₹34,500', status: 'ACTIVE' },
    { id: 'usr-2', name: 'Vikramaditya V.', phone: '+91 98220 11990', email: 'vikram.v@example.com', bookingsCount: 5, totalSpent: '₹62,000', status: 'ACTIVE' },
    { id: 'usr-3', name: 'Deepika S.', phone: '+91 99401 22334', email: 'deepika.s@example.com', bookingsCount: 1, totalSpent: '₹45,000', status: 'ACTIVE' },
    { id: 'usr-4', name: 'Karan Mehra', phone: '+91 98110 33445', email: 'karan.m@example.com', bookingsCount: 2, totalSpent: '₹95,000', status: 'ACTIVE' },
  ]);

  const toggleStatus = (id) => {
    setCustomers(customers.map(c =>
      c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : c
    ));
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-sora font-extrabold text-2xl text-[#172033]">Host &amp; Customer Management</h1>
        <p className="font-sora text-xs text-[#64748B]">Manage verified host accounts, review booking history, and enforce platform safety rules.</p>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sora text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#64748B] font-bold text-[11px] uppercase tracking-wider">
                <th className="pb-3">User ID</th>
                <th className="pb-3">Full Name</th>
                <th className="pb-3">Contact Mobile</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Total Feasts</th>
                <th className="pb-3">Total Spend</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {customers.map((user) => (
                <tr key={user.id} className="hover:bg-[#f1f3ff]/40 transition-colors">
                  <td className="py-3 font-bold text-[#0D47A1]">{user.id}</td>
                  <td className="py-3 font-semibold text-[#172033]">{user.name}</td>
                  <td className="py-3 text-[#172033]">{user.phone}</td>
                  <td className="py-3 text-[#64748B]">{user.email}</td>
                  <td className="py-3 font-bold text-[#0D47A1]">{user.bookingsCount} Events</td>
                  <td className="py-3 font-extrabold text-[#172033]">{user.totalSpent}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      user.status === 'ACTIVE' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                        user.status === 'ACTIVE'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
