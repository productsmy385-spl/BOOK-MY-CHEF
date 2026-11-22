import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AdminBookings() {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionAlert, setActionAlert] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getAllBookings();
      const list = res?.data || [];
      const mapped = list.map(b => ({
        id: b.id,
        ref: b.bookingReference || b.id,
        provider: b.provider?.professionalName || 'Atelier Masterchef',
        customer: b.customer?.email || 'Host',
        date: b.eventDate || 'Scheduled Date',
        slot: b.timeSlot || 'Lunch',
        total: b.finalAmount || b.estimatedTotal || 0,
        advance: b.advanceAmount || 0,
        status: b.bookingStatus || 'PENDING',
        paymentStatus: b.paymentStatus || 'PENDING',
        guests: b.guestCount || 10,
      }));
      setBookings(mapped);
    } catch (err) {
      console.warn('Could not fetch bookings for admin:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await api.bookings.updateStatus(bookingId, newStatus);
      setActionAlert(`Booking ${bookingId} transitioned to ${newStatus}. Updated in database.`);
      await loadBookings();
      setTimeout(() => setActionAlert(''), 4000);
    } catch (err) {
      alert('Status transition failed: ' + err.message);
    }
  };

  const filtered = filterStatus === 'ALL' ? bookings : bookings.filter(b => b.status === filterStatus);

  return (
    <div className="p-6 flex flex-col gap-6 font-sora">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-extrabold text-2xl text-[#172033]">Booking Lifecycle &amp; Dispute Arbitration</h1>
          <p className="text-xs text-[#64748B]">Oversee 17-state finite state machine transitions, escrow holds, and disputes.</p>
        </div>
      </div>

      {actionAlert && (
        <div className="p-3.5 rounded-md bg-[#10B981]/15 border border-[#10B981] text-[#047857] text-xs font-bold font-inter animate-in fade-in">
          {actionAlert}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E5E7EB] text-xs">
        {['ALL', 'CONFIRMED', 'PENDING_PROVIDER_CONFIRMATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`py-1.5 px-3 rounded-md font-bold whitespace-nowrap transition-colors ${
              filterStatus === st
                ? 'bg-[#0D47A1] text-white shadow-xs'
                : 'bg-white hover:bg-[#F8FAFC] text-[#64748B] border border-[#E5E7EB]'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="p-5 rounded-lg bg-white border border-[#E5E7EB] shadow-sm flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-8 h-8 border-2 border-[#2196F3] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-[#64748B] font-inter">Loading reservations from PostgreSQL...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#64748B] font-inter">
            No bookings found matching filter: {filterStatus}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-inter text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#64748B] font-bold text-[11px] uppercase tracking-wider font-sora">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Atelier Provider</th>
                  <th className="pb-3">Event Date &amp; Slot</th>
                  <th className="pb-3">Guests</th>
                  <th className="pb-3">Total Value</th>
                  <th className="pb-3">Escrow Status</th>
                  <th className="pb-3">Booking Status</th>
                  <th className="pb-3 text-right">FSM Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-[#f8faff] transition-colors">
                    <td className="py-3 font-bold text-[#0D47A1] font-mono text-[11px]">{b.ref}</td>
                    <td className="py-3 font-semibold text-[#172033]">{b.provider}</td>
                    <td className="py-3 text-[#172033]">{b.date} • {b.slot}</td>
                    <td className="py-3 text-[#64748B]">{b.guests} Guests</td>
                    <td className="py-3 font-extrabold text-[#172033] font-sora">
                      ₹{Number(b.total).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold font-sora ${
                        b.paymentStatus === 'CAPTURED' ? 'bg-[#10B981]/15 text-[#047857]' :
                        b.paymentStatus === 'ESCROW_LOCKED' ? 'bg-[#2196F3]/15 text-[#0D47A1]' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-sm bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1] text-[10px] font-bold uppercase font-sora">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' ? (
                        <div className="flex items-center justify-end gap-1 font-sora">
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[10px] font-bold"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'CANCELLED')}
                            className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded text-[10px] font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#64748B] font-inter">—</span>
                      )}
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
