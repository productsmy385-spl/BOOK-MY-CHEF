import React from 'react';

export default function AdminAuditLogs() {
  const auditLogs = [
    {
      id: 'AUD-901',
      action: 'VERIFY_PROVIDER_KYC',
      entity: 'Provider: Chef Raghavendra Rao (prov-101)',
      admin: 'operations@atelier.in',
      ip: '106.51.24.11',
      time: '22 Nov 2026, 11:30 AM',
      diff: 'verification_status: PENDING -> VERIFIED',
    },
    {
      id: 'AUD-900',
      action: 'DISBURSE_PAYOUT_BATCH',
      entity: 'Finance Batch #BTCH-4819 (28 payouts)',
      admin: 'finance@atelier.in',
      ip: '106.51.24.11',
      time: '22 Nov 2026, 09:45 AM',
      diff: 'payout_status: PROCESSING -> SETTLED (₹3,12,000)',
    },
    {
      id: 'AUD-899',
      action: 'RESOLVE_DISPUTE_CLAIM',
      entity: 'Booking: #BMC-8930-HYD',
      admin: 'support.lead@atelier.in',
      ip: '49.207.210.8',
      time: '21 Nov 2026, 04:15 PM',
      diff: 'dispute_status: OPEN -> RESOLVED (50% refund)',
    },
    {
      id: 'AUD-898',
      action: 'UPDATE_COMMISSION_POLICY',
      entity: 'System Category: CHEFS',
      admin: 'superadmin@atelier.in',
      ip: '106.51.24.11',
      time: '20 Nov 2026, 02:00 PM',
      diff: 'commission_rate: 12.0% -> 10.0%',
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-sora font-extrabold text-2xl text-[#172033]">System Audit Logs</h1>
        <p className="font-sora text-xs text-[#64748B]">Immutable chronological record of administrative overrides, status transitions, and escrow releases.</p>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sora text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#64748B] font-bold text-[11px] uppercase tracking-wider">
                <th className="pb-3">Log ID</th>
                <th className="pb-3">Action Type</th>
                <th className="pb-3">Target Entity</th>
                <th className="pb-3">Admin Identity</th>
                <th className="pb-3">IP Address</th>
                <th className="pb-3">Snapshot Diff</th>
                <th className="pb-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f1f3ff]/40 transition-colors">
                  <td className="py-3 font-bold text-[#0D47A1]">{log.id}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-[#E3F2FD] text-[#0D47A1] font-bold text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-[#172033]">{log.entity}</td>
                  <td className="py-3 text-[#64748B]">{log.admin}</td>
                  <td className="py-3 font-mono text-[11px] text-[#64748B]">{log.ip}</td>
                  <td className="py-3 font-mono text-[10px] text-[#047857]">{log.diff}</td>
                  <td className="py-3 text-right text-[#64748B] text-[11px]">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
