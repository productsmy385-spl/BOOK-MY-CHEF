import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../stores/useBookingStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { ASSETS } from '../../assets/assetCatalog';
import apiClient from '../../lib/apiClient';

export default function CustomerBookings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { booking: activeBooking, step1Requirements, quotation, provider } = useBookingStore();
  const [dbBookings, setDbBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch real persistent bookings from PostgreSQL backend
  useEffect(() => {
    async function loadBookings() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/v1/bookings/customer/${user.id}`);
        if (Array.isArray(res.data)) {
          setDbBookings(res.data);
        }
      } catch (err) {
        console.warn('Could not load PostgreSQL customer bookings, using store fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [user?.id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'CONFIRMED & ESCROW LOCKED', cls: 'bg-[#E3F2FD] border-[#90CAF9] text-[#0D47A1]' };
      case 'IN_PROGRESS':
        return { label: 'CHEF AT WORK', cls: 'bg-amber-50 border-amber-300 text-amber-800' };
      case 'COMPLETED':
        return { label: 'COMPLETED', cls: 'bg-emerald-50 border-emerald-300 text-emerald-800' };
      case 'CANCELLED':
        return { label: 'CANCELLED', cls: 'bg-red-50 border-red-300 text-red-800' };
      default:
        return { label: status || 'PENDING', cls: 'bg-slate-100 border-slate-300 text-slate-800' };
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white font-sora">
      {/* Header */}
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="heading-3">My Event Bookings</h2>
          <p className="body-sm">Track active culinary reservations &amp; past feasts</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Real Database Bookings */}
        {dbBookings.map((b) => {
          const badge = getStatusBadge(b.status);
          return (
            <div key={b.id} className="card-sharp p-4 flex flex-col gap-3 border-[#2196F3]/40">
              <div className="flex items-center justify-between">
                <span className="font-sora text-xs font-bold text-[#0D47A1]">
                  Ref: {b.bookingReference}
                </span>
                <span className={`badge-sharp border ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-[#E5E7EB]">
                <div className="w-14 h-14 rounded-md overflow-hidden ring-1 ring-[#CBD5E1] shrink-0">
                  <img src={ASSETS.chefRaghavendraStudio} alt="Provider" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="heading-4 text-sm truncate">
                    {b.providerName || 'Chef Raghavendra Rao'}
                  </h4>
                  <p className="font-sora text-xs text-[#2196F3] font-semibold">{b.eventType || 'Family Feast'}</p>
                  <p className="font-inter text-xs text-[#64748B]">
                    {b.eventDate} • {b.timeSlot || 'Lunch'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-sora flex items-center justify-between">
                <div>
                  <span className="text-[#64748B] block text-[10px] font-inter">Total Booking:</span>
                  <span className="font-bold text-[#172033]">₹{Number(b.totalAmount || 11000).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] font-inter">Advance Paid:</span>
                  <span className="font-bold text-[#059669]">₹{Number(b.advanceAmount || 3300).toLocaleString('en-IN')} (Escrow)</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] font-inter">Guest Count:</span>
                  <span className="font-bold text-[#172033]">{b.guestCount || 25} Guests</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => navigate(`/tracking/${b.id}`)}
                  className="btn-primary flex-1 py-2.5 text-xs shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">location_searching</span>
                  <span>Live Event Tracking</span>
                </button>
                {b.status === 'COMPLETED' ? (
                  <button
                    onClick={() => navigate(`/review/${b.id}`)}
                    className="px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-md font-sora text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">star</span>
                    <span>Review</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/provider/chat')}
                    className="btn-secondary px-4 py-2.5 text-xs font-semibold"
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
          <div className="card-sharp p-4 flex flex-col gap-3 border-[#2196F3]/40">
            <div className="flex items-center justify-between">
              <span className="font-sora text-xs font-bold text-[#0D47A1]">
                Ref: {activeBooking.bookingReference}
              </span>
              <span className="badge-sharp bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1] animate-pulse">
                CONFIRMED &amp; ESCROW LOCKED
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-[#E5E7EB]">
              <div className="w-14 h-14 rounded-md overflow-hidden ring-1 ring-[#CBD5E1] shrink-0">
                <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="heading-4 text-sm truncate">{provider.name}</h4>
                <p className="font-sora text-xs text-[#2196F3] font-semibold">{step1Requirements.eventType}</p>
                <p className="font-inter text-xs text-[#64748B]">
                  {step1Requirements.eventDate} • {step1Requirements.timeSlot}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-sora flex items-center justify-between">
              <div>
                <span className="text-[#64748B] block text-[10px] font-inter">Total Booking:</span>
                <span className="font-bold text-[#172033]">₹{quotation.totalPayable.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] font-inter">Advance Paid:</span>
                <span className="font-bold text-[#059669]">₹{quotation.advancePayable.toLocaleString('en-IN')} (Escrow)</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] font-inter">Guest Count:</span>
                <span className="font-bold text-[#172033]">{step1Requirements.guestCount} Guests</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => navigate(`/tracking/${activeBooking.bookingId}`)}
                className="btn-primary flex-1 py-2.5 text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">location_searching</span>
                <span>Live Event Tracking</span>
              </button>
              <button
                onClick={() => navigate('/provider/chat')}
                className="btn-secondary px-4 py-2.5 text-xs font-semibold"
              >
                Chat
              </button>
            </div>
          </div>
        )}

        {/* Past Completed Booking Card */}
        <div className="card-sharp p-4 flex flex-col gap-3 opacity-95">
          <div className="flex items-center justify-between">
            <span className="font-sora text-xs font-bold text-[#64748B]">Ref: #BMC-7819-HYD</span>
            <span className="badge-sharp bg-emerald-50 border border-emerald-300 text-emerald-800">
              COMPLETED
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-[#E5E7EB]">
            <div className="w-12 h-12 rounded-md overflow-hidden ring-1 ring-[#CBD5E1] shrink-0">
              <img src={ASSETS.chefFemaleMaharashtrian} alt="Chef Anupama" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="heading-4 text-sm truncate">Chef Anupama Joshi</h4>
              <p className="font-inter text-xs text-[#64748B]">Bespoke Maharashtrian Thali • 15 Guests</p>
              <span className="font-inter text-[11px] text-[#94A3B8] block mt-0.5">Delivered on 14 Oct 2026</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-1 text-xs font-sora font-bold text-[#D97706]">
              <span className="material-symbols-outlined text-[16px] fill-1">star</span>
              <span>5.0 Rated by Host</span>
            </div>
            <button
              onClick={() => navigate('/explore')}
              className="btn-ghost px-3.5 py-1.5 text-xs font-semibold text-[#0D47A1]"
            >
              Book Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
