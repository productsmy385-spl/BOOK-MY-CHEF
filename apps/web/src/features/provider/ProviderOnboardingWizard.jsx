import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProviderStore } from '../../stores/useProviderStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { api } from '../../services/api';
import { ASSETS } from '../../assets/assetCatalog';

export default function ProviderOnboardingWizard() {
  const navigate = useNavigate();
  const { stepNumber } = useParams();
  const currentStep = parseInt(stepNumber || '1', 10);
  const { onboarding, updateOnboarding } = useProviderStore();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 9;

  const goToStep = (step) => {
    if (step >= 1 && step <= totalSteps) {
      navigate(`/provider/onboarding/step-${step}`);
    }
  };

  const serviceRolesList = [
    { id: 'PRO_CHEF', label: 'Professional Master Chef', icon: 'restaurant', desc: 'Hotel or fine-dining culinary leadership' },
    { id: 'HOME_CHEF', label: 'Home Chef / Regional Cook', icon: 'soup_kitchen', desc: 'Authentic traditional family recipes' },
    { id: 'PERSONAL_CHEF', label: 'Personal / Private Chef', icon: 'person', desc: 'Exclusive recurring or villa dining' },
    { id: 'CATERER', label: 'Catering Provider', icon: 'room_service', desc: 'Bulk banquets for 50 to 500+ guests' },
    { id: 'PLANNER', label: 'Event Planner & Manager', icon: 'event_note', desc: 'End-to-end wedding or gala coordination' },
    { id: 'DECORATOR', label: 'Floral & Stage Decorator', icon: 'filter_vintage', desc: 'Mandap, lighting, and theme setups' },
    { id: 'STAFF', label: 'Waiter & Serving Staff', icon: 'local_bar', desc: 'Uniformed hospitality servers' },
  ];

  const cuisinesList = [
    'Andhra Royal & Spicy', 'Telangana Heritage', 'South Indian Classic', 'North Indian & Mughlai',
    'Indo-Chinese Gourmet', 'Continental & Italian', 'Pure Vegan', 'Jain Specialty', 'Coastal Seafood'
  ];

  const pricingModels = [
    { id: 'PER_PERSON', title: 'Per Person / Per Head', desc: 'Charge ₹X for each attending guest (Recommended)' },
    { id: 'PER_EVENT', title: 'Fixed Event Price', desc: 'Single lump sum fee regardless of small variations' },
    { id: 'PER_HOUR', title: 'Hourly Consulting Rate', desc: 'Hourly cooking and prep rate' },
    { id: 'BASE_PLUS_INGREDIENTS', title: 'Base Visiting Fee + Food Cost', desc: 'Fixed chef arrival charge plus grocery cost' },
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleRole = (roleId) => {
    const roles = onboarding.roles.includes(roleId)
      ? onboarding.roles.filter(r => r !== roleId)
      : [...onboarding.roles, roleId];
    updateOnboarding({ roles });
  };

  const toggleCuisine = (cuisine) => {
    const specializations = onboarding.specializations.includes(cuisine)
      ? onboarding.specializations.filter(c => c !== cuisine)
      : [...onboarding.specializations, cuisine];
    updateOnboarding({ specializations });
  };

  const toggleDay = (day) => {
    const availableDays = onboarding.availableDays.includes(day)
      ? onboarding.availableDays.filter(d => d !== day)
      : [...onboarding.availableDays, day];
    updateOnboarding({ availableDays });
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    const userId = user?.id || 'c3d4e5f6-a7b8-9012-cdef-123456789012';
    try {
      const payload = {
        professionalName: onboarding.basicInfo?.fullName || user?.name || 'Professional Chef',
        businessName: onboarding.basicInfo?.brandName || 'Culinary Atelier',
        primaryRole: onboarding.roles?.[0] || 'PRO_CHEF',
        bio: onboarding.basicInfo?.bio || 'Verified Culinary Professional with Book My Chef',
        experienceYears: parseInt(onboarding.basicInfo?.experienceYears || '10', 10),
        serviceRadiusKm: parseInt(onboarding.serviceRadiusKm || '25', 10),
        startingPrice: parseFloat(onboarding.basePrice || '1500'),
        pricingModel: onboarding.pricingModel || 'PER_PERSON',
        fssaiLicense: onboarding.basicInfo?.fssaiLicense || '10023000000001',
      };
      await api.providers.setupProfile(userId, payload);
      navigate('/provider', { replace: true });
    } catch (err) {
      console.warn('Profile setup sync fallback:', err.message);
      navigate('/provider', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-32 pt-2 bg-white font-sora">
      {/* Header & Step Tracker */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <button
          onClick={() => currentStep > 1 ? goToStep(currentStep - 1) : navigate('/provider')}
          className="btn-ghost p-1 flex items-center gap-1 text-xs"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{currentStep > 1 ? 'Previous' : 'Cancel'}</span>
        </button>
        <span className="font-sora text-xs font-bold text-[#0D47A1]">
          Step {currentStep} of {totalSteps}
        </span>
        <button
          onClick={() => navigate('/provider')}
          className="text-xs font-sora font-semibold text-[#2196F3] hover:underline"
        >
          Save &amp; Exit
        </button>
      </div>

      {/* Progress Bar (9 steps) */}
      <div className="w-full bg-[#F8FAFC] h-1.5 overflow-hidden">
        <div
          className="h-full bg-[#2196F3] transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-5">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="heading-3">Professional Identity</h2>
              <p className="body-sm">Introduce your culinary studio to prospective event hosts.</p>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1]">
              <div className="w-16 h-16 rounded-md overflow-hidden ring-1 ring-[#CBD5E1] shrink-0 bg-white">
                <img src={ASSETS.chefRaghavendraStudio} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <button type="button" className="btn-secondary py-1.5 px-3 text-xs">
                  Change Photo
                </button>
                <span className="block font-inter text-[11px] text-[#64748B] mt-1">High-res portrait in chef attire</span>
              </div>
            </div>

            <div>
              <label htmlFor="full-legal-name" className="block font-sora font-bold text-[10px] text-[#172033] mb-1.5 uppercase">Full Legal Name</label>
              <input
                id="full-legal-name"
                type="text"
                value={onboarding.basicInfo.fullName}
                onChange={(e) => updateOnboarding({ basicInfo: { ...onboarding.basicInfo, fullName: e.target.value } })}
                className="input-sharp w-full"
              />
            </div>

            <div>
              <label htmlFor="brand-name" className="block font-sora font-bold text-[10px] text-[#172033] mb-1.5 uppercase">Professional / Brand Name</label>
              <input
                id="brand-name"
                type="text"
                value={onboarding.basicInfo.brandName}
                onChange={(e) => updateOnboarding({ basicInfo: { ...onboarding.basicInfo, brandName: e.target.value } })}
                className="input-sharp w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="contact-mobile" className="block font-sora font-bold text-[10px] text-[#172033] mb-1.5 uppercase">Contact Mobile (OTP)</label>
                <input
                  id="contact-mobile"
                  type="text"
                  value={onboarding.basicInfo.phone}
                  readOnly
                  className="input-sharp w-full bg-[#F8FAFC] font-mono font-bold text-[#0D47A1]"
                />
              </div>
              <div>
                <label htmlFor="exp-years" className="block font-sora font-bold text-[10px] text-[#172033] mb-1.5 uppercase">Experience in Years</label>
                <input
                  id="exp-years"
                  type="number"
                  value={onboarding.basicInfo.experienceYears}
                  onChange={(e) => updateOnboarding({ basicInfo: { ...onboarding.basicInfo, experienceYears: parseInt(e.target.value, 10) } })}
                  className="input-sharp w-full"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio-text" className="block font-sora font-bold text-[10px] text-[#172033] mb-1.5 uppercase">Professional Biography</label>
              <textarea
                id="bio-text"
                rows={3}
                value={onboarding.basicInfo.bio}
                onChange={(e) => updateOnboarding({ basicInfo: { ...onboarding.basicInfo, bio: e.target.value } })}
                className="w-full p-3.5 rounded-md border border-[#CBD5E1] font-inter text-xs text-[#172033] outline-none leading-relaxed focus:border-[#2196F3] focus:ring-2 focus:ring-[#2196F3]/25"
              ></textarea>
            </div>
          </div>
        )}

        {/* Step 2: Select Service Roles */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="heading-3">Select Your Service Roles</h2>
              <p className="body-sm">Select one or multiple roles you provide for events.</p>
            </div>

            <div className="flex flex-col gap-3 font-inter">
              {serviceRolesList.map((role) => (
                <div
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`p-4 rounded-lg card-sharp cursor-pointer flex items-center justify-between transition-all ${
                    onboarding.roles.includes(role.id)
                      ? 'border-2 border-[#2196F3] bg-[#E3F2FD]/30 shadow-xs'
                      : 'hover:border-[#90CAF9]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      onboarding.roles.includes(role.id) ? 'bg-[#2196F3] text-white' : 'bg-[#F8FAFC] text-[#2196F3] border border-[#CBD5E1]'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">{role.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-sora font-bold text-sm text-[#172033]">{role.label}</h4>
                      <p className="font-inter text-xs text-[#64748B]">{role.desc}</p>
                    </div>
                  </div>
                  <span className={`w-5 h-5 rounded border flex items-center justify-center ${
                    onboarding.roles.includes(role.id) ? 'bg-[#2196F3] border-[#2196F3] text-white font-bold' : 'border-[#CBD5E1]'
                  }`}>
                    {onboarding.roles.includes(role.id) && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Specializations */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="heading-3">Cuisine &amp; Regional Mastery</h2>
              <p className="body-sm">Choose your primary culinary cuisines and cooking specialties.</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {cuisinesList.map((cuisine) => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => toggleCuisine(cuisine)}
                  className={`px-3.5 py-2 rounded-md font-sora text-xs font-semibold transition-all shadow-xs ${
                    onboarding.specializations.includes(cuisine)
                      ? 'bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1] ring-1 ring-[#90CAF9]'
                      : 'bg-white border border-[#CBD5E1] text-[#64748B] hover:border-[#90CAF9]'
                  }`}
                >
                  {onboarding.specializations.includes(cuisine) ? '✓ ' : ''}{cuisine}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Packages & Menus */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="heading-3">Signature Menus &amp; Packages</h2>
              <p className="body-sm">Configure package tiers that hosts can instantly explore and book.</p>
            </div>

            <div className="card-sharp p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="heading-4 text-sm">Royal Andhra 5-Course Feast</h4>
                <span className="font-sora font-extrabold text-[#0D47A1]">₹1,499 / guest</span>
              </div>
              <p className="font-inter text-xs text-[#64748B]">
                Includes Gutti Vankaya, Pappu, Bendakaya Pulusu, Gongura, Steamed Rice, Bobbatlu.
              </p>
              <div className="flex items-center gap-2">
                <span className="badge-sharp bg-[#F8FAFC] border border-[#CBD5E1] text-[#2196F3]">Min 10 Guests</span>
                <span className="badge-sharp bg-emerald-50 border border-emerald-200 text-[#059669]">Banana Leaf Service</span>
              </div>
            </div>

            <button type="button" className="w-full py-3 bg-white border-2 border-dashed border-[#90CAF9] text-[#2196F3] rounded-md font-sora text-xs font-bold hover:bg-[#E3F2FD] transition-colors flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add Another Package</span>
            </button>
          </div>
        )}

        {/* Step 5: Pricing Setup */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="heading-3">Pricing Architecture</h2>
              <p className="body-sm">You control your own pricing. The platform never imposes fixed rates.</p>
            </div>

            <div className="flex flex-col gap-3">
              {pricingModels.map((pm) => (
                <div
                  key={pm.id}
                  onClick={() => updateOnboarding({ pricingModel: pm.id })}
                  className={`card-sharp p-4 cursor-pointer transition-all ${
                    onboarding.pricingModel === pm.id
                      ? 'border-2 border-[#2196F3] bg-[#E3F2FD]/30 shadow-xs'
                      : 'hover:border-[#90CAF9]'
                  }`}
                >
                  <h4 className="heading-4 text-sm">{pm.title}</h4>
                  <p className="font-inter text-xs text-[#64748B] mt-0.5">{pm.desc}</p>
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="base-rate" className="block font-sora font-bold text-[10px] text-[#172033] mb-1.5 uppercase">Base Starting Rate (₹)</label>
              <input
                id="base-rate"
                type="number"
                value={onboarding.basePrice}
                onChange={(e) => updateOnboarding({ basePrice: parseInt(e.target.value, 10) })}
                className="input-sharp w-full font-mono font-bold text-[#0D47A1]"
              />
            </div>
          </div>
        )}

        {/* Step 6: Service Locations */}
        {currentStep === 6 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="heading-3">Service Locations &amp; Radius</h2>
              <p className="body-sm">Set your operational base kitchen and travel coverage.</p>
            </div>

            <div>
              <label htmlFor="travel-distance" className="block font-sora font-bold text-[10px] text-[#172033] mb-1.5 uppercase">Maximum Travel Distance (km)</label>
              <div className="flex items-center gap-4">
                <input
                  id="travel-distance"
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={onboarding.serviceRadiusKm}
                  onChange={(e) => updateOnboarding({ serviceRadiusKm: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#2196F3]"
                />
                <span className="font-sora font-extrabold text-base text-[#0D47A1] min-w-[70px]">
                  {onboarding.serviceRadiusKm} km
                </span>
              </div>
            </div>

            <div>
              <label className="block font-sora font-bold text-[10px] text-[#172033] mb-2 uppercase">Active Neighborhoods</label>
              <div className="flex flex-wrap gap-2">
                {onboarding.serviceLocations.map((loc) => (
                  <span key={loc} className="px-3 py-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md font-sora text-xs font-semibold text-[#172033]">
                    📍 {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Availability Schedule */}
        {currentStep === 7 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="heading-3">Weekly Availability Schedule</h2>
              <p className="body-sm">Choose days of the week when you accept bookings.</p>
            </div>

            <div className="flex flex-col gap-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`p-3.5 rounded-md border transition-all cursor-pointer flex items-center justify-between ${
                    onboarding.availableDays.includes(day)
                      ? 'border-[#2196F3] bg-[#E3F2FD]/20 font-bold'
                      : 'border-[#E5E7EB] bg-white text-[#64748B]'
                  }`}
                >
                  <span className="font-sora text-xs">{day}</span>
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                    onboarding.availableDays.includes(day) ? 'bg-[#2196F3] border-[#2196F3]' : 'border-[#CBD5E1]'
                  }`}>
                    {onboarding.availableDays.includes(day) && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Portfolio & Credentials */}
        {currentStep === 8 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="heading-3">Portfolio &amp; FSSAI Credentials</h2>
              <p className="body-sm">Upload food plating photos and government food safety certificates.</p>
            </div>

            <div>
              <label htmlFor="fssai-number" className="block font-sora font-bold text-[10px] text-[#172033] mb-1.5 uppercase">FSSAI Food License Number</label>
              <input
                id="fssai-number"
                type="text"
                value={onboarding.basicInfo.fssaiLicense}
                onChange={(e) => updateOnboarding({ basicInfo: { ...onboarding.basicInfo, fssaiLicense: e.target.value } })}
                className="input-sharp w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg border-2 border-dashed border-[#90CAF9] bg-[#E3F2FD]/20 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#E3F2FD]/40 transition-colors">
                <span className="material-symbols-outlined text-[#2196F3] text-[28px]">add_photo_alternate</span>
                <span className="font-sora text-xs font-bold text-[#0D47A1] mt-1">Upload Dish Photos</span>
                <span className="font-inter text-[11px] text-[#64748B]">JPEG, PNG up to 10MB</span>
              </div>
              <div className="p-4 rounded-lg border-2 border-dashed border-[#90CAF9] bg-[#E3F2FD]/20 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#E3F2FD]/40 transition-colors">
                <span className="material-symbols-outlined text-[#2196F3] text-[28px]">video_call</span>
                <span className="font-sora text-xs font-bold text-[#0D47A1] mt-1">Upload Cooking Demo</span>
                <span className="font-inter text-[11px] text-[#64748B]">MP4 up to 50MB</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Review & Submit */}
        {currentStep === 9 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="heading-3">Review Atelier Profile</h2>
              <p className="body-sm">Verify your professional details before submitting for verification.</p>
            </div>

            <div className="card-sharp p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-md overflow-hidden ring-1 ring-[#CBD5E1] shrink-0">
                  <img src={ASSETS.chefRaghavendraStudio} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="heading-4 text-sm">{onboarding.basicInfo.fullName}</h4>
                  <p className="font-sora text-xs text-[#2196F3] font-semibold">{onboarding.basicInfo.brandName}</p>
                  <span className="text-[11px] font-mono text-[#64748B]">FSSAI: {onboarding.basicInfo.fssaiLicense}</span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-[#F8FAFC] text-xs font-inter flex flex-col gap-1.5 border border-[#E5E7EB]">
                <p><strong>Roles:</strong> {onboarding.roles.join(', ')}</p>
                <p><strong>Cuisines:</strong> {onboarding.specializations.join(', ')}</p>
                <p><strong>Starting Rate:</strong> ₹{onboarding.basePrice} / guest ({onboarding.serviceRadiusKm} km coverage)</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#E3F2FD] border border-[#90CAF9] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#0D47A1] text-[22px]">verified</span>
              <p className="font-inter text-xs text-[#0D47A1] leading-relaxed">
                By submitting, you agree to the Atelier Quality &amp; Hygiene Standards and Escrow Payment Settlement Terms.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] p-4 shadow-xs pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          {currentStep < totalSteps ? (
            <button
              onClick={() => goToStep(currentStep + 1)}
              className="btn-primary w-full py-3.5 text-xs font-bold"
            >
              <span>Continue to Step {currentStep + 1}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] text-white rounded-md font-sora text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Atelier Profile...</span>
                </>
              ) : (
                <>
                  <span>Submit for Verification &amp; Open Studio</span>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
