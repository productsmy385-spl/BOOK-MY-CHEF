import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';

export default function CustomerExplore() {
  const navigate = useNavigate();
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [selectedBudget, setSelectedBudget] = useState('ALL');
  const [instantOnly, setInstantOnly] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const cuisines = [
    { id: 'ALL', label: 'All Cuisines' },
    { id: 'ANDHRA', label: 'Andhra Royal' },
    { id: 'TELANGANA', label: 'Telangana Heritage' },
    { id: 'SOUTH_INDIAN', label: 'South Indian Classic' },
    { id: 'NORTH_INDIAN', label: 'North Indian' },
    { id: 'CONTINENTAL', label: 'Continental' },
    { id: 'VEGAN', label: 'Pure Vegan' },
  ];

  const providers = [
    {
      id: 'raghavendra-rao',
      name: 'Chef Raghavendra Rao',
      image: ASSETS.chefRaghavendraStudio,
      category: 'PRO_CHEF',
      roleTitle: 'Masterchef • 18+ Yrs Exp',
      location: 'Jubilee Hills • 3.8 km',
      cuisines: ['Andhra Royal', 'Telangana Home-Style', 'Coastal Seafood'],
      rating: 4.95,
      reviewsCount: 1240,
      price: 1499,
      priceUnit: 'person',
      verified: true,
      instantAvailable: true,
      deliveryModes: ['Chef Visits Home', 'Cook & Deliver'],
    },
    {
      id: 'anupama-joshi',
      name: 'Chef Anupama Joshi',
      image: ASSETS.chefFemaleMaharashtrian,
      category: 'PRO_CHEF',
      roleTitle: 'Gourmet Specialist • 14+ Yrs Exp',
      location: 'Banjara Hills • 5.2 km',
      cuisines: ['Maharashtrian Royal', 'Bespoke Plating', 'Pure Vegetarian'],
      rating: 4.92,
      reviewsCount: 890,
      price: 1800,
      priceUnit: 'person',
      verified: true,
      instantAvailable: true,
      deliveryModes: ['Chef Visits Home'],
    },
    {
      id: 'royal-dakshin',
      name: 'Royal Dakshin Banquet Caterers',
      image: ASSETS.bannerRoyalBanquet,
      category: 'CATERING',
      roleTitle: 'Elite Banquet Team • 50-500 Guests',
      location: 'Madhapur • 4.1 km',
      cuisines: ['South Indian Grand Feast', 'Biryani Counters', 'Live Desserts'],
      rating: 4.89,
      reviewsCount: 650,
      price: 350,
      priceUnit: 'plate',
      verified: true,
      instantAvailable: false,
      deliveryModes: ['Venue Banquet Cooking'],
    },
    {
      id: 'utsav-planners',
      name: 'Utsav Event Planners & Decor',
      image: ASSETS.decorWeddingMandap,
      category: 'PLANNER',
      roleTitle: 'Full Wedding & Event Styling',
      location: 'Banjara Hills • 4.5 km',
      cuisines: ['Thematic Mandap', 'Floral Styling', 'Lighting & Sound'],
      rating: 4.88,
      reviewsCount: 420,
      price: 25000,
      priceUnit: 'event',
      verified: true,
      instantAvailable: true,
      deliveryModes: ['Full On-Site Execution'],
    },
  ];

  const filteredProviders = providers.filter((p) => {
    if (selectedCuisine !== 'ALL' && !p.cuisines.some(c => c.toUpperCase().includes(selectedCuisine))) {
      return false;
    }
    if (instantOnly && !p.instantAvailable) {
      return false;
    }
    if (searchFilter && !p.name.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-28 pt-2">
      {/* Search Header */}
      <section className="px-4 py-2">
        <div className="relative flex items-center w-full h-12 bg-[#f1f3ff] rounded-full px-4 border border-[#E5E7EB] focus-within:ring-2 focus-within:ring-[#90CAF9] focus-within:bg-white transition-all shadow-sm">
          <span className="material-symbols-outlined text-[#2196F3] text-[22px] flex-shrink-0">search</span>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by chef, cuisine, or catering..."
            className="w-full bg-transparent border-none outline-none px-3 font-sora text-sm text-[#172033] placeholder:text-[#64748B]"
          />
          {searchFilter && (
            <button onClick={() => setSearchFilter('')} className="text-[#64748B] hover:text-[#172033]">
              <span className="material-symbols-outlined text-[18px]">clear</span>
            </button>
          )}
        </div>
      </section>

      {/* Filter Chips Horizontal Scroller (Exact Stitch Screen 02) */}
      <section className="px-4 py-1">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar items-center">
          {/* Instant Availability Toggle Chip */}
          <button
            onClick={() => setInstantOnly(!instantOnly)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-sora text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
              instantOnly
                ? 'bg-[#E3F2FD] border-2 border-[#2196F3] text-[#0D47A1]'
                : 'bg-white border border-[#E5E7EB] text-[#64748B] hover:border-[#90CAF9]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-[#2196F3]">bolt</span>
            <span>Available Today</span>
          </button>

          {/* Cuisine Chips */}
          {cuisines.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCuisine(c.id)}
              className={`px-3.5 py-1.5 rounded-full font-sora text-xs font-medium whitespace-nowrap transition-all shadow-xs ${
                selectedCuisine === c.id
                  ? 'bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1] font-bold'
                  : 'bg-white border border-[#E5E7EB] text-[#64748B] hover:border-[#90CAF9]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Results Count & Sort Indicator */}
      <section className="px-4 py-2 flex items-center justify-between">
        <span className="font-sora text-xs font-semibold text-[#64748B]">
          Showing <span className="text-[#172033] font-bold">{filteredProviders.length}</span> Verified Ateliers
        </span>
        <button className="flex items-center gap-1 text-xs font-sora font-semibold text-[#2196F3] hover:underline">
          <span className="material-symbols-outlined text-[16px]">swap_vert</span>
          <span>Sort: Recommended</span>
        </button>
      </section>

      {/* Provider List (Stitch Cards) */}
      <section className="px-4 flex flex-col gap-4 mt-1">
        {filteredProviders.map((provider) => (
          <div
            key={provider.id}
            className="w-full bg-white rounded-2xl shadow-subtle border border-[#E5E7EB] overflow-hidden flex flex-col group hover:shadow-card transition-all"
          >
            {/* Card Cover Image */}
            <div className="relative h-48 w-full cursor-pointer" onClick={() => navigate(`/chef/${provider.id}`)}>
              <img
                src={provider.image}
                alt={provider.name}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#172033]/80 via-transparent to-transparent"></div>

              {/* Verified Badge */}
              {provider.verified && (
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full shadow-xs border border-[#90CAF9]/40">
                  <span className="material-symbols-outlined text-[#0D47A1] text-[15px] fill-1">verified</span>
                  <span className="font-sora text-[10px] font-bold text-[#0D47A1]">Atelier Verified</span>
                </div>
              )}

              {/* Instant Book Tag */}
              {provider.instantAvailable && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-[#E3F2FD]/95 backdrop-blur-md rounded-full shadow-xs border border-[#90CAF9]">
                  <span className="material-symbols-outlined text-[#2196F3] text-[13px]">bolt</span>
                  <span className="font-sora text-[10px] font-bold text-[#0D47A1]">Instant</span>
                </div>
              )}

              {/* Name & Rating on Banner */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                <div>
                  <span className="font-sora text-[10px] text-[#90CAF9] uppercase tracking-wider font-semibold">
                    {provider.location}
                  </span>
                  <h4 className="font-sora font-bold text-base leading-tight text-white drop-shadow-sm">
                    {provider.name}
                  </h4>
                </div>
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full text-[#172033] shadow-sm">
                  <span className="material-symbols-outlined text-[#FFB300] text-[14px] fill-1">star</span>
                  <span className="font-sora text-xs font-bold">{provider.rating}</span>
                </div>
              </div>
            </div>

            {/* Metadata & Actions */}
            <div className="p-4 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {provider.cuisines.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 bg-[#f1f3ff] rounded-full font-sora text-[10px] font-medium text-[#0D47A1]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                <div className="flex flex-col">
                  <span className="font-sora text-[10px] text-[#64748B]">Starting from</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-sora font-extrabold text-base text-[#172033]">
                      ₹{provider.price.toLocaleString('en-IN')}
                    </span>
                    <span className="font-sora text-xs text-[#64748B]">/{provider.priceUnit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/chef/${provider.id}`)}
                    className="px-3.5 py-2 bg-white border border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD] rounded-full font-sora text-xs font-semibold active:scale-95 transition-all"
                  >
                    View Atelier
                  </button>
                  <button
                    onClick={() => navigate('/booking/step-1')}
                    className="px-4 py-2 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span>Book Now</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
