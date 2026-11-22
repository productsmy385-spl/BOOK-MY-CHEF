import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { api } from '../../services/api';
import { ASSETS } from '../../assets/assetCatalog';

export default function CustomerFavourites() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  const customerId = user?.id || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  const loadFavourites = async () => {
    try {
      setLoading(true);
      const res = await api.customer.getFavourites(customerId);
      const items = res?.data || [];
      setFavourites(items);
    } catch (err) {
      console.warn('Could not load favourites:', err.message);
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavourites();
  }, [user?.id]);

  const handleRemoveFavourite = async (providerId) => {
    try {
      await api.customer.removeFavourite(providerId, customerId);
      setFavourites((prev) => prev.filter((p) => p.id !== providerId));
    } catch (err) {
      console.warn('Could not remove favourite:', err);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white font-sora">
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="heading-3">Saved Providers</h2>
          <p className="body-sm">Your curated collection of chefs and caterers</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-[#2196F3] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-[#64748B] font-inter">Loading saved providers...</span>
        </div>
      ) : favourites.length === 0 ? (
        <div className="p-8 rounded-lg card-sharp border-[#CBD5E1] bg-white flex flex-col items-center text-center my-6">
          <div className="w-16 h-16 rounded-lg bg-[#E3F2FD] border border-[#90CAF9] flex items-center justify-center text-[#2196F3] mb-4 shadow-xs">
            <span className="material-symbols-outlined text-[32px]">favorite_border</span>
          </div>
          <h3 className="heading-3 text-base text-[#172033]">No Saved Providers Yet</h3>
          <p className="body-sm text-xs text-[#64748B] max-w-sm mt-1 leading-relaxed">
            Tap the heart icon on any culinary atelier, private chef, or banquet caterer to save them here for quick booking.
          </p>
          <button
            onClick={() => navigate('/customer/explore')}
            className="btn-primary py-3 px-6 text-xs mt-5 shadow-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span>Discover Providers</span>
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {favourites.map((item) => (
            <div
              key={item.id}
              className="card-sharp p-4 flex flex-col gap-3 group hover:border-[#90CAF9] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-md overflow-hidden ring-1 ring-[#CBD5E1] shrink-0">
                  <img
                    src={item.avatarUrl || item.coverImageUrl || ASSETS.chefRaghavendraStudio}
                    alt={item.professionalName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#0D47A1] text-[14px] fill-1">verified</span>
                    <span className="label-micro text-[#0D47A1]">Atelier Verified</span>
                  </div>
                  <h4 className="heading-4 text-sm truncate">{item.professionalName || item.businessName}</h4>
                  <p className="body-sm text-xs truncate mt-0.5">
                    {Array.isArray(item.cuisines) ? item.cuisines.join(', ') : 'Regional Speciality'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5 text-xs font-sora font-bold text-[#172033]">
                      <span className="material-symbols-outlined text-[#D97706] text-[14px] fill-1">star</span>
                      <span>{item.averageRating || 4.9}</span>
                    </div>
                    <span className="text-xs font-sora font-bold text-[#0D47A1]">
                      ₹{Number(item.startingPrice || 1499).toLocaleString('en-IN')}/{item.pricingModel === 'PER_PERSON' ? 'person' : 'service'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFavourite(item.id)}
                  className="text-red-500 hover:text-red-700 self-start p-1 transition-colors"
                  aria-label="Remove Favorite"
                  title="Remove from saved"
                >
                  <span className="material-symbols-outlined text-[20px] fill-1">favorite</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  onClick={() => navigate(`/chef/${item.id}`)}
                  className="btn-secondary flex-1 py-2 text-xs font-semibold"
                >
                  View Profile
                </button>
                <button
                  onClick={() => navigate('/booking/step-1')}
                  className="btn-primary flex-1 py-2 text-xs font-semibold shadow-xs flex items-center justify-center gap-1"
                >
                  <span>Book Now</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
