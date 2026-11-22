import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';
import { useBookingStore } from '../../stores/useBookingStore';

export default function HostReviewSubmission() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { provider, activeBooking } = useBookingStore();
  const [overallRating, setOverallRating] = useState(5);
  const [tasteRating, setTasteRating] = useState(5);
  const [hygieneRating, setHygieneRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [hospitalityRating, setHospitalityRating] = useState(5);
  const [reviewText, setReviewText] = useState(
    'Chef Raghavendra prepared the most incredible Gutti Vankaya and hot ghee Pappu for our Gruhapravesam! Guests were praising the flavors. He left the kitchen spotless.'
  );
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      navigate('/bookings');
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 bg-white">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-sora font-semibold text-[#64748B] hover:text-[#172033]">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back</span>
        </button>
        <span className="font-sora text-xs font-bold text-[#0D47A1]">Host Review &amp; Rating</span>
        <span className="font-sora text-xs text-[#2196F3] font-semibold">{activeBooking.bookingReference}</span>
      </div>

      <form onSubmit={handleSubmit} className="px-4 mt-4 flex flex-col gap-5">
        {/* Chef Summary */}
        <div className="p-4 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-[#90CAF9] flex-shrink-0">
            <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-sora font-bold text-sm text-[#172033]">{provider.name}</h4>
            <p className="font-sora text-xs text-[#64748B]">{provider.cuisines}</p>
            <span className="text-[10px] font-sora font-semibold text-[#2196F3]">Event Delivered: 28 Nov 2026</span>
          </div>
        </div>

        {/* Overall Star Rating (Stitch Interactive Stepper) */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col items-center justify-center text-center">
          <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider mb-2">
            Overall Culinary Experience
          </span>
          <div className="flex items-center gap-2 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setOverallRating(star)}
                className="text-amber-400 hover:scale-110 active:scale-95 transition-transform"
              >
                <span className={`material-symbols-outlined text-[36px] ${star <= overallRating ? 'fill-1 text-[#FFB300]' : 'text-[#E5E7EB]'}`}>
                  star
                </span>
              </button>
            ))}
          </div>
          <span className="font-sora font-bold text-sm text-[#0D47A1]">
            {overallRating === 5 ? 'Exceptional Luxury Feast (5.0)' : `${overallRating}.0 of 5.0 Stars`}
          </span>
        </div>

        {/* Detailed Criteria Sliders */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-3.5">
          <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
            Granular Hospitality Feedback
          </span>

          <div className="flex flex-col gap-3 text-xs font-sora">
            {/* Taste */}
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-medium">Food Taste &amp; Authenticity:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setTasteRating(s)}>
                    <span className={`material-symbols-outlined text-[20px] ${s <= tasteRating ? 'fill-1 text-[#FFB300]' : 'text-[#E5E7EB]'}`}>star</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hygiene */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span className="text-[#64748B] font-medium">Kitchen Hygiene &amp; Cleanliness:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setHygieneRating(s)}>
                    <span className={`material-symbols-outlined text-[20px] ${s <= hygieneRating ? 'fill-1 text-[#FFB300]' : 'text-[#E5E7EB]'}`}>star</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Punctuality */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span className="text-[#64748B] font-medium">Punctuality &amp; Serving Schedule:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setPunctualityRating(s)}>
                    <span className={`material-symbols-outlined text-[20px] ${s <= punctualityRating ? 'fill-1 text-[#FFB300]' : 'text-[#E5E7EB]'}`}>star</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hospitality */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span className="text-[#64748B] font-medium">Hospitality &amp; Professionalism:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setHospitalityRating(s)}>
                    <span className={`material-symbols-outlined text-[20px] ${s <= hospitalityRating ? 'fill-1 text-[#FFB300]' : 'text-[#E5E7EB]'}`}>star</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Written Review Textarea */}
        <div>
          <label className="block font-sora font-bold text-xs text-[#172033] mb-1.5 uppercase tracking-wider">
            Written Review for Host Community
          </label>
          <textarea
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-[#f1f3ff] border border-[#E5E7EB] font-sora text-xs text-[#172033] focus:ring-2 focus:ring-[#90CAF9] focus:bg-white outline-none leading-relaxed"
          ></textarea>
        </div>

        {/* Dish Photos Attachment Preview */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-2.5">
          <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
            Attach Event Dish Photos
          </span>
          <div className="flex gap-2.5">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#E5E7EB]">
              <img src={ASSETS.bannerAndhraHomeFeast} alt="Plating" className="w-full h-full object-cover" />
            </div>
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-[#90CAF9] bg-[#E3F2FD]/30 flex flex-col items-center justify-center text-[#2196F3] cursor-pointer hover:bg-[#E3F2FD] transition-colors">
              <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
              <span className="font-sora text-[9px] font-bold">Add Photo</span>
            </div>
          </div>
        </div>

        {/* Escrow Release Notice */}
        <div className="p-3 rounded-2xl bg-[#E3F2FD] border border-[#90CAF9] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#0D47A1] text-[22px]">payments</span>
          <p className="font-sora text-[11px] text-[#0D47A1] leading-relaxed">
            Submitting this review confirms satisfactory service delivery and releases the held escrow funds to Chef Raghavendra's wallet.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitted}
          className="w-full py-3.5 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
        >
          {submitted ? (
            <span>Feedback Recorded! Releasing Escrow...</span>
          ) : (
            <>
              <span>Submit Review &amp; Release Escrow</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
