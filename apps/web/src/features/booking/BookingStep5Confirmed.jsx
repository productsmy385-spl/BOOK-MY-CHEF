import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useBookingStore } from '../../stores/useBookingStore';
import { ASSETS } from '../../assets/assetCatalog';

export default function BookingStep5Confirmed() {
  const navigate = useNavigate();
  const { activeBooking, step1Requirements, step2Preferences, provider } = useBookingStore();

  useEffect(() => {
    // Trigger celebratory confetti burst on mount!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2196F3', '#90CAF9', '#0D47A1', '#E3F2FD']
    });
  }, []);

  return (
    <div className="flex flex-col items-center w-full min-h-screen px-4 py-8 pb-24 bg-white text-center">
      {/* Celebration Checkmark Icon */}
      <div className="w-20 h-20 rounded-full bg-[#E3F2FD] border-4 border-[#90CAF9] flex items-center justify-center text-[#2196F3] shadow-lg mb-4 animate-in zoom-in-75 duration-300">
        <span className="material-symbols-outlined text-[44px] font-bold">check_circle</span>
      </div>

      <span className="px-3 py-1 rounded-full bg-[#E3F2FD] text-[#0D47A1] font-sora text-xs font-bold uppercase tracking-wider mb-2">
        Reservation Confirmed
      </span>

      <h1 className="font-sora font-extrabold text-2xl text-[#172033] leading-tight">
        Your Feast is Scheduled!
      </h1>
      <p className="font-sora text-xs text-[#64748B] mt-1 max-w-sm">
        Booking Reference: <strong className="text-[#0D47A1]">{activeBooking.bookingReference}</strong>
      </p>

      {/* Provider Details Card */}
      <div className="w-full max-w-sm mt-6 p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle text-left flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-[#90CAF9] flex-shrink-0">
            <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[#0D47A1] text-[15px] fill-1">verified</span>
              <span className="font-sora text-[10px] font-bold text-[#0D47A1]">Locked Masterchef</span>
            </div>
            <h4 className="font-sora font-bold text-sm text-[#172033]">{provider.name}</h4>
            <p className="font-sora text-xs text-[#64748B]">{provider.cuisines}</p>
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button 
            onClick={() => navigate('/provider/chat')}
            aria-label="Chat with Chef"
            className="w-9 h-9 rounded-full bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center hover:bg-[#90CAF9] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
          </button>
          <a
            href="tel:+919849012345"
            aria-label="Call Chef"
            className="w-9 h-9 rounded-full bg-[#2196F3] text-white flex items-center justify-center hover:bg-[#0D47A1] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
          </a>
        </div>
      </div>

      {/* Event Details Card */}
      <div className="w-full max-w-sm mt-3 p-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] text-left flex flex-col gap-2.5">
        <span className="font-sora font-bold text-xs text-[#0D47A1] uppercase tracking-wider">
          Event Parameters
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs font-sora pt-1 border-t border-[#E5E7EB]">
          <div>
            <span className="text-[#64748B] block text-[10px]">Date &amp; Time:</span>
            <span className="font-semibold text-[#172033]">{step1Requirements.eventDate} • {step1Requirements.timeSlot}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px]">Guests:</span>
            <span className="font-semibold text-[#172033]">{step1Requirements.guestCount} Guests</span>
          </div>
          <div className="col-span-2">
            <span className="text-[#64748B] block text-[10px]">Location:</span>
            <span className="font-semibold text-[#172033]">{step1Requirements.location}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px]">Delivery Mode:</span>
            <span className="font-semibold text-[#172033]">
              {step2Preferences.serviceMode === 'CHEF_VISITS_HOME' ? 'Chef Visits Home' : 'Cook & Deliver'}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px]">Escrow Status:</span>
            <span className="font-bold text-[#10B981]">Advance Paid (In Escrow)</span>
          </div>
        </div>
      </div>

      {/* Live Tracking Information Card */}
      <div className="w-full max-w-sm mt-3 p-4 rounded-2xl bg-[#E3F2FD] border border-[#90CAF9] text-left flex items-start gap-3">
        <span className="material-symbols-outlined text-[#2196F3] text-[24px] flex-shrink-0">notifications_active</span>
        <div className="flex-1">
          <h5 className="font-sora font-bold text-xs text-[#0D47A1]">Live Event Tracking Available</h5>
          <p className="font-sora text-[11px] text-[#172033] mt-0.5 leading-relaxed">
            On 28 Nov, you can track Chef Raghavendra's travel ETA live and view his kitchen preparation checklist in real-time.
          </p>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="w-full max-w-sm mt-6 flex flex-col gap-2.5">
        <button
          onClick={() => navigate('/tracking/c4d3e2b1-0987-6543-21ba-fedcba987654')}
          className="w-full py-3.5 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">location_searching</span>
          <span>View Live Event Tracking</span>
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-white border border-[#E5E7EB] hover:bg-[#f1f3ff] text-[#172033] rounded-full font-sora text-xs font-semibold active:scale-95 transition-all"
        >
          Return to Marketplace Home
        </button>
      </div>
    </div>
  );
}
