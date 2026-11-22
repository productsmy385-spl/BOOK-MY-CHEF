import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';

export default function CustomerFavourites() {
  const navigate = useNavigate();

  const saved = [
    {
      id: 'raghavendra-rao',
      name: 'Chef Raghavendra Rao',
      image: ASSETS.chefRaghavendraStudio,
      role: 'Masterchef • 18+ Yrs Exp',
      location: 'Jubilee Hills • 3.8 km',
      rating: 4.95,
      price: '₹1,499/person',
      cuisines: 'Andhra Royal, Telangana Heritage',
    },
    {
      id: 'utsav-planners',
      name: 'Utsav Event Planners & Decor',
      image: ASSETS.decorWeddingMandap,
      role: 'Elite Mandap & Event Styling',
      location: 'Banjara Hills • 4.5 km',
      rating: 4.88,
      price: '₹25,000/event',
      cuisines: 'Theme Mandap, Lighting & Sound',
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white">
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="font-sora font-extrabold text-lg text-[#172033]">Saved Providers</h2>
          <p className="font-sora text-xs text-[#64748B]">Your curated collection of chefs and caterers</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {saved.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-3 group hover:shadow-card transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-[#90CAF9] flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#0D47A1] text-[14px] fill-1">verified</span>
                  <span className="font-sora text-[10px] font-bold text-[#0D47A1]">Atelier Verified</span>
                </div>
                <h4 className="font-sora font-bold text-sm text-[#172033] truncate">{item.name}</h4>
                <p className="font-sora text-xs text-[#64748B] truncate">{item.cuisines}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5 text-xs font-sora font-bold text-[#172033]">
                    <span className="material-symbols-outlined text-[#FFB300] text-[14px] fill-1">star</span>
                    <span>{item.rating}</span>
                  </div>
                  <span className="text-[11px] font-sora font-bold text-[#0D47A1]">{item.price}</span>
                </div>
              </div>
              <button className="text-red-500 self-start p-1">
                <span className="material-symbols-outlined text-[20px] fill-1">favorite</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => navigate('/chef/raghavendra-rao')}
                className="flex-1 py-2 bg-white border border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD] rounded-full font-sora text-xs font-semibold active:scale-95 transition-all"
              >
                View Profile
              </button>
              <button
                onClick={() => navigate('/booking/step-1')}
                className="flex-1 py-2 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <span>Book Now</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
