import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';
import { useBookingStore } from '../../stores/useBookingStore';

export default function ChefProfile() {
  const navigate = useNavigate();
  const { provider } = useBookingStore();
  const [activeTab, setActiveTab] = useState('PACKAGES');
  const [selectedPackage, setSelectedPackage] = useState(1);

  const packages = [
    {
      id: 1,
      title: 'Royal Andhra 5-Course Festive Feast',
      price: 1499,
      unit: 'person',
      minGuests: 10,
      description: 'Authentic festive banquet prepared fresh on banana leaves with pure cow ghee and freshly hand-pounded spices.',
      courses: [
        { category: 'Starter', name: 'Gutti Vankaya Fry & Mirchi Bajji with peanut chutney' },
        { category: 'Mains', name: 'Traditional Andhra Pappu with raw mango & Gongura Pachadi' },
        { category: 'Signature', name: 'Slow-simmered Bendakaya Pulusu & Ulava Charu' },
        { category: 'Rice & Breads', name: 'Steamed Sona Masoori Rice, Curd Rice with pomegranates' },
        { category: 'Dessert', name: 'Warm Bobbatlu with fresh melted ghee & Semiya Payasam' },
      ],
    },
    {
      id: 2,
      title: 'Telangana Heritage Country Feast',
      price: 1650,
      unit: 'person',
      minGuests: 15,
      description: 'Earthy, fragrant regional specialities featuring hand-pressed jowar rotis and slow-cooked country chicken or gutti tamata.',
      courses: [
        { category: 'Starter', name: 'Makka Garelu & Spiced Tomato Chutney' },
        { category: 'Mains', name: 'Telangana Natu Kodi Pulusu (or Bagara Baingan)' },
        { category: 'Breads & Rice', name: 'Fresh Jowar Gatka, Bagara Rice & Dalcha' },
        { category: 'Dessert', name: 'Qubani ka Meetha with malai' },
      ],
    },
  ];

  return (
    <div className="flex flex-col w-full pb-32 pt-2 bg-white">
      {/* Top Cover & Header */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <img
          src={ASSETS.bannerAndhraHomeFeast}
          alt="Chef Raghavendra Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#172033] shadow-md hover:bg-white transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>

        {/* Share & Favorite */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#172033] shadow-md active:scale-95">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-red-500 shadow-md active:scale-95">
            <span className="material-symbols-outlined text-[20px] fill-1">favorite</span>
          </button>
        </div>

        {/* Floating Chef Avatar & Title */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3.5">
          <div className="w-20 h-20 rounded-2xl ring-4 ring-white overflow-hidden shadow-xl flex-shrink-0 bg-white">
            <img
              src={ASSETS.chefRaghavendraStudio}
              alt="Chef Raghavendra Rao"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col text-white pb-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#90CAF9] text-[18px] fill-1">verified</span>
              <span className="font-sora text-xs font-bold text-[#90CAF9] tracking-wider uppercase">FSSAI Certified</span>
            </div>
            <h1 className="font-sora font-extrabold text-xl sm:text-2xl leading-tight text-white truncate drop-shadow-sm">
              Chef Raghavendra Rao
            </h1>
            <p className="font-sora text-xs text-white/90 truncate">
              Former Executive Chef, Taj Falaknuma • Jubilee Hills
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row (Stitch Exact Cards) */}
      <section className="px-4 py-4 grid grid-cols-3 gap-2.5 bg-white border-b border-[#E5E7EB]">
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB]">
          <span className="font-sora font-extrabold text-base text-[#172033]">18+ Yrs</span>
          <span className="font-sora text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Experience</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB]">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[#FFB300] text-[16px] fill-1">star</span>
            <span className="font-sora font-extrabold text-base text-[#172033]">4.95</span>
          </div>
          <span className="font-sora text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">1,240 Reviews</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#E3F2FD] border border-[#90CAF9]/50">
          <span className="font-sora font-extrabold text-base text-[#0D47A1]">350+</span>
          <span className="font-sora text-[10px] text-[#0D47A1] font-semibold uppercase tracking-wider mt-0.5">Events Hosted</span>
        </div>
      </section>

      {/* Bio & Philosophy */}
      <section className="px-4 py-4 border-b border-[#E5E7EB]">
        <h3 className="font-sora font-bold text-sm text-[#172033] mb-1.5">Culinary Biography</h3>
        <p className="font-sora text-xs text-[#64748B] leading-relaxed">
          Celebrated across Telangana and Andhra Pradesh for bringing heirloom aristocratic recipes back to the modern banquet. Trained in classical Nizam and Kakatiya heritage cooking, Chef Raghavendra specializes in zero-preservative, fresh ground spice masalas, cooking in authentic copper and clay pots.
        </p>

        {/* Cuisines */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="px-3 py-1 bg-[#f1f3ff] rounded-full font-sora text-xs font-medium text-[#0D47A1]">
            Andhra Royal
          </span>
          <span className="px-3 py-1 bg-[#f1f3ff] rounded-full font-sora text-xs font-medium text-[#0D47A1]">
            Telangana Heritage
          </span>
          <span className="px-3 py-1 bg-[#f1f3ff] rounded-full font-sora text-xs font-medium text-[#0D47A1]">
            Coastal Seafood
          </span>
          <span className="px-3 py-1 bg-[#f1f3ff] rounded-full font-sora text-xs font-medium text-[#0D47A1]">
            Traditional Banana Leaf
          </span>
        </div>
      </section>

      {/* Packages vs Portfolio Tabs */}
      <section className="px-4 py-3">
        <div className="flex rounded-full bg-[#f1f3ff] p-1 border border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab('PACKAGES')}
            className={`flex-1 py-2 rounded-full font-sora text-xs font-bold transition-all ${
              activeTab === 'PACKAGES'
                ? 'bg-[#2196F3] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Menu Packages
          </button>
          <button
            onClick={() => setActiveTab('PORTFOLIO')}
            className={`flex-1 py-2 rounded-full font-sora text-xs font-bold transition-all ${
              activeTab === 'PORTFOLIO'
                ? 'bg-[#2196F3] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Photo &amp; Video Proof
          </button>
        </div>
      </section>

      {/* Tab 1: Menu Packages */}
      {activeTab === 'PACKAGES' && (
        <section className="px-4 flex flex-col gap-4 mt-2">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedPackage === pkg.id
                  ? 'border-2 border-[#2196F3] bg-[#E3F2FD]/20 shadow-md'
                  : 'border-[#E5E7EB] bg-white hover:border-[#90CAF9]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-sora font-bold text-base text-[#172033]">{pkg.title}</h4>
                  <p className="font-sora text-xs text-[#64748B] mt-0.5">{pkg.description}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <span className="font-sora font-extrabold text-lg text-[#0D47A1]">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </span>
                  <span className="block font-sora text-[10px] text-[#64748B]">/ guest</span>
                </div>
              </div>

              {/* Course Items List */}
              <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex flex-col gap-2">
                {pkg.courses.map((course, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs font-sora">
                    <span className="font-bold text-[#0D47A1] min-w-[70px] uppercase text-[10px] pt-0.5">
                      {course.category}:
                    </span>
                    <span className="text-[#172033]">{course.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Tab 2: Portfolio & Cooking Video Proof */}
      {activeTab === 'PORTFOLIO' && (
        <section className="px-4 grid grid-cols-2 gap-3 mt-2">
          <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-xs relative group h-40">
            <img src={ASSETS.bannerAndhraHomeFeast} alt="Gutti Vankaya" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white font-sora text-[11px] font-semibold">
              Gutti Vankaya Plating
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-xs relative group h-40">
            <img src={ASSETS.bannerRoyalBanquet} alt="Royal Banquet" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white font-sora text-[11px] font-semibold">
              Palace Banquet Spread
            </div>
          </div>
          <div className="col-span-2 rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-xs relative h-48 bg-black flex items-center justify-center">
            <img src={ASSETS.chefRaghavendraWarm} alt="Cooking Demo" className="w-full h-full object-cover opacity-75" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="w-12 h-12 rounded-full bg-[#2196F3] flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform cursor-pointer">
                <span className="material-symbols-outlined text-[28px] fill-1">play_arrow</span>
              </div>
              <span className="font-sora text-xs font-bold mt-2 text-white drop-shadow-sm">
                Watch Cooking &amp; Kitchen Sanitization Demo (2:14)
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Sticky Bottom Booking Action Bar (Stitch Level 3 Elevation) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB] p-4 shadow-[0_-4px_20px_rgba(13,71,161,0.08)] pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-sora text-[10px] text-[#64748B] uppercase tracking-wider">Chef Visiting Fee</span>
            <div className="flex items-baseline gap-1">
              <span className="font-sora font-extrabold text-xl text-[#172033]">₹1,500</span>
              <span className="font-sora text-xs text-[#64748B]">+ ₹350/guest</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/booking/step-1')}
            className="flex-1 py-3 px-6 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-sm font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Reserve Chef Raghavendra</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
