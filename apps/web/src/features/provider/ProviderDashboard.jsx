import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProviderStore } from '../../stores/useProviderStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { ASSETS } from '../../assets/assetCatalog';
import apiClient from '../../lib/apiClient';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { metrics, leads, acceptLead } = useProviderStore();
  const [actionNotice, setActionNotice] = useState(null);
  const [dbBookings, setDbBookings] = useState([]);

  // Fetch real PostgreSQL bookings for this provider
  useEffect(() => {
    async function fetchProviderBookings() {
      if (!user?.id) return;
      try {
        const res = await apiClient.get(`/api/v1/bookings/provider/${user.id}`);
        if (Array.isArray(res.data)) {
          setDbBookings(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch provider bookings from PostgreSQL, using mock leads:', err);
      }
    }
    fetchProviderBookings();
  }, [user?.id]);

  const handleAcceptLead = async (lead) => {
    // If backend ID exists, sync status update with PostgreSQL
    if (lead.dbId) {
      try {
        await apiClient.put(`/api/v1/bookings/${lead.dbId}/status?status=CONFIRMED`);
      } catch (e) {
        console.warn('PostgreSQL lead status update fallback:', e);
      }
    }
    acceptLead(lead.id);
    setActionNotice(`Lead for ${lead.hostName} accepted! Slot locked in your Atelier calendar.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Map real database bookings into leads if available
  const leadsToDisplay = dbBookings.length > 0
    ? dbBookings.map((b) => ({
        id: b.id,
        dbId: b.id,
        eventType: b.eventType,
        hostName: b.customerName || 'Host',
        estimatedAmount: Number(b.totalAmount || 0),
        eventDate: b.eventDate,
        timeSlot: b.timeSlot,
        guestCount: b.guestCount,
        cuisine: b.serviceType || 'Standard',
        deliveryMode: 'On-Site Live Counter',
      }))
    : (leads || []);

  const activeEventToday = dbBookings.find(b => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS');

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white font-sora">
      {/* Top Greeting & Verification Banner */}
      <div className="py-2 flex items-center justify-between border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-md overflow-hidden ring-1 ring-[#CBD5E1] shrink-0">
            <img src={ASSETS.chefRaghavendraStudio} alt="Chef Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[#0D47A1] text-[15px] fill-1">verified</span>
              <span className="label-micro text-[#0D47A1]">Atelier Masterchef</span>
            </div>
            <h2 className="heading-4 text-sm">{user?.name || 'Chef Raghavendra Rao'}</h2>
            <span className="body-sm text-xs">{user?.businessName || 'Royal Dakshin Culinary Studio'}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/provider/calendar')}
          className="btn-secondary py-1.5 px-3 text-xs font-bold shadow-xs flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[15px]">event</span>
          <span>Calendar</span>
        </button>
      </div>

      {/* 4 Metric Cards (Sharp Geometry: rounded-lg card-sharp) */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        {/* Metric 1: Monthly Earnings */}
        <div 
          onClick={() => navigate('/provider/wallet')}
          className="card-sharp p-3.5 flex flex-col justify-between cursor-pointer hover:border-[#90CAF9] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-md bg-[#E3F2FD] text-[#2196F3] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </span>
            <span className="text-[10px] font-sora font-bold text-[#059669]">+18% MoM</span>
          </div>
          <div className="mt-2">
            <span className="font-sora font-extrabold text-lg text-[#172033]">
              ₹{metrics.monthlyEarnings.toLocaleString('en-IN')}
            </span>
            <span className="font-inter text-[10px] text-[#64748B] block">Gross Monthly Earnings</span>
          </div>
        </div>

        {/* Metric 2: Pending Leads */}
        <div 
          onClick={() => navigate('/provider/alerts')}
          className="card-sharp p-3.5 flex flex-col justify-between cursor-pointer hover:border-[#90CAF9] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-md bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping"></span>
          </div>
          <div className="mt-2">
            <span className="font-sora font-extrabold text-lg text-[#0D47A1]">
              {metrics.pendingLeadsCount} Leads
            </span>
            <span className="font-inter text-[10px] text-[#64748B] block">Pending Response</span>
          </div>
        </div>

        {/* Metric 3: Confirmed Events */}
        <div 
          onClick={() => navigate('/provider/bookings')}
          className="card-sharp p-3.5 flex flex-col justify-between cursor-pointer hover:border-[#90CAF9] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-md bg-[#F8FAFC] text-[#2196F3] flex items-center justify-center border border-[#E5E7EB]">
              <span className="material-symbols-outlined text-[18px]">event_available</span>
            </span>
            <span className="text-[10px] font-sora font-bold text-[#2196F3]">This Month</span>
          </div>
          <div className="mt-2">
            <span className="font-sora font-extrabold text-lg text-[#172033]">
              {metrics.confirmedEventsCount} Feasts
            </span>
            <span className="font-inter text-[10px] text-[#64748B] block">Confirmed Events</span>
          </div>
        </div>

        {/* Metric 4: Host Rating */}
        <div 
          onClick={() => navigate('/provider/profile')}
          className="card-sharp p-3.5 flex flex-col justify-between cursor-pointer hover:border-[#90CAF9] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <span className="material-symbols-outlined text-[18px] fill-1">star</span>
            </span>
            <span className="text-[10px] font-sora font-bold text-[#172033]">1,240 Rev</span>
          </div>
          <div className="mt-2">
            <span className="font-sora font-extrabold text-lg text-[#172033]">
              {metrics.hostRating}
            </span>
            <span className="font-inter text-[10px] text-[#64748B] block">Hospitality Rating</span>
          </div>
        </div>
      </section>

      {actionNotice && (
        <div className="mt-4 p-3.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 font-sora text-xs font-bold animate-in fade-in">
          {actionNotice}
        </div>
      )}

      {/* Live Event Today Quick Trigger (Sharp Geometry) */}
      <section className="mt-4">
        {activeEventToday ? (
          <div className="p-4 rounded-lg bg-[#0D47A1] text-white shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <span className="font-sora text-[10px] font-bold text-[#90CAF9] uppercase tracking-wider">
                  Event Active Today
                </span>
              </div>
              <h4 className="heading-4 text-white text-sm mt-1">
                {activeEventToday.eventType} • {activeEventToday.customerName || 'Host'}
              </h4>
              <p className="font-inter text-xs text-[#E3F2FD] mt-0.5">
                {activeEventToday.serviceCity || 'Hyderabad'} • {activeEventToday.guestCount} Guests ({activeEventToday.timeSlot})
              </p>
            </div>
            <button
              onClick={() => navigate(`/provider/event-day?bookingId=${activeEventToday.id}`)}
              className="px-4 py-2 bg-white text-[#0D47A1] rounded-md font-sora text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 shrink-0"
            >
              <span>Live Checklist</span>
              <span className="material-symbols-outlined text-[16px]">checklist</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] shadow-xs flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">event_busy</span>
              </div>
              <div>
                <h4 className="font-sora font-bold text-xs text-[#172033]">No Feasts Scheduled for Today</h4>
                <p className="font-inter text-[11px] text-[#64748B] mt-0.5">
                  Your kitchen schedule is clear today. View your calendar for upcoming dates.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/provider/calendar')}
              className="btn-ghost py-1.5 px-3 text-xs font-bold text-[#0D47A1] shrink-0"
            >
              Calendar
            </button>
          </div>
        )}
      </section>

      {/* Incoming Booking Requests (Sharp Geometry) */}
      <section className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="heading-4 text-[#172033]">Incoming Event Leads</h3>
          <span className="text-xs font-sora font-semibold text-[#2196F3]">{leadsToDisplay.length} Active</span>
        </div>

        {leadsToDisplay.length > 0 ? (
          leadsToDisplay.map((lead) => (
            <div
              key={lead.id}
              className="card-sharp p-4 flex flex-col gap-3 hover:border-[#90CAF9] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="label-micro text-[#2196F3]">
                    {lead.eventType}
                  </span>
                  <h4 className="heading-4 text-sm mt-0.5 text-[#172033]">{lead.hostName}</h4>
                </div>
                <div className="text-right">
                  <span className="font-sora font-extrabold text-base text-[#0D47A1]">
                    ₹{lead.estimatedAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="block font-inter text-[10px] text-[#64748B]">Est. Total</span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E5E7EB] grid grid-cols-2 gap-2 text-xs font-inter">
                <div>
                  <span className="text-[#64748B] block text-[10px]">Date &amp; Time:</span>
                  <span className="font-semibold text-[#172033]">{lead.eventDate} • {lead.timeSlot}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">Guest Count:</span>
                  <span className="font-semibold text-[#172033]">{lead.guestCount} Guests</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#64748B] block text-[10px]">Cuisine &amp; Mode:</span>
                  <span className="font-semibold text-[#172033]">{lead.cuisine} ({lead.deliveryMode})</span>
                </div>
              </div>

              {/* Actions: Accept, Custom Quote, Decline */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleAcceptLead(lead)}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold shadow-xs flex items-center justify-center gap-1"
                >
                  <span>Accept &amp; Lock Slot</span>
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </button>
                <button
                  onClick={() => navigate('/provider/chat')}
                  className="btn-secondary px-3.5 py-2.5 text-xs font-semibold"
                >
                  Custom Quote
                </button>
              </div>
            </div>
          ))
        ) : (
          /* Real Production Empty State for Provider Leads */
          <div className="p-6 rounded-lg card-sharp border-[#CBD5E1] bg-white flex flex-col items-center text-center my-2">
            <div className="w-12 h-12 rounded-lg bg-[#E3F2FD] border border-[#90CAF9] flex items-center justify-center text-[#0D47A1] mb-3">
              <span className="material-symbols-outlined text-[24px]">inbox</span>
            </div>
            <h4 className="font-sora font-bold text-sm text-[#172033]">No Pending Event Leads</h4>
            <p className="font-inter text-xs text-[#64748B] max-w-sm mt-1 leading-relaxed">
              You currently have no unresponded host requests. As hosts in your service areas search for chefs and caterers, new booking leads will appear here in real-time.
            </p>
            <button
              onClick={() => navigate('/provider/calendar')}
              className="btn-secondary py-2 px-4 text-xs mt-4 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Manage Availability Calendar</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
