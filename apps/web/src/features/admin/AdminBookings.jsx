import React, { useState } from 'react';

export default function AdminBookings() {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionAlert, setActionAlert] = useState('');

  const bookings = [
    {
      id: '#BMC-8942-HYD',
      host: 'Ananya Rao',
      provider: 'Chef Raghavendra Rao',
      date: '28 Nov 2026',
      total: '₹11,000',
      escrow: '₹3,300 (Held)',
      status: 'CONFIRMED',
      guests: 25,
      dispute: false,
    },
    {
      id: '#BMC-8941-HYD',
      host: 'Vikramaditya V.',
      provider: 'Chef Anupama Joshi',
      date: '02 Dec 2026',
      total: '₹18,000',
      escrow: 'Pending Payment',
      status: 'PENDING_PAYMENT',
      guests: 12,
      dispute: false,
    },
    {
      id: '#BMC-8930-HYD',
      host: 'Suresh Menon',
      provider: 'Royal Dakshin Caterers',
      date: '19 Nov 2026',
      total: '₹35,000',
      escrow: '₹10,500 (Frozen)',
      status: 'DISPUTED',
      guests: 100,
      dispute: true,
      disputeReason: 'Delay of 45 mins in food service due to transport breakdown',
    },
    {
      id: '#BMC-8920-HYD',
      host: 'Pooja Agarwal',
      provider: 'Utsav Event Planners',
      date: '14 Nov 2026',
      total: '₹25,000',
      escrow: 'Settled to Wallet',
      status: 'COMPLETED',
      guests: 50,
      dispute: false,
    },
  ];

  const handleResolveDispute = (bookingId, decision) => {
    setActionAlert(`Dispute on ${bookingId} resolved: ${decision}. Action logged to audit trail.`);
    setTimeout(() => setActionAlert(''), 4000);
  };

  const filtered = filterStatus === 'ALL' ? bookings : bookings.filter(b => b.status === filterStatus);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-sora font-extrabold text-2xl text-[#172033]">Booking Lifecycle &amp; Dispute Arbitration</h1>
          <p className="font-sora text-xs text-[#64748B]">Oversee 17-state finite state machine transitions, escrow holds, and disputes.</p>
        </div>
      </div>

      {actionAlert && (
        <div className="p-3.5 rounded-2xl bg-[#0D47A1] text-white font-sora text-xs font-bold animate-in fade-in">
          ℹ {actionAlert}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'CONFIRMED', 'PENDING_PAYMENT', 'DISPUTED', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-full font-sora text-xs font-semibold whitespace-nowrap transition-all ${
              filterStatus === st
                ? 'bg-[#2196F3] text-white shadow-sm'
                : 'bg-white border border-[#E5E7EB] text-[#64748B] hover:border-[#90CAF9]'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sora text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#64748B] font-bold text-[11px] uppercase tracking-wider">
                <th className="pb-3">Booking Ref</th>
                <th className="pb-3">Host / Customer</th>
                <th className="pb-3">Provider</th>
                <th className="pb-3">Event Date</th>
                <th className="pb-3">Total Value</th>
                <th className="pb-3">Escrow Status</th>
                <th className="pb-3">FSM State</th>
                <th className="pb-3 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-[#f1f3ff]/40 transition-colors">
                  <td className="py-3.5 font-bold text-[#0D47A1]">{b.id}</td>
                  <td className="py-3.5 font-semibold text-[#172033]">{b.host}</td>
                  <td className="py-3.5 text-[#172033]">{b.provider}</td>
                  <td className="py-3.5 text-[#64748B]">{b.date}</td>
                  <td className="py-3.5 font-extrabold text-[#172033]">{b.total}</td>
                  <td className="py-3.5">
                    <span className="font-semibold text-[#0D47A1]">{b.escrow}</span>
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'CONFIRMED'
                        ? 'bg-[#10B981]/15 text-[#10B981]'
                        : b.status === 'DISPUTED'
                        ? 'bg-[#EF4444]/15 text-[#EF4444]'
                        : b.status === 'PENDING_PAYMENT'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-[#f1f3ff] text-[#64748B]'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {b.dispute ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleResolveDispute(b.id, 'Refund 50% to Host')}
                          className="px-2.5 py-1 bg-[#EF4444] text-white rounded-full text-[10px] font-bold shadow-xs hover:bg-red-700"
                        >
                          Partial Refund
                        </button>
                        <button
                          onClick={() => handleResolveDispute(b.id, 'Release Escrow to Provider')}
                          className="px-2.5 py-1 bg-[#10B981] text-white rounded-full text-[10px] font-bold shadow-xs hover:bg-emerald-700"
                        >
                          Release Escrow
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleResolveDispute(b.id, 'Audit Inspected')}
                        className="px-3 py-1 bg-[#f1f3ff] text-[#0D47A1] rounded-full text-[11px] font-bold hover:bg-[#E3F2FD]"
                      >
                        Details
                      </button>
                    )}
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
