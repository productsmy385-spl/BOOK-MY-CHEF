import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getAllUsers();
      const list = res?.data || [];
      setUsers(list);
    } catch (err) {
      console.warn('Could not load users for admin:', err.message);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    try {
      if (currentStatus === 'ACTIVE') {
        await api.admin.suspendUser(id);
      } else {
        await api.admin.restoreUser(id);
      }
      await loadUsers();
    } catch (err) {
      alert('Failed to update user status: ' + err.message);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 font-sora">
      <div>
        <h1 className="font-extrabold text-2xl text-[#172033]">Host &amp; Customer Management</h1>
        <p className="text-xs text-[#64748B]">Manage verified host accounts, review booking history, and enforce platform safety rules.</p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-xs font-semibold border border-red-200 font-inter">
          {errorMsg}
        </div>
      )}

      <div className="p-5 rounded-lg bg-white border border-[#E5E7EB] shadow-sm flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-8 h-8 border-2 border-[#2196F3] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-[#64748B] font-inter">Loading users from PostgreSQL...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#64748B] font-inter">
            No registered users found in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-inter text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#64748B] font-bold text-[11px] uppercase tracking-wider font-sora">
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Contact Mobile</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f8faff] transition-colors">
                    <td className="py-3 font-bold text-[#0D47A1] font-mono text-[11px]">{user.id?.substring(0, 8)}...</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-sm bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1] text-[10px] font-bold uppercase font-sora">
                        {user.userType}
                      </span>
                    </td>
                    <td className="py-3 text-[#172033] font-medium">{user.phone || '—'}</td>
                    <td className="py-3 text-[#64748B]">{user.email || '—'}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-sm text-[10px] font-bold font-sora ${
                        user.accountStatus === 'ACTIVE' ? 'bg-[#10B981]/15 text-[#047857]' : 'bg-[#EF4444]/15 text-[#B91C1C]'
                      }`}>
                        {user.accountStatus || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => toggleStatus(user.id, user.accountStatus || 'ACTIVE')}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors font-sora ${
                          user.accountStatus === 'ACTIVE'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {user.accountStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
