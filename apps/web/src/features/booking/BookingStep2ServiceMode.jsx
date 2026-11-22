import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../stores/useBookingStore';

export default function BookingStep2ServiceMode() {
  const navigate = useNavigate();
  const { step2Preferences, updateStep2 } = useBookingStore();

  const serviceModes = [
    {
      id: 'CHEF_VISITS_HOME',
      title: 'Chef Visits My Home',
      desc: 'Chef Raghavendra arrives 3 hrs before mealtime, brings organic spices, cooks fresh on-site & sanitizes kitchen.',
      icon: 'soup_kitchen',
      badge: 'Most Popular for Gatherings',
    },
    {
      id: 'COOK_AND_DELIVER',
      title: 'Cook & Deliver Hot',
      desc: 'Food is prepared in the chef certified studio kitchen and delivered fresh in insulated thermal containers 30m prior.',
      icon: 'delivery_dining',
      badge: 'Zero Host Kitchen Hassle',
    },
    {
      id: 'VENUE_BANQUET',
      title: 'Event Venue Banquet Setup',
      desc: 'Full on-site commercial banquet setup with warm chaffing dishes, live counters, and assistant staff.',
      icon: 'celebration',
      badge: 'For 50+ Guest Celebrations',
    },
  ];

  const dietaryOptions = ['Pure Vegetarian', 'Non-Vegetarian', 'Jain (No Onion/Garlic)', 'Halal Certified'];

  return (
    <div className="flex flex-col w-full min-h-screen pb-32 pt-2 bg-white">
      {/* Header & Progress */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-sora font-semibold text-[#64748B] hover:text-[#172033]">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back</span>
        </button>
        <span className="font-sora text-xs font-bold text-[#0D47A1]">Step 2 of 5: Service Mode</span>
        <div className="w-16 h-1.5 rounded-full bg-[#f1f3ff] overflow-hidden">
          <div className="w-2/5 h-full bg-[#2196F3] rounded-full"></div>
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-5">
        {/* Service Delivery Mode Cards */}
        <div>
          <label className="block font-sora font-bold text-xs text-[#172033] mb-2 uppercase tracking-wider">
            Select Service Delivery Mode
          </label>
          <div className="flex flex-col gap-3">
            {serviceModes.map((mode) => (
              <div
                key={mode.id}
                onClick={() => updateStep2({ serviceMode: mode.id })}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  step2Preferences.serviceMode === mode.id
                    ? 'border-2 border-[#2196F3] bg-[#E3F2FD]/30 shadow-sm'
                    : 'border-[#E5E7EB] bg-white hover:border-[#90CAF9]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step2Preferences.serviceMode === mode.id ? 'bg-[#2196F3] text-white' : 'bg-[#f1f3ff] text-[#2196F3]'
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">{mode.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-sora font-bold text-sm text-[#172033]">{mode.title}</h4>
                      <span className="text-[10px] font-sora font-bold px-2 py-0.5 rounded-full bg-[#E3F2FD] text-[#0D47A1]">
                        {mode.badge}
                      </span>
                    </div>
                    <p className="font-sora text-xs text-[#64748B] mt-1 leading-relaxed">{mode.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dietary Preference */}
        <div>
          <label className="block font-sora font-bold text-xs text-[#172033] mb-2 uppercase tracking-wider">
            Dietary Specification
          </label>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((diet) => (
              <button
                key={diet}
                type="button"
                onClick={() => updateStep2({ dietary: diet })}
                className={`px-3.5 py-2 rounded-full font-sora text-xs font-medium transition-all shadow-xs ${
                  step2Preferences.dietary === diet
                    ? 'bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1] font-bold ring-1 ring-[#90CAF9]'
                    : 'bg-white border border-[#E5E7EB] text-[#64748B] hover:border-[#90CAF9]'
                }`}
              >
                {diet}
              </button>
            ))}
          </div>
        </div>

        {/* Spice Level Selector */}
        <div className="p-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">Spice Level</span>
            <span className="font-sora font-bold text-xs text-[#0D47A1]">{step2Preferences.spiceLevel}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Mild (Kid Friendly)', 'Medium Spice', 'Andhra Authentic (Spicy)'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => updateStep2({ spiceLevel: lvl })}
                className={`py-2 px-1 text-center rounded-xl font-sora text-[11px] font-semibold transition-all ${
                  step2Preferences.spiceLevel === lvl
                    ? 'bg-[#2196F3] text-white shadow-xs'
                    : 'bg-white text-[#64748B] border border-[#E5E7EB]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Host Notes & Special Instructions */}
        <div>
          <label className="block font-sora font-bold text-xs text-[#172033] mb-1.5 uppercase tracking-wider">
            Special Notes &amp; Dish Customizations
          </label>
          <textarea
            rows={3}
            value={step2Preferences.specialNotes}
            onChange={(e) => updateStep2({ specialNotes: e.target.value })}
            placeholder="Tell the chef about heirloom family preferences, favorite dishes, or allergies..."
            className="w-full p-3.5 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] font-sora text-xs text-[#172033] focus:ring-2 focus:ring-[#90CAF9] focus:bg-white outline-none leading-relaxed"
          ></textarea>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB] p-4 shadow-nav pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/booking/step-3')}
            className="w-full py-3 px-6 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Review Itemized Quotation</span>
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          </button>
        </div>
      </div>
    </div>
  );
}
