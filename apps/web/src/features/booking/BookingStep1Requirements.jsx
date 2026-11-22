import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../stores/useBookingStore';
import { ASSETS } from '../../assets/assetCatalog';

export default function BookingStep1Requirements() {
  const navigate = useNavigate();
  const { provider, step1Requirements, updateStep1 } = useBookingStore();

  const eventTypes = [
    'Family Gathering',
    'Housewarming (Gruhapravesam)',
    'Birthday Celebration',
    'Traditional Puja Feast',
    'Corporate Executive Dinner',
  ];

  return (
    <div className="flex flex-col w-full min-h-screen pb-32 pt-2 bg-white">
      {/* Step Header & Progress */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-sans font-semibold text-[#64748B] hover:text-[#172033]">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back</span>
        </button>
        <span className="font-sora text-xs font-bold text-[#0D47A1]">Step 1 of 5: Event Details</span>
        <div className="w-16 h-1.5 rounded-sm bg-[#f1f3ff] overflow-hidden">
          <div className="w-1/5 h-full bg-[#2196F3] rounded-sm"></div>
        </div>
      </div>

      {/* Provider Summary Strip */}
      <div className="mx-4 mt-3 p-3 rounded-lg bg-[#f8faff] border border-[#E5E7EB] flex items-center gap-3">
        <div className="w-12 h-12 rounded-md overflow-hidden ring-1 ring-[#90CAF9] flex-shrink-0">
          <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0">
          <h4 className="font-sora font-bold text-sm text-[#172033] truncate">{provider.name}</h4>
          <span className="font-sans text-xs text-[#64748B] truncate">{provider.cuisines}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[#FFB300] text-[13px] fill-1">star</span>
            <span className="font-sora text-[11px] font-bold text-[#172033]">{provider.rating}</span>
            <span className="font-sans text-[10px] text-[#2196F3] font-semibold">• FSSAI Verified</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-5">
        {/* Event Type Selection */}
        <div>
          <label className="block font-sora font-bold text-xs text-[#172033] mb-2 uppercase tracking-wider">
            Occasion / Event Type
          </label>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateStep1({ eventType: type })}
                className={`px-3.5 py-2 rounded-md font-sans text-xs font-medium transition-all shadow-xs ${
                  step1Requirements.eventType === type
                    ? 'bg-[#E3F2FD] border border-[#2196F3] text-[#0D47A1] font-bold ring-1 ring-[#2196F3]'
                    : 'bg-white border border-[#E5E7EB] text-[#64748B] hover:border-[#90CAF9]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time Slot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-sora font-bold text-xs text-[#172033] mb-1.5 uppercase tracking-wider">
              Event Date
            </label>
            <input
              type="date"
              value={step1Requirements.eventDate}
              onChange={(e) => updateStep1({ eventDate: e.target.value })}
              className="w-full h-11 px-3.5 rounded-md bg-white border border-[#E5E7EB] font-sans text-xs text-[#172033] focus:ring-2 focus:ring-[#2196F3] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block font-sora font-bold text-xs text-[#172033] mb-1.5 uppercase tracking-wider">
              Meal Time Slot
            </label>
            <select
              value={step1Requirements.timeSlot}
              onChange={(e) => updateStep1({ timeSlot: e.target.value })}
              className="w-full h-11 px-3.5 rounded-md bg-white border border-[#E5E7EB] font-sans text-xs text-[#172033] focus:ring-2 focus:ring-[#2196F3] focus:border-transparent outline-none"
            >
              <option value="Lunch (12:30 PM)">Lunch (12:30 PM)</option>
              <option value="Dinner (08:00 PM)">Dinner (08:00 PM)</option>
              <option value="High Tea (04:30 PM)">High Tea (04:30 PM)</option>
              <option value="Breakfast / Muhurtham (08:00 AM)">Breakfast / Muhurtham (08:00 AM)</option>
            </select>
          </div>
        </div>

        {/* Guest Count Stepper */}
        <div className="p-4 rounded-lg bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <span className="font-sora font-bold text-sm text-[#172033] block">Number of Guests</span>
            <span className="font-sans text-xs text-[#64748B]">Chef adapts ingredient volume &amp; prep time</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateStep1({ guestCount: Math.max(5, step1Requirements.guestCount - 5) })}
              className="w-9 h-9 rounded-md bg-[#f1f3ff] hover:bg-[#E3F2FD] border border-[#E5E7EB] flex items-center justify-center text-[#172033] font-bold font-sora text-base active:scale-95 transition-transform"
            >
              -
            </button>
            <span className="font-sora font-extrabold text-base text-[#0D47A1] w-8 text-center">
              {step1Requirements.guestCount}
            </span>
            <button
              onClick={() => updateStep1({ guestCount: step1Requirements.guestCount + 5 })}
              className="w-9 h-9 rounded-md bg-[#2196F3] hover:bg-[#0D47A1] text-white flex items-center justify-center font-bold font-sora text-base active:scale-95 transition-transform shadow-xs"
            >
              +
            </button>
          </div>
        </div>

        {/* Venue Location with Pin */}
        <div>
          <label className="block font-sora font-bold text-xs text-[#172033] mb-1.5 uppercase tracking-wider">
            Event Location / Address
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-[#2196F3] absolute left-3 text-[20px]">location_on</span>
            <input
              type="text"
              value={step1Requirements.location}
              onChange={(e) => updateStep1({ location: e.target.value })}
              placeholder="Enter building, street, neighborhood..."
              className="w-full h-11 pl-10 pr-4 rounded-md bg-white border border-[#E5E7EB] font-sans text-xs text-[#172033] focus:ring-2 focus:ring-[#2196F3] focus:border-transparent outline-none"
            />
          </div>
          <span className="font-sans text-[10px] text-[#64748B] mt-1 block">
            Within Chef Raghavendra's primary 30 km service radius (Jubilee Hills)
          </span>
        </div>
      </div>

      {/* Sticky Bottom Continue Action */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB] p-4 shadow-nav pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-sans text-[10px] text-[#64748B]">Estimated Base</span>
            <span className="font-sora font-extrabold text-base text-[#172033]">
              ₹{(1500 + (step1Requirements.guestCount * 350)).toLocaleString('en-IN')}
            </span>
          </div>
          <button
            onClick={() => navigate('/booking/step-2')}
            className="flex-1 btn-primary py-3 px-6 text-xs flex items-center justify-center gap-1.5"
          >
            <span>Proceed to Service Mode</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
