import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';

export default function CustomerHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [favorites, setFavorites] = useState({ 'raghavendra': true, 'utsav': false });

  const toggleFav = (id) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    { id: 'HOME_CHEF', label: 'Home Chefs', icon: 'soup_kitchen', popular: true },
    { id: 'PRO_CHEF', label: 'Pro Chefs', icon: 'restaurant', popular: false },
    { id: 'CATERING', label: 'Catering', icon: 'room_service', popular: false },
    { id: 'PLANNER', label: 'Planners', icon: 'event_note', popular: false },
    { id: 'DECOR', label: 'Decor', icon: 'filter_vintage', popular: false },
    { id: 'MEDIA', label: 'Photo/Video', icon: 'photo_camera', popular: false },
    { id: 'BARTENDER', label: 'Bartenders', icon: 'local_bar', popular: false },
  ];

  return (
    <div className="flex flex-col w-full pb-28 pt-2">
      {/* 1. Search & Filter Hub */}
      <section className="px-4 py-2">
        <div className="relative flex items-center w-full h-12 bg-[#f1f3ff] rounded-full px-4 shadow-sm border border-[#E5E7EB] transition-all focus-within:ring-2 focus-within:ring-[#90CAF9] focus-within:bg-white">
          <span className="material-symbols-outlined text-[#2196F3] text-[22px] flex-shrink-0">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find chefs, caterers, planners..."
            className="w-full bg-transparent border-none outline-none px-3 font-sora text-sm text-[#172033] placeholder:text-[#64748B]"
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <button aria-label="Voice Search" className="w-8 h-8 rounded-full flex items-center justify-center text-[#2196F3] hover:bg-[#E3F2FD] transition-colors">
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
            <div className="w-px h-4 bg-[#E5E7EB]"></div>
            <button 
              onClick={() => navigate('/explore')} 
              aria-label="Filters" 
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#2196F3] hover:bg-[#E3F2FD] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Curated Promotional Carousel (Exact Stitch Screen 01 Structure) */}
      <section className="mt-2">
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scroll-smooth no-scrollbar">
          {/* Promo 1: Andhra Traditional Home Chefs */}
          <div className="min-w-[88vw] sm:min-w-[420px] snap-center rounded-2xl bg-gradient-to-br from-[#f1f3ff] to-[#E3F2FD] overflow-hidden relative shadow-sm border border-[#90CAF9]/40 flex flex-col justify-between p-4">
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#90CAF9]/20 blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-1 max-w-[65%]">
              <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full w-fit shadow-xs border border-[#90CAF9]/30">
                <span className="material-symbols-outlined text-[#2196F3] text-[14px]">local_fire_department</span>
                <span className="font-sora text-[11px] font-bold text-[#0D47A1]">Regional Specialists</span>
              </div>
              <h2 className="font-sora text-[17px] font-bold text-[#172033] leading-snug mt-1">
                Traditional Andhra &amp; Telangana Home Chefs
              </h2>
              <p className="font-sora text-xs text-[#64748B]">
                Verified culinary masters from <span className="font-bold text-[#172033]">₹1,499</span>
              </p>
            </div>

            <div className="relative z-10 mt-4 flex items-center justify-between">
              <button 
                onClick={() => navigate('/booking/step-1')}
                className="px-4 py-2 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-semibold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <span>Book Now</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
              <span className="font-sora text-[11px] text-[#64748B]">50+ Hosts Booked Today</span>
            </div>

            <div className="absolute right-0 bottom-0 w-36 h-36 rounded-tl-full overflow-hidden shadow-inner">
              <img 
                src={ASSETS.bannerAndhraHomeFeast} 
                alt="Traditional Andhra festive thali"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Promo 2: Luxury Wedding Catering & Event Styling */}
          <div className="min-w-[88vw] sm:min-w-[420px] snap-center rounded-2xl bg-gradient-to-br from-[#e9edff] to-[#E3F2FD] overflow-hidden relative shadow-sm border border-[#90CAF9]/40 flex flex-col justify-between p-4">
            <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-[#90CAF9]/30 blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-1 max-w-[68%]">
              <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full w-fit shadow-xs border border-[#90CAF9]/30">
                <span className="material-symbols-outlined text-[#0D47A1] text-[14px]">stars</span>
                <span className="font-sora text-[11px] font-bold text-[#0D47A1]">Luxury Weddings</span>
              </div>
              <h2 className="font-sora text-[17px] font-bold text-[#172033] leading-snug mt-1">
                Grand Catering &amp; Event Styling
              </h2>
              <p className="font-sora text-xs text-[#64748B]">
                Weddings &amp; Housewarmings • Tastings available
              </p>
            </div>

            <div className="relative z-10 mt-4 flex items-center justify-between">
              <button 
                onClick={() => navigate('/explore')}
                className="px-4 py-2 bg-[#0D47A1] hover:bg-[#2196F3] text-white rounded-full font-sora text-xs font-semibold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <span>Plan Event</span>
                <span className="material-symbols-outlined text-[15px]">celebration</span>
              </button>
              <span className="font-sora text-[11px] text-[#64748B]">Curated Menus</span>
            </div>

            <div className="absolute right-0 bottom-0 w-36 h-36 rounded-tl-full overflow-hidden shadow-inner">
              <img 
                src={ASSETS.bannerLuxuryWeddings} 
                alt="Luxury banquet dining setup"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Service Categories Strip (Browse by Atelier) */}
      <section className="mt-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-sora font-bold text-base text-[#172033]">Browse by Atelier</h3>
          <button onClick={() => navigate('/explore')} className="font-sora text-xs font-semibold text-[#2196F3] flex items-center hover:underline">
            <span>View all</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                navigate('/explore');
              }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[74px] cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] flex items-center justify-center relative shadow-xs group-hover:bg-[#E3F2FD] group-hover:border-[#90CAF9] transition-all">
                <span className="material-symbols-outlined text-[#2196F3] text-[28px] group-hover:scale-110 transition-transform">
                  {cat.icon}
                </span>
                {cat.popular && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#2196F3] text-white font-sora font-extrabold text-[8px] rounded-full uppercase">
                    POPULAR
                  </span>
                )}
              </div>
              <span className="font-sora text-[11px] text-[#172033] text-center font-medium line-clamp-1">
                {cat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Family Home-Food Experience Spotlight (Mandated Requirement) */}
      <section className="mt-6 px-4">
        <div className="bg-white rounded-2xl p-4 shadow-subtle border border-[#E5E7EB] relative overflow-hidden bg-gradient-to-br from-[#f1f3ff] via-white to-[#E3F2FD]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2196F3] text-[20px]">groups</span>
              <span className="font-sora font-bold text-xs text-[#0D47A1] uppercase tracking-wider">
                Family Gathering Special
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#d9e2fc] font-sora text-[10px] font-bold text-[#0D47A1]">
              Host Worry-Free
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-sora font-bold text-sm text-[#172033]">
                Authentic Homemade Feast for 10-50 Guests
              </h4>
              <p className="font-sora text-xs text-[#64748B] mt-0.5 max-w-sm">
                Chef prepares traditional recipes on-site in your kitchen or cooks &amp; delivers hot banana-leaf packs.
              </p>
            </div>
            <button
              onClick={() => navigate('/booking/step-1')}
              className="px-4 py-2 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-semibold shadow-sm flex items-center gap-1 active:scale-95 transition-all"
            >
              <span>Explore Home Chefs</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Trending Masterchefs Showcase (Stitch Card 01: Chef Raghavendra Rao) */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-sora font-bold text-base text-[#172033]">Featured Masterchefs</h3>
            <p className="font-sora text-xs text-[#64748B]">Vetted culinary artisans with 10+ years hospitality leadership</p>
          </div>
          <button onClick={() => navigate('/explore')} className="font-sora text-xs font-semibold text-[#2196F3] hover:underline">
            See all
          </button>
        </div>

        {/* Masterchef Card 1: Chef Raghavendra Rao */}
        <div className="w-full bg-white rounded-2xl shadow-subtle border border-[#E5E7EB] overflow-hidden flex flex-col mb-4 group hover:shadow-card transition-all">
          <div className="relative h-52 w-full">
            <img
              src={ASSETS.chefRaghavendraStudio}
              alt="Chef Raghavendra Rao"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#172033]/85 via-transparent to-transparent"></div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full shadow-xs border border-[#90CAF9]/40">
              <span className="material-symbols-outlined text-[#0D47A1] text-[16px] fill-1">verified</span>
              <span className="font-sora text-[11px] font-bold text-[#0D47A1]">Masterchef Verified</span>
            </div>

            <button
              onClick={() => toggleFav('raghavendra')}
              aria-label="Add to favourites"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#64748B] transition-transform active:scale-75 shadow-sm"
            >
              <span className={`material-symbols-outlined text-[20px] ${favorites['raghavendra'] ? 'text-red-500 fill-1' : ''}`}>
                favorite
              </span>
            </button>

            {/* Title & Rating on Cover */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
              <div>
                <span className="font-sora text-[11px] text-[#90CAF9] uppercase tracking-wider font-semibold">
                  Jubilee Hills • 3.8 km away
                </span>
                <h4 className="font-sora font-bold text-lg leading-tight drop-shadow-sm text-white">
                  Chef Raghavendra Rao
                </h4>
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full text-[#172033] shadow-sm">
                <span className="material-symbols-outlined text-[#FFB300] text-[15px] fill-1">star</span>
                <span className="font-sora text-xs font-bold">4.95</span>
                <span className="text-[10px] text-[#64748B]">(1.2k)</span>
              </div>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 bg-[#f1f3ff] rounded-full font-sora text-[11px] font-medium text-[#0D47A1]">
                Andhra Royal
              </span>
              <span className="px-2.5 py-0.5 bg-[#f1f3ff] rounded-full font-sora text-[11px] font-medium text-[#0D47A1]">
                Telangana Heritage
              </span>
              <span className="px-2.5 py-0.5 bg-[#f1f3ff] rounded-full font-sora text-[11px] font-medium text-[#0D47A1]">
                Coastal Seafood
              </span>
              <span className="px-2.5 py-0.5 bg-[#E3F2FD] rounded-full font-sora text-[11px] font-semibold text-[#2196F3]">
                18+ Yrs Exp
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
              <div className="flex flex-col">
                <span className="font-sora text-[10px] text-[#64748B] uppercase tracking-wider">Starting from</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-sora font-extrabold text-lg text-[#172033]">₹1,499</span>
                  <span className="font-sora text-xs text-[#64748B]">/ person</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/chef/raghavendra-rao')}
                  className="px-3.5 py-2 bg-white border border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD] rounded-full font-sora text-xs font-semibold active:scale-95 transition-all"
                >
                  View Profile
                </button>
                <button
                  onClick={() => navigate('/booking/step-1')}
                  className="px-4 py-2 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1"
                >
                  <span>Book Chef</span>
                  <span className="material-symbols-outlined text-[15px]">restaurant_menu</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Masterchef Card 2: Chef Anupama Joshi */}
        <div className="w-full bg-white rounded-2xl shadow-subtle border border-[#E5E7EB] overflow-hidden flex flex-col mb-4 group hover:shadow-card transition-all">
          <div className="relative h-48 w-full">
            <img
              src={ASSETS.chefFemaleMaharashtrian}
              alt="Chef Anupama Joshi"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#172033]/85 via-transparent to-transparent"></div>

            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full shadow-xs border border-[#90CAF9]/40">
              <span className="material-symbols-outlined text-[#0D47A1] text-[16px] fill-1">verified</span>
              <span className="font-sora text-[11px] font-bold text-[#0D47A1]">Gourmet Specialist</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
              <div>
                <span className="font-sora text-[11px] text-[#90CAF9] uppercase tracking-wider font-semibold">
                  Banjara Hills • 5.2 km away
                </span>
                <h4 className="font-sora font-bold text-lg leading-tight drop-shadow-sm text-white">
                  Chef Anupama Joshi
                </h4>
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full text-[#172033] shadow-sm">
                <span className="material-symbols-outlined text-[#FFB300] text-[15px] fill-1">star</span>
                <span className="font-sora text-xs font-bold">4.92</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 bg-[#f1f3ff] rounded-full font-sora text-[11px] font-medium text-[#0D47A1]">
                Maharashtrian Royal
              </span>
              <span className="px-2.5 py-0.5 bg-[#f1f3ff] rounded-full font-sora text-[11px] font-medium text-[#0D47A1]">
                Bespoke Plating
              </span>
              <span className="px-2.5 py-0.5 bg-[#f1f3ff] rounded-full font-sora text-[11px] font-medium text-[#0D47A1]">
                Pure Vegetarian
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
              <div className="flex flex-col">
                <span className="font-sora text-[10px] text-[#64748B] uppercase tracking-wider">Starting from</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-sora font-extrabold text-lg text-[#172033]">₹1,800</span>
                  <span className="font-sora text-xs text-[#64748B]">/ person</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/booking/step-1')}
                className="px-4 py-2 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1"
              >
                <span>Reserve Tasting</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Grand Event Services (Utsav Event Planners & Decor) */}
      <section className="mt-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-sora font-bold text-base text-[#172033]">Planners &amp; Decorators</h3>
            <p className="font-sora text-xs text-[#64748B]">Thematic mandaps, floral styling, sound, and lighting</p>
          </div>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-subtle border border-[#E5E7EB] overflow-hidden flex flex-col group hover:shadow-card transition-all">
          <div className="relative h-48 w-full">
            <img
              src={ASSETS.decorWeddingMandap}
              alt="Utsav Event Planners & Decor"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#172033]/85 via-transparent to-transparent"></div>

            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full shadow-xs border border-[#90CAF9]/40">
              <span className="material-symbols-outlined text-[#0D47A1] text-[16px] fill-1">verified</span>
              <span className="font-sora text-[11px] font-bold text-[#0D47A1]">Elite Event Decorator</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
              <div>
                <span className="font-sora text-[11px] text-[#90CAF9] uppercase tracking-wider font-semibold">
                  Banjara Hills • Full Execution
                </span>
                <h4 className="font-sora font-bold text-lg leading-tight drop-shadow-sm text-white">
                  Utsav Event Planners &amp; Decor
                </h4>
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full text-[#172033] shadow-sm">
                <span className="material-symbols-outlined text-[#FFB300] text-[15px] fill-1">star</span>
                <span className="font-sora text-xs font-bold">4.88</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 bg-[#f1f3ff] rounded-full font-sora text-[11px] font-medium text-[#0D47A1]">
                Theme Mandap
              </span>
              <span className="px-2.5 py-0.5 bg-[#f1f3ff] rounded-full font-sora text-[11px] font-medium text-[#0D47A1]">
                Floral Styling
              </span>
              <span className="px-2.5 py-0.5 bg-[#f1f3ff] rounded-full font-sora text-[11px] font-medium text-[#0D47A1]">
                Lighting &amp; Sound
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
              <div className="flex flex-col">
                <span className="font-sora text-[10px] text-[#64748B] uppercase tracking-wider">Packages from</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-sora font-extrabold text-lg text-[#172033]">₹25,000</span>
                  <span className="font-sora text-xs text-[#64748B]">/ event</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/booking/step-1')}
                className="px-4 py-2 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1"
              >
                <span>View Packages</span>
                <span className="material-symbols-outlined text-[15px]">celebration</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Assurance Guarantee Card (Stitch Exact Hygiene Pledge) */}
      <section className="mt-6 px-4">
        <div className="bg-[#f1f3ff] rounded-2xl p-4 flex items-center gap-4 border border-[#90CAF9]/40 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#2196F3] flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>
          <div className="flex flex-col">
            <span className="font-sora font-bold text-sm text-[#172033] leading-tight">
              The Atelier Hygiene &amp; Taste Pledge
            </span>
            <span className="font-sora text-xs text-[#64748B] mt-0.5 leading-relaxed">
              100% Background Verified Cooks, Kitchen Sanitization Protocols, and Escrow Protected Payments.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
