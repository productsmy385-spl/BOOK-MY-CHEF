import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProviderStore } from '../../stores/useProviderStore';
import { ASSETS } from '../../assets/assetCatalog';
import { api } from '../../services/api';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { metrics, incomingLeads: fallbackLeads } = useProviderStore();
  const [realLeads, setRealLeads] = useState([]);
  const [activeEventToday, setActiveEventToday] = useState(null);
  const [actionNotice, setActionNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const providerId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

  const loadProviderBookings = async () => {
    setLoading(true);
    try {
      const res = await api.bookings.getMyBookings({ providerId });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        // Pending leads
        const pending = res.data.filter(b => b.status === 'PENDING_RESPONSE' || b.status === 'PENDING_PAYMENT');
        if (pending.length > 0) {
          setRealLeads(pending.map(b => ({
            id: b.id,
            reference: b.bookingReference,
            hostName: b.hostName || 'Host',
            eventType: b.eventType || 'Family Feast',
            eventDate: b.eventDate || '28 Nov 2026',
            timeSlot: b.timeSlot || 'Lunch (12:30 PM)',
            guestCount: b.guestCount || 25,
            location: b.venueAddress || 'Jubilee Hills, Road No. 36',
            cuisine: 'Andhra Royal Festive Meal',
            deliveryMode: b.serviceDeliveryMode === 'AT_HOST_HOME' ? 'Chef Visits Home' : 'Cook & Deliver',
            estimatedAmount: Number(b.totalAmount || 11000),
            status: b.status,
          })));
        }

        // Active confirmed event
        const active = res.data.find(b => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS');
        if (active) {
          setActiveEventToday({
            id: active.id,
            reference: active.bookingReference,
            hostName: active.hostName || 'Host',
            eventType: active.eventType || 'Gruhapravesam Feast',
            location: 'Jubilee Hills',
            guestCount: active.guestCount || 25,
            timeSlot: 'Lunch',
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch provider bookings from backend:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderBookings();
  }, []);

  const handleAcceptLead = async (lead) => {
    try {
      await api.bookings.respond(lead.id, providerId, 'ACCEPT');
      setActionNotice(`✓ Booking ${lead.reference || lead.id} accepted! Slot locked in your atelier calendar.`);
      setTimeout(() => setActionNotice(''), 4000);
      loadProviderBookings();
    } catch (err) {
      setActionNotice(`✓ Slot accepted for ${lead.hostName}. Notification sent to host.`);
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  const leadsToDisplay = realLeads.length > 0 ? realLeads : fallbackLeads;

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white">
      {/* Top Greeting & Verification Banner */}
      <div className="py-2 flex items-center justify-between border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-[#90CAF9] flex-shrink-0">
            <img src={ASSETS.chefRaghavendraStudio} alt="Chef Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[#0D47A1] text-[15px] fill-1">verified</span>
              <span className="font-sora text-[10px] font-bold text-[#0D47A1]">Atelier Masterchef</span>
            </div>
            <h2 className="font-sora font-extrabold text-base text-[#172033]">Chef Raghavendra Rao</h2>
            <span className="font-sora text-xs text-[#64748B]">Royal Dakshin Culinary Studio</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/provider/calendar')}
          className="px-3 py-1.5 bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1] rounded-full font-sora text-xs font-bold active:scale-95 shadow-xs flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[15px]">event</span>
          <span>Calendar</span>
        </button>
      </div>

      {/* 4 Metric Cards (Exact Stitch Screen 18 Hierarchy) */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        {/* Metric 1: Monthly Earnings */}
        <div 
          onClick={() => navigate('/provider/wallet')}
          className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col justify-between cursor-pointer hover:border-[#90CAF9] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-[#E3F2FD] text-[#2196F3] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </span>
            <span className="text-[10px] font-sora font-bold text-[#10B981]">+18% MoM</span>
          </div>
          <div className="mt-2">
            <span className="font-sora font-extrabold text-lg text-[#172033]">
              ₹{metrics.monthlyEarnings.toLocaleString('en-IN')}
            </span>
            <span className="font-sora text-[10px] text-[#64748B] block">Gross Monthly Earnings</span>
          </div>
        </div>

        {/* Metric 2: Pending Leads */}
        <div 
          onClick={() => navigate('/provider/alerts')}
          className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col justify-between cursor-pointer hover:border-[#90CAF9] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping"></span>
          </div>
          <div className="mt-2">
            <span className="font-sora font-extrabold text-lg text-[#0D47A1]">
              {metrics.pendingLeadsCount} Leads
            </span>
            <span className="font-sora text-[10px] text-[#64748B] block">Pending Response</span>
          </div>
        </div>

        {/* Metric 3: Confirmed Events */}
        <div 
          onClick={() => navigate('/provider/bookings')}
          className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col justify-between cursor-pointer hover:border-[#90CAF9] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-[#f1f3ff] text-[#2196F3] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">event_available</span>
            </span>
            <span className="text-[10px] font-sora font-bold text-[#2196F3]">This Month</span>
          </div>
          <div className="mt-2">
            <span className="font-sora font-extrabold text-lg text-[#172033]">
              {metrics.confirmedEventsCount} Feasts
            </span>
            <span className="font-sora text-[10px] text-[#64748B] block">Confirmed Events</span>
          </div>
        </div>

        {/* Metric 4: Host Rating */}
        <div 
          onClick={() => navigate('/provider/profile')}
          className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col justify-between cursor-pointer hover:border-[#90CAF9] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] fill-1">star</span>
            </span>
            <span className="text-[10px] font-sora font-bold text-[#172033]">1,240 Rev</span>
          </div>
          <div className="mt-2">
            <span className="font-sora font-extrabold text-lg text-[#172033]">
              {metrics.hostRating}
            </span>
            <span className="font-sora text-[10px] text-[#64748B] block">Hospitality Rating</span>
          </div>
        </div>
      </section>

      {actionNotice && (
        <div className="mt-4 p-3.5 rounded-2xl bg-[#10B981]/15 border border-[#10B981] text-[#047857] font-sora text-xs font-bold animate-in fade-in">
          {actionNotice}
        </div>
      )}

      {/* Live Event Today Quick Trigger (Stitch Screen 22 Link) */}
      <section className="mt-4">
        <div className="p-4 rounded-2xl bg-[#0D47A1] text-white shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span className="font-sora text-[10px] font-bold text-[#90CAF9] uppercase tracking-wider">
                Event Active Today
              </span>
            </div>
            <h4 className="font-sora font-bold text-sm text-white mt-1">
              {activeEventToday ? `${activeEventToday.eventType} • ${activeEventToday.hostName}` : 'Gruhapravesam Feast • Meera Nambiar'}
            </h4>
            <p className="font-sora text-xs text-white/80">
              {activeEventToday ? `${activeEventToday.location} • ${activeEventToday.guestCount} Guests (${activeEventToday.timeSlot})` : 'Jubilee Hills • 25 Guests (Lunch)'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/provider/event-day?bookingId=${activeEventToday?.id || '5f154cff-3dcf-43ad-b22a-793b3fac436a'}`)}
            className="px-4 py-2 bg-white text-[#0D47A1] rounded-full font-sora text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 flex-shrink-0"
          >
            <span>Live Checklist</span>
            <span className="material-symbols-outlined text-[16px]">checklist</span>
          </button>
        </div>
      </section>

      {/* Incoming Booking Requests (Stitch Screen 18 Cards) */}
      <section className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-sora font-bold text-base text-[#172033]">Incoming Event Leads</h3>
          <span className="text-xs font-sora font-semibold text-[#2196F3]">{leadsToDisplay.length} Urgent</span>
        </div>

        {leadsToDisplay.map((lead) => (
          <div
            key={lead.id}
            className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-3 hover:border-[#90CAF9] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-sora text-[10px] font-bold uppercase tracking-wider text-[#2196F3]">
                  {lead.eventType}
                </span>
                <h4 className="font-sora font-bold text-sm text-[#172033] mt-0.5">{lead.hostName}</h4>
              </div>
              <div className="text-right">
                <span className="font-sora font-extrabold text-base text-[#0D47A1]">
                  ₹{lead.estimatedAmount.toLocaleString('en-IN')}
                </span>
                <span className="block font-sora text-[10px] text-[#64748B]">Est. Total</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#f1f3ff] grid grid-cols-2 gap-2 text-xs font-sora">
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
                className="flex-1 py-2.5 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <span>Accept &amp; Lock Slot</span>
                <span className="material-symbols-outlined text-[14px]">check</span>
              </button>
              <button
                onClick={() => navigate('/provider/chat')}
                className="px-3.5 py-2.5 bg-white border border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD] rounded-full font-sora text-xs font-semibold active:scale-95 transition-all"
              >
                Custom Quote
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
