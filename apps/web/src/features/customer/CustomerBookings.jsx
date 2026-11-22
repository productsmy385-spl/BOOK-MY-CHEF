import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../stores/useBookingStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { ASSETS } from '../../assets/assetCatalog';
import apiClient from '../../lib/apiClient';

export default function CustomerBookings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeBooking, step1Requirements, quotation, provider } = useBookingStore();
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

        {/* Real Dynamic Booking Card from current session if created and not yet re-fetched from DB */}
        {activeBooking && activeBooking.bookingReference && dbBookings.length === 0 && (
          <div className="card-sharp p-4 flex flex-col gap-3 border-[#2196F3]/40">
            <div className="flex items-center justify-between">
              <span className="font-sora text-xs font-bold text-[#0D47A1]">
                Ref: {activeBooking.bookingReference}
              </span>
              <span className="badge-sharp bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1] animate-pulse">
                {activeBooking.status || 'CONFIRMED & ESCROW LOCKED'}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-[#E5E7EB]">
              <div className="w-14 h-14 rounded-md overflow-hidden ring-1 ring-[#CBD5E1] shrink-0">
                <img src={provider?.avatar || ASSETS.chefRaghavendraStudio} alt={provider?.name || 'Chef'} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="heading-4 text-sm truncate">{provider?.name || 'Atelier Masterchef'}</h4>
                <p className="font-sora text-xs text-[#2196F3] font-semibold">{step1Requirements?.eventType || 'Celebration Feast'}</p>
                <p className="font-inter text-xs text-[#64748B]">
                  {step1Requirements?.eventDate || 'Scheduled Date'} • {step1Requirements?.timeSlot || 'Lunch'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-sora flex items-center justify-between">
              <div>
                <span className="text-[#64748B] block text-[10px] font-inter">Total Booking:</span>
                <span className="font-bold text-[#172033]">₹{(activeBooking.totalAmount || quotation?.totalPayable || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] font-inter">Advance Paid:</span>
                <span className="font-bold text-[#059669]">₹{(activeBooking.paidAdvance || quotation?.advancePayable || 0).toLocaleString('en-IN')} (Escrow)</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] font-inter">Guest Count:</span>
                <span className="font-bold text-[#172033]">{step1Requirements?.guestCount || 15} Guests</span>
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

        {/* Real Production Empty State: Displayed when customer has 0 bookings */}
        {dbBookings.length === 0 && !activeBooking && !loading && (
          <div className="p-8 rounded-lg card-sharp border-[#CBD5E1] bg-white flex flex-col items-center text-center my-6">
            <div className="w-16 h-16 rounded-lg bg-[#E3F2FD] border border-[#90CAF9] flex items-center justify-center text-[#2196F3] mb-4 shadow-xs">
              <span className="material-symbols-outlined text-[32px]">event_available</span>
            </div>
            <h3 className="heading-3 text-base text-[#172033]">No Event Bookings Yet</h3>
            <p className="body-sm text-xs text-[#64748B] max-w-sm mt-1 leading-relaxed">
              You haven't scheduled any private chefs, caterers, or event artisans yet. Discover verified culinary masters to craft a personalized feast for your celebration.
            </p>

            <button
              onClick={() => navigate('/customer/home')}
              className="btn-primary py-3 px-6 text-xs mt-5 shadow-xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
              <span>Explore Chefs &amp; Caterers</span>
            </button>

            {/* Platform Guarantees */}
            <div className="mt-8 pt-6 border-t border-[#E5E7EB] w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#F8FAFC] border border-[#E5E7EB]">
                <span className="material-symbols-outlined text-[#059669] text-[18px] shrink-0 mt-0.5">verified_user</span>
                <div>
                  <h5 className="font-sora font-bold text-[11px] text-[#172033]">Escrow Protected</h5>
                  <p className="font-inter text-[10px] text-[#64748B] mt-0.5 leading-tight">Payment released only after feast completion</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#F8FAFC] border border-[#E5E7EB]">
                <span className="material-symbols-outlined text-[#2196F3] text-[18px] shrink-0 mt-0.5">health_and_safety</span>
                <div>
                  <h5 className="font-sora font-bold text-[11px] text-[#172033]">FSSAI Certified</h5>
                  <p className="font-inter text-[10px] text-[#64748B] mt-0.5 leading-tight">Rigorous kitchen hygiene and food safety pledge</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-[#F8FAFC] border border-[#E5E7EB]">
                <span className="material-symbols-outlined text-[#0D47A1] text-[18px] shrink-0 mt-0.5">soup_kitchen</span>
                <div>
                  <h5 className="font-sora font-bold text-[11px] text-[#172033]">Custom Menus</h5>
                  <p className="font-inter text-[10px] text-[#64748B] mt-0.5 leading-tight">Bespoke regional cuisines tailored to your guests</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
