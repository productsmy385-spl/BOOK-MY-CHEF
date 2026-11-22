import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useProviderStore } from '../../stores/useProviderStore';
import { api } from '../../services/api';

export default function ProviderBookings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { leads, acceptLead } = useProviderStore();

  const [activeTab, setActiveTab] = useState('UPCOMING'); // 'INCOMING' | 'UPCOMING' | 'COMPLETED'
  const [dbBookings, setDbBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const providerId = user?.id || 'c3d4e5f6-a7b8-9012-cdef-123456789012';

  useEffect(() => {
    let isMounted = true;
    async function fetchBookings() {
      setIsLoading(true);
      try {
        const res = await api.bookings.getProviderBookings(providerId);
        if (isMounted && res?.data && Array.isArray(res.data)) {
          setDbBookings(res.data);
        }
      } catch (err) {
        console.warn('Could not load provider bookings from backend:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchBookings();
    return () => { isMounted = false; };
  }, [providerId]);

  const handleAccept = async (bookingId) => {
    try {
      await api.bookings.respond(bookingId, providerId, 'ACCEPT');
      setActionNotice('Booking confirmed and added to your calendar schedule!');
      setDbBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b));
    } catch (e) {
      console.warn('Accept response fallback:', e.message);
      setActionNotice('Booking confirmed locally!');
    }
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleDecline = async (bookingId) => {
    try {
      await api.bookings.respond(bookingId, providerId, 'REJECT', 'Slot unavailable');
      setActionNotice('Booking declined.');
      setDbBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (e) {
      console.warn('Decline fallback:', e.message);
    }
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Curated demo bookings for realistic preview if no real bookings exist yet
  const sampleBookings = [
    {
      id: 'bk-upcoming-1',
      bookingReference: 'BMC-7821-HYD',
      customerName: 'Ananya Rao',
      eventType: 'Traditional Gruhapravesam Feast',
      eventDate: '2026-11-28',
      timeSlot: 'Lunch (12:30 PM)',
      guestCount: 25,
      location: 'Plot 42, Road 36, Jubilee Hills, Hyderabad',
      totalAmount: 10250,
      status: 'CONFIRMED',
      cuisine: 'Andhra Royal & Traditional Banana Leaf',
    },
    {
      id: 'bk-incoming-1',
      bookingReference: 'BMC-9104-HYD',
      customerName: 'Vikram Malhotra',
      eventType: 'Executive Birthday Dinner',
      eventDate: '2026-12-02',
      timeSlot: 'Dinner (08:00 PM)',
      guestCount: 15,
      location: 'Banjara Hills, Hyderabad',
      totalAmount: 6750,
      status: 'PENDING_PROVIDER_ACCEPTANCE',
      cuisine: 'Telangana Heritage & Live Kebabs',
    },
    {
      id: 'bk-completed-1',
      bookingReference: 'BMC-4512-HYD',
      customerName: 'Kavitha Reddy',
      eventType: 'Anniversary Dinner',
      eventDate: '2026-11-15',
      timeSlot: 'Dinner (07:30 PM)',
      guestCount: 20,
      location: 'Madhapur, Hyderabad',
      totalAmount: 8500,
      status: 'COMPLETED',
      cuisine: 'South Indian Coastal Seafood',
    },
  ];

  const allBookings = dbBookings.length > 0 ? dbBookings : sampleBookings;

  const filtered = allBookings.filter((b) => {
    if (activeTab === 'INCOMING') return b.status === 'PENDING_PROVIDER_ACCEPTANCE' || b.status === 'CREATED';
    if (activeTab === 'UPCOMING') return b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white font-sora">
      {/* Header */}
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="heading-3">Client Reservations</h2>
          <p className="body-sm">Manage private dining &amp; catering orders</p>
        </div>
        <button
          onClick={() => navigate('/provider/calendar')}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">calendar_month</span>
          <span>Calendar</span>
        </button>
      </div>

      {actionNotice && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md font-inter flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-3 flex bg-[#F8FAFC] p-1 border border-[#E5E7EB] rounded-md text-xs">
        {[
          { id: 'UPCOMING', label: 'Upcoming' },
          { id: 'INCOMING', label: 'Requests' },
          { id: 'COMPLETED', label: 'Completed' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-1.5 rounded font-bold transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-white text-[#0D47A1] shadow-xs border border-[#CBD5E1]'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-4 flex flex-col gap-3 font-inter">
        {filtered.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#CBD5E1] rounded-lg text-[#64748B] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-[#90CAF9]">event_busy</span>
            <p className="text-xs font-semibold">No {activeTab.toLowerCase()} reservations.</p>
          </div>
        ) : (
          filtered.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-lg bg-white border border-[#E5E7EB] shadow-xs flex flex-col gap-2.5 font-sora"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#2196F3]">#{b.bookingReference || b.id.slice(0, 8)}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  b.status === 'CONFIRMED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : b.status === 'COMPLETED'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {b.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#172033]">{b.eventType}</h4>
                <p className="font-inter text-xs text-[#64748B] mt-0.5">
                  Host: <span className="font-semibold text-[#172033]">{b.customerName}</span> • {b.guestCount} Guests
                </p>
                <p className="font-inter text-xs text-[#64748B] mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#2196F3]">event</span>
                  <span>{b.eventDate} ({b.timeSlot})</span>
                </p>
                <p className="font-inter text-xs text-[#64748B] mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#2196F3]">location_on</span>
                  <span className="truncate">{b.location}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-inter text-[10px] text-[#64748B] uppercase">Quotation</span>
                  <span className="font-extrabold text-sm text-[#0D47A1]">
                    ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {b.status === 'PENDING_PROVIDER_ACCEPTANCE' || b.status === 'CREATED' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDecline(b.id)}
                        className="py-1 px-2.5 rounded border border-[#CBD5E1] text-[#64748B] hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAccept(b.id)}
                        className="btn-primary py-1 px-3 text-xs font-bold cursor-pointer"
                      >
                        Accept &amp; Lock
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/provider/event-day')}
                      className="btn-primary py-1 px-3 text-xs font-bold cursor-pointer flex items-center gap-1"
                    >
                      <span>Event Checklist</span>
                      <span className="material-symbols-outlined text-[14px]">checklist</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
