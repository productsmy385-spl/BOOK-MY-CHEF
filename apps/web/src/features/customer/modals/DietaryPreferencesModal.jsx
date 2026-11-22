import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';

export default function DietaryPreferencesModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const storageKey = `bmc_dietary_prefs_${user?.id || 'guest'}`;

  const [dietaryTypes, setDietaryTypes] = useState(['Pure Vegetarian']);
  const [allergens, setAllergens] = useState([]);
  const [spiceLevel, setSpiceLevel] = useState('Medium');
  const [vesselPreference, setVesselPreference] = useState('Separate Veg Cookware Preferred');
  const [isSaved, setIsSaved] = useState(false);

  const DIETARY_OPTIONS = [
    'Pure Vegetarian',
    'Jain (No Root Veggies)',
    'Vegan',
    'Halal Certified',
    'Eggetarian',
    'Non-Vegetarian',
  ];

  const ALLERGEN_OPTIONS = [
    'Peanuts & Tree Nuts',
    'Gluten / Wheat',
    'Dairy / Lactose',
    'Seafood / Shellfish',
    'Soy & Tofu',
    'Mustard Seeds',
    'Garlic & Onion',
  ];

  const SPICE_LEVELS = ['Mild', 'Medium', 'Andhra Spicy (Fiery)'];

  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.dietaryTypes) setDietaryTypes(parsed.dietaryTypes);
        if (parsed.allergens) setAllergens(parsed.allergens);
        if (parsed.spiceLevel) setSpiceLevel(parsed.spiceLevel);
        if (parsed.vesselPreference) setVesselPreference(parsed.vesselPreference);
      } catch (e) {
        // use default
      }
    }
  }, [isOpen, storageKey]);

  if (!isOpen) return null;

  const toggleDiet = (item) => {
    setDietaryTypes(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const toggleAllergen = (item) => {
    setAllergens(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const handleSave = () => {
    const data = { dietaryTypes, allergens, spiceLevel, vesselPreference };
    localStorage.setItem(storageKey, JSON.stringify(data));
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sora">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#f8faff] to-[#E3F2FD]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2196F3] text-[22px]">nutrition</span>
            <div>
              <h3 className="font-bold text-sm text-[#172033]">Dietary Preferences &amp; Allergens</h3>
              <p className="font-inter text-xs text-[#64748B]">Auto-attached to all chef booking briefs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#172033] shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-4 font-inter text-xs">
          {isSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
              <span>Preferences saved and synced with your chef bookings!</span>
            </div>
          )}

          {/* Dietary Type */}
          <div>
            <h4 className="font-sora font-bold text-xs text-[#172033] mb-2">Dietary Orientation</h4>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleDiet(item)}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    dietaryTypes.includes(item)
                      ? 'bg-[#E3F2FD] border-[#2196F3] text-[#0D47A1] font-bold shadow-xs'
                      : 'bg-white border-[#E5E7EB] text-[#64748B] hover:border-[#90CAF9]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div>
            <h4 className="font-sora font-bold text-xs text-[#172033] mb-2">Allergens &amp; Strict Exclusions</h4>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAllergen(item)}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    allergens.includes(item)
                      ? 'bg-red-50 border-red-300 text-red-700 font-bold shadow-xs'
                      : 'bg-white border-[#E5E7EB] text-[#64748B] hover:border-[#90CAF9]'
                  }`}
                >
                  {allergens.includes(item) && '⚠ '}
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Spice Level */}
          <div>
            <h4 className="font-sora font-bold text-xs text-[#172033] mb-2">Spice Level Tolerance</h4>
            <div className="grid grid-cols-3 gap-2">
              {SPICE_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSpiceLevel(lvl)}
                  className={`py-2 px-2 text-center rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    spiceLevel === lvl
                      ? 'bg-[#0D47A1] border-[#0D47A1] text-white font-bold'
                      : 'bg-white border-[#E5E7EB] text-[#64748B] hover:border-[#90CAF9]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Cookware preference */}
          <div>
            <h4 className="font-sora font-bold text-xs text-[#172033] mb-1.5">Kitchen Cookware Hygiene</h4>
            <select
              value={vesselPreference}
              onChange={(e) => setVesselPreference(e.target.value)}
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] outline-none bg-white"
            >
              <option value="Separate Veg Cookware Preferred">Separate Veg Cookware Preferred</option>
              <option value="Chef Brings Own Traditional Brass/Copper Vessels">Chef Brings Own Traditional Brass/Copper Vessels</option>
              <option value="Host Provides Cookware in On-Site Kitchen">Host Provides Cookware in On-Site Kitchen</option>
              <option value="No Specific Requirement">No Specific Requirement</option>
            </select>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#CBD5E1] text-xs font-semibold text-[#172033] hover:bg-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary py-2 px-5 text-xs font-bold font-sora cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
