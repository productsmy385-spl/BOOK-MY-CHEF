import React, { useState, useEffect } from 'react';

/**
 * Universal Marketplace Filter Drawer
 * Production-ready filter panel operating on the SAME PAGE.
 * Desktop: Responsive right-side drawer.
 * Mobile: Bottom sheet / slide-up panel.
 * Adheres strictly to Sharp Geometry Design System & WCAG AAA contrast tokens.
 */
export default function MarketplaceFilterDrawer({
  isOpen,
  onClose,
  initialFilters = {},
  onApply,
}) {
  // 1. Service Categories (Multi-select)
  const ALL_CATEGORIES = [
    { id: 'HOME_CHEF', label: 'Home Chef', icon: 'soup_kitchen' },
    { id: 'PRO_CHEF', label: 'Professional Chef', icon: 'restaurant' },
    { id: 'CATERING', label: 'Catering Banquet', icon: 'room_service' },
    { id: 'PLANNER', label: 'Event Planner', icon: 'event_note' },
    { id: 'DECOR', label: 'Decoration', icon: 'filter_vintage' },
    { id: 'PHOTOGRAPHY', label: 'Photography', icon: 'photo_camera' },
    { id: 'VIDEOGRAPHY', label: 'Videography', icon: 'videocam' },
    { id: 'BARTENDER', label: 'Bartender / Mixologist', icon: 'local_bar' },
    { id: 'SERVER', label: 'Serving Staff', icon: 'person_apron' },
  ];

  // 2. Cuisines (Multi-select)
  const ALL_CUISINES = [
    'Andhra',
    'Telangana',
    'South Indian',
    'North Indian',
    'Chinese',
    'Italian',
    'Continental',
    'Mediterranean',
    'Mexican',
    'Custom Cuisine',
  ];

  // 3. Pricing Models
  const PRICING_MODELS = [
    { id: 'ALL', label: 'All Pricing Models' },
    { id: 'PER_PERSON', label: 'Per Person' },
    { id: 'PER_PLATE', label: 'Per Plate / Item' },
    { id: 'PER_EVENT', label: 'Per Event Package' },
  ];

  // 4. Service Modes
  const SERVICE_MODES = [
    { id: 'CHEF_VISITS_HOME', label: 'Chef Cooks at Home', icon: 'home' },
    { id: 'COOK_AND_DELIVER', label: 'Cook & Deliver Banquet', icon: 'local_shipping' },
    { id: 'VENUE_BANQUET', label: 'Venue Banquet Setup', icon: 'celebration' },
  ];

  // Local filter draft state
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [pricingModel, setPricingModel] = useState('ALL');
  const [cityArea, setCityArea] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [availabilityMode, setAvailabilityMode] = useState('ANY'); // 'ANY' | 'TODAY' | 'TOMORROW' | 'CUSTOM_DATE'
  const [customDate, setCustomDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('ANY'); // 'ANY' | 'LUNCH' | 'DINNER' | 'ALL_DAY'
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0); // 0 | 4.5 | 4.8
  const [selectedModes, setSelectedModes] = useState([]);

  // Synchronize initial state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedCategories(initialFilters.categories || []);
      setSelectedCuisines(initialFilters.cuisines || []);
      setMinPrice(initialFilters.minPrice || '');
      setMaxPrice(initialFilters.maxPrice || '');
      setPricingModel(initialFilters.pricingModel || 'ALL');
      setCityArea(initialFilters.cityArea || '');
      setRadiusKm(initialFilters.radiusKm || 25);
      setAvailabilityMode(initialFilters.availabilityMode || 'ANY');
      setCustomDate(initialFilters.customDate || '');
      setTimeSlot(initialFilters.timeSlot || 'ANY');
      setVerifiedOnly(Boolean(initialFilters.verifiedOnly));
      setMinRating(initialFilters.minRating || 0);
      setSelectedModes(initialFilters.serviceModes || []);
    }
  }, [isOpen, initialFilters]);

  if (!isOpen) return null;

  // Toggle helpers
  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleCuisine = (cuisine) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const toggleMode = (modeId) => {
    setSelectedModes((prev) =>
      prev.includes(modeId) ? prev.filter((m) => m !== modeId) : [...prev, modeId]
    );
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSelectedCuisines([]);
    setMinPrice('');
    setMaxPrice('');
    setPricingModel('ALL');
    setCityArea('');
    setRadiusKm(25);
    setAvailabilityMode('ANY');
    setCustomDate('');
    setTimeSlot('ANY');
    setVerifiedOnly(false);
    setMinRating(0);
    setSelectedModes([]);
  };

  const handleApply = () => {
    const filterPayload = {
      categories: selectedCategories,
      cuisines: selectedCuisines,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      pricingModel,
      cityArea: cityArea.trim(),
      radiusKm: Number(radiusKm),
      availabilityMode,
      customDate,
      timeSlot,
      verifiedOnly,
      minRating: Number(minRating),
      serviceModes: selectedModes,
    };
    onApply(filterPayload);
    onClose();
  };

  // Count active filters
  const activeCount =
    selectedCategories.length +
    selectedCuisines.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (pricingModel !== 'ALL' ? 1 : 0) +
    (cityArea ? 1 : 0) +
    (radiusKm !== 25 ? 1 : 0) +
    (availabilityMode !== 'ANY' ? 1 : 0) +
    (timeSlot !== 'ANY' ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    selectedModes.length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sora">
      {/* Semi-transparent Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Filter Panel (Desktop: Right-side Drawer / Mobile: Full Width Slide) */}
      <div className="relative w-full sm:w-[440px] md:w-[480px] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200 border-l border-[#CBD5E1]">
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#0D47A1] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[18px] text-[#90CAF9]">tune</span>
            </div>
            <div>
              <h2 className="heading-3 text-base text-[#172033]">Marketplace Filters</h2>
              <span className="text-[11px] text-[#64748B] font-inter">
                {activeCount > 0 ? `${activeCount} active filter${activeCount === 1 ? '' : 's'} applied` : 'Refine by category, cuisine & budget'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-[#DC2626] hover:underline px-2 py-1"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Filter Options Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6 font-inter text-xs">
          {/* Section 1: Service Categories */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
                1. Service Categories
              </label>
              {selectedCategories.length > 0 && (
                <span className="text-[10px] font-bold text-[#0D47A1] bg-[#E3F2FD] px-2 py-0.5 rounded">
                  {selectedCategories.length} selected
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-2.5 rounded-md border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-[#2196F3] bg-[#E3F2FD] text-[#0D47A1] font-bold shadow-xs'
                        : 'border-[#CBD5E1] bg-white text-[#172033] hover:border-[#90CAF9]'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-[#0D47A1]' : 'text-[#64748B]'}`}>
                      {cat.icon}
                    </span>
                    <span className="truncate text-xs font-sora">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Cuisines & Culinary Styles */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
                2. Cuisines &amp; Menus
              </label>
              {selectedCuisines.length > 0 && (
                <span className="text-[10px] font-bold text-[#0D47A1] bg-[#E3F2FD] px-2 py-0.5 rounded">
                  {selectedCuisines.length} selected
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CUISINES.map((cuisine) => {
                const isSelected = selectedCuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleCuisine(cuisine)}
                    className={`px-3 py-1.5 rounded-md text-xs font-sora font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-xs'
                        : 'bg-[#F8FAFC] text-[#172033] border-[#CBD5E1] hover:border-[#90CAF9]'
                    }`}
                  >
                    {cuisine}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Budget Range & Pricing Architecture */}
          <div>
            <label className="block font-sora font-bold text-xs text-[#172033] uppercase tracking-wider mb-2.5">
              3. Budget &amp; Pricing Model
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <span className="text-[10px] text-[#64748B] block mb-1">Min Price (₹)</span>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[#CBD5E1] font-mono text-xs text-[#172033] focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block mb-1">Max Price (₹)</span>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[#CBD5E1] font-mono text-xs text-[#172033] focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none"
                />
              </div>
            </div>

            {/* Pricing Model Tabs */}
            <div className="grid grid-cols-2 gap-1.5">
              {PRICING_MODELS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPricingModel(pm.id)}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-sora font-semibold border text-center transition-all ${
                    pricingModel === pm.id
                      ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#0D47A1]'
                      : 'bg-white border-[#E5E7EB] text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Location & Travel Radius */}
          <div>
            <label className="block font-sora font-bold text-xs text-[#172033] uppercase tracking-wider mb-2">
              4. Location &amp; Distance Radius
            </label>
            <div className="relative mb-2.5">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#2196F3] text-[18px]">
                location_on
              </span>
              <input
                type="text"
                placeholder="City or Area (e.g. Jubilee Hills, Hyderabad)"
                value={cityArea}
                onChange={(e) => setCityArea(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-[#CBD5E1] text-xs text-[#172033] focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
              <span>Service Radius:</span>
              <strong className="font-sora text-[#0D47A1]">{radiusKm} km</strong>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="w-full accent-[#0D47A1] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono mt-0.5">
              <span>5km</span>
              <span>25km</span>
              <span>60km</span>
            </div>
          </div>

          {/* Section 5: Availability Dates & Time Slots */}
          <div>
            <label className="block font-sora font-bold text-xs text-[#172033] uppercase tracking-wider mb-2.5">
              5. Date Availability
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-2.5">
              {[
                { id: 'ANY', label: 'Any Date' },
                { id: 'TODAY', label: 'Available Today' },
                { id: 'TOMORROW', label: 'Tomorrow' },
              ].map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvailabilityMode(av.id)}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-sora font-semibold border text-center transition-all ${
                    availabilityMode === av.id
                      ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                      : 'bg-white border-[#CBD5E1] text-[#172033]'
                  }`}
                >
                  {av.label}
                </button>
              ))}
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setAvailabilityMode('CUSTOM_DATE');
                }}
                className="flex-1 h-10 px-3 rounded-md border border-[#CBD5E1] text-xs text-[#172033] outline-none focus:border-[#2196F3]"
              />
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="h-10 px-3 rounded-md border border-[#CBD5E1] text-xs text-[#172033] bg-white outline-none focus:border-[#2196F3]"
              >
                <option value="ANY">Any Time Slot</option>
                <option value="LUNCH">Lunch (12:00 - 3:30 PM)</option>
                <option value="DINNER">Dinner (07:00 - 10:30 PM)</option>
                <option value="ALL_DAY">Full Day Event</option>
              </select>
            </div>
          </div>

          {/* Section 6: Provider Attributes & Service Modes */}
          <div className="pt-2 border-t border-[#E5E7EB]">
            <label className="block font-sora font-bold text-xs text-[#172033] uppercase tracking-wider mb-2.5">
              6. Verification &amp; Service Modes
            </label>

            {/* Verified Only Switch */}
            <label className="flex items-center justify-between p-3 rounded-md bg-[#F8FAFC] border border-[#CBD5E1] cursor-pointer mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0D47A1] text-[18px]">verified</span>
                <div>
                  <span className="font-sora font-bold text-xs text-[#172033] block">100% Background-Verified</span>
                  <span className="text-[10px] text-[#64748B]">FSSAI hygiene certified &amp; police verified cooks</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#0D47A1] focus:ring-[#2196F3]"
              />
            </label>

            {/* Minimum Rating */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] text-[#64748B]">Rating:</span>
              {[
                { val: 0, label: 'All Ratings' },
                { val: 4.5, label: '★ 4.5+' },
                { val: 4.8, label: '★ 4.8+ Masterchef' },
              ].map((rt) => (
                <button
                  key={rt.val}
                  type="button"
                  onClick={() => setMinRating(rt.val)}
                  className={`py-1 px-2.5 rounded-md text-[11px] font-sora font-semibold border transition-all ${
                    minRating === rt.val
                      ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#0D47A1]'
                      : 'bg-white border-[#E5E7EB] text-[#64748B]'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>

            {/* Service Modes Multi-Select */}
            <div className="flex flex-col gap-1.5">
              {SERVICE_MODES.map((sm) => {
                const isSelected = selectedModes.includes(sm.id);
                return (
                  <button
                    key={sm.id}
                    type="button"
                    onClick={() => toggleMode(sm.id)}
                    className={`p-2.5 rounded-md border text-left flex items-center gap-2 text-xs transition-all ${
                      isSelected
                        ? 'border-[#2196F3] bg-[#E3F2FD] text-[#0D47A1] font-bold'
                        : 'border-[#E5E7EB] bg-white text-[#172033]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#2196F3]">{sm.icon}</span>
                    <span className="font-sora">{sm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel Footer: Action Buttons */}
        <div className="p-4 border-t border-[#E5E7EB] bg-white shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            className="btn-secondary flex-1 py-3 text-xs font-bold"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="btn-primary flex-2 py-3 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            <span>Apply Filters {activeCount > 0 ? `(${activeCount})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
