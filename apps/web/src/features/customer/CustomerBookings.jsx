import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';
import { useBookingStore } from '../../stores/useBookingStore';
import { api } from '../../services/api';

export default function CustomerBookings() {
  const navigate = useNavigate();
  const { activeBooking, provider, step1Requirements, quotation } = useBookingStore();
  const [dbBookings, setDbBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchBookings() {
      setLoading(true);
      try {
        const res = await api.bookings.getMyBookings();
        if (isMounted && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setDbBookings(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch real bookings from backend:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchBookings();
    return () => { isMounted = false; };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'CONFIRMED & ESCROW LOCKED', cls: 'bg-[#E3F2FD] border-[#90CAF9] text-[#0D47A1]' };
      case 'IN_PROGRESS':
        return { label: 'EVENT IN PROGRESS', cls: 'bg-amber-50 border-amber-300 text-amber-700 animate-pulse' };
      case 'COMPLETED':
        return { label: 'COMPLETED & ESCROW RELEASED', cls: 'bg-[#10B981]/15 border-[#10B981] text-[#047857]' };
      case 'PENDING_PAYMENT':
        return { label: 'AWAITING ADVANCE', cls: 'bg-yellow-50 border-yellow-300 text-yellow-800' };
      default:
        return { label: status, cls: 'bg-slate-50 border-slate-200 text-slate-700' };
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white">
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="font-sora font-extrabold text-lg text-[#172033]">My Event Bookings</h2>
          <p className="font-sora text-xs text-[#64748B]">Track active culinary reservations &amp; past feasts</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Real Database Bookings */}
        {dbBookings.map((b) => {
          const badge = getStatusBadge(b.status);
          return (
            <div key={b.id} className="p-4 rounded-2xl bg-white border border-[#2196F3] shadow-card flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-sora text-xs font-bold text-[#0D47A1]">
                  Ref: {b.bookingReference}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full border font-sora text-[10px] font-bold ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-[#E5E7EB]">
                <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-[#90CAF9] flex-shrink-0">
                  <img src={ASSETS.chefRaghavendraStudio} alt="Provider" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-sora font-bold text-sm text-[#172033]">
                    {b.providerName || 'Chef Raghavendra Rao'}
                  </h4>
                  <p className="font-sora text-xs text-[#2196F3] font-semibold">{b.eventType || 'Family Feast'}</p>
                  <p className="font-sora text-[11px] text-[#64748B]">
                    {b.eventDate} • {b.timeSlot || 'Lunch'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#f1f3ff] text-xs font-sora flex items-center justify-between">
                <div>
                  <span className="text-[#64748B] block text-[10px]">Total Booking:</span>
                  <span className="font-bold text-[#172033]">₹{Number(b.totalAmount || 11000).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">Advance Paid:</span>
                  <span className="font-bold text-[#10B981]">₹{Number(b.advanceAmount || 3300).toLocaleString('en-IN')} (Escrow)</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">Guest Count:</span>
                  <span className="font-bold text-[#172033]">{b.guestCount || 25} Guests</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => navigate(`/tracking/${b.id}`)}
                  className="flex-1 py-2.5 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">location_searching</span>
                  <span>Live Event Tracking</span>
                </button>
                {b.status === 'COMPLETED' ? (
                  <button
                    onClick={() => navigate(`/review/${b.id}`)}
                    className="px-4 py-2.5 bg-[#10B981] hover:bg-[#047857] text-white rounded-full font-sora text-xs font-bold active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">star</span>
                    <span>Review</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/provider/chat')}
                    className="px-4 py-2.5 bg-white border border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD] rounded-full font-sora text-xs font-semibold active:scale-95 transition-all"
                  >
                    Chat
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Client Draft / Active Store Booking Card if not in DB */}
        {dbBookings.length === 0 && (
          <div className="p-4 rounded-2xl bg-white border border-[#2196F3] shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-sora text-xs font-bold text-[#0D47A1]">
                Ref: {activeBooking.bookingReference}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1] font-sora text-[10px] font-bold animate-pulse">
                CONFIRMED &amp; ESCROW LOCKED
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-[#E5E7EB]">
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-[#90CAF9] flex-shrink-0">
                <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-sora font-bold text-sm text-[#172033]">{provider.name}</h4>
                <p className="font-sora text-xs text-[#2196F3] font-semibold">{step1Requirements.eventType}</p>
                <p className="font-sora text-[11px] text-[#64748B]">
                  {step1Requirements.eventDate} • {step1Requirements.timeSlot}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#f1f3ff] text-xs font-sora flex items-center justify-between">
              <div>
                <span className="text-[#64748B] block text-[10px]">Total Booking:</span>
                <span className="font-bold text-[#172033]">₹{quotation.totalPayable.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Advance Paid:</span>
                <span className="font-bold text-[#10B981]">₹{quotation.advancePayable.toLocaleString('en-IN')} (Escrow)</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Guest Count:</span>
                <span className="font-bold text-[#172033]">{step1Requirements.guestCount} Guests</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => navigate(`/tracking/${activeBooking.bookingId}`)}
                className="flex-1 py-2.5 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">location_searching</span>
                <span>Live Event Tracking</span>
              </button>
              <button
                onClick={() => navigate('/provider/chat')}
                className="px-4 py-2.5 bg-white border border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD] rounded-full font-sora text-xs font-semibold active:scale-95 transition-all"
              >
                Chat
              </button>
            </div>
          </div>
        )}

        {/* Past Completed Booking Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-3 opacity-90">
          <div className="flex items-center justify-between">
            <span className="font-sora text-xs font-bold text-[#64748B]">Ref: #BMC-7819-HYD</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-sora text-[10px] font-bold">
              COMPLETED
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-[#E5E7EB]">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-[#E5E7EB] flex-shrink-0">
              <img src={ASSETS.chefFemaleMaharashtrian} alt="Chef Anupama" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="font-sora font-bold text-sm text-[#172033]">Chef Anupama Joshi</h4>
              <p className="font-sora text-xs text-[#64748B]">Bespoke Maharashtrian Thali • 15 Guests</p>
              <span className="font-sora text-[10px] text-[#64748B]">Delivered on 14 Oct 2026</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-1 text-xs font-sora font-bold text-[#FFB300]">
              <span className="material-symbols-outlined text-[16px] fill-1">star</span>
              <span>5.0 Rated by Host</span>
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="px-3.5 py-1.5 bg-[#f1f3ff] text-[#0D47A1] rounded-full font-sora text-xs font-semibold hover:bg-[#E3F2FD] transition-colors"
            >
              Book Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
