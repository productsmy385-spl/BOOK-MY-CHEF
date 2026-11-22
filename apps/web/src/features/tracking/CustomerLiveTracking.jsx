import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';
import { useBookingStore } from '../../stores/useBookingStore';
import { api } from '../../services/api';

export default function CustomerLiveTracking() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { provider, activeBooking } = useBookingStore();
  const [bookingData, setBookingData] = useState(null);
  const [currentStep, setCurrentStep] = useState(2); // 2 = In Transit
  const [isLoading, setIsLoading] = useState(true);

  const effectiveBookingId = id || activeBooking?.bookingId || '5f154cff-3dcf-43ad-b22a-793b3fac436a';

  useEffect(() => {
    let isMounted = true;

    async function fetchTrackingStatus() {
      try {
        const res = await api.bookings.getById(effectiveBookingId);
        if (res?.data && isMounted) {
          setBookingData(res.data);
          const st = res.data.bookingStatus;
          if (st === 'CONFIRMED' || st === 'PROVIDER_ACCEPTED') setCurrentStep(1);
          else if (st === 'IN_PROGRESS') setCurrentStep(3);
          else if (st === 'COMPLETED') setCurrentStep(6);
        }
      } catch (err) {
        console.warn('Real-time tracking fetch fallback:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchTrackingStatus();
    const interval = setInterval(fetchTrackingStatus, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [effectiveBookingId]);

  const steps = [
    { id: 1, title: 'Fresh Groceries & Spices Procured', time: '08:30 AM', completed: currentStep >= 1 },
    { id: 2, title: 'Departed Base Kitchen (In Transit)', time: '10:00 AM', completed: currentStep >= 2, active: currentStep === 2 },
    { id: 3, title: 'Arrived at Jubilee Hills Venue', time: 'Est. 10:35 AM', completed: currentStep >= 3 },
    { id: 4, title: 'Kitchen Sanitized & Cooking Underway', time: 'Est. 11:00 AM', completed: currentStep >= 4 },
    { id: 5, title: 'Feast Plated & Served Warm', time: 'Est. 12:30 PM', completed: currentStep >= 5 },
    { id: 6, title: 'Kitchen Clean-up & Final Handover', time: 'Est. 02:00 PM', completed: currentStep >= 6 },
  ];

  const bookingRef = bookingData?.bookingReference || activeBooking?.bookingReference || '#BMC-6821-HYD';
  const isCompleted = bookingData?.bookingStatus === 'COMPLETED' || currentStep === 6;

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 bg-white">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-sans font-semibold text-[#64748B] hover:text-[#172033]">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back</span>
        </button>
        <span className="font-sora text-xs font-bold text-[#0D47A1]">Live Event Tracking</span>
        <span className="px-2 py-0.5 rounded-sm bg-[#10B981]/15 text-[#10B981] font-sans text-[10px] font-bold">
          {isCompleted ? 'COMPLETED' : 'LIVE'}
        </span>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4">
        {/* Live ETA Card (Stitch Screen 24 - Sharp Geometry) */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-[#0D47A1] to-[#2196F3] text-white shadow-md flex items-center justify-between">
          <div>
            <span className="font-sora text-[10px] uppercase tracking-wider text-[#90CAF9] font-bold block">
              Booking Ref: {bookingRef}
            </span>
            <h3 className="font-sora font-extrabold text-xl leading-tight mt-0.5">
              {isCompleted ? 'Feast Successfully Completed!' : 'Chef Raghavendra is 12 mins away'}
            </h3>
            <p className="font-sans text-xs text-white/90 mt-0.5">
              {isCompleted ? 'Kitchen sanitized & inspected. Escrow ready for release.' : 'En route on Road No. 36 • Driving Swift Dzire'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-md bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 animate-pulse border border-white/20">
            <span className="material-symbols-outlined text-[28px] text-white">
              {isCompleted ? 'task_alt' : 'navigation'}
            </span>
          </div>
        </div>

        {/* Chef Contact Strip */}
        <div className="p-4 rounded-lg bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-md overflow-hidden ring-1 ring-[#90CAF9] flex-shrink-0">
              <img src={ASSETS.chefRaghavendraTracking} alt={provider.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#0D47A1] text-[14px] fill-1">verified</span>
                <span className="font-sora text-[10px] font-bold text-[#0D47A1]">Assigned Masterchef</span>
              </div>
              <h4 className="font-sora font-bold text-sm text-[#172033]">{provider.name}</h4>
              <p className="font-sans text-xs text-[#64748B]">OTP for Arrival: <strong className="text-[#0D47A1] font-sora">4892</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/provider/chat')}
              className="w-9 h-9 rounded-md bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center hover:bg-[#90CAF9] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </button>
            <a
              href="tel:+919849012345"
              className="w-9 h-9 rounded-md bg-[#2196F3] text-white flex items-center justify-center hover:bg-[#0D47A1] transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
            </a>
          </div>
        </div>

        {/* Live Service Timeline (Stitch Checklist - Sharp Geometry) */}
        <div className="p-4 rounded-lg bg-white border border-[#E5E7EB] shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
              Event-Day Live Checklist
            </span>
            <span className="font-sans text-[10px] text-[#2196F3] font-bold">
              {isCompleted ? 'All Steps Completed' : `Step ${currentStep} of 6 Active`}
            </span>
          </div>

          <div className="flex flex-col gap-4 relative pl-2">
            <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-[#E5E7EB]"></div>

            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3.5 relative z-10">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center font-sora text-xs font-bold transition-all ${
                  step.completed
                    ? 'bg-[#10B981] text-white ring-2 ring-[#10B981]/20'
                    : step.active
                    ? 'bg-[#2196F3] text-white ring-2 ring-[#2196F3]/30 animate-pulse'
                    : 'bg-[#f1f3ff] text-[#64748B] border border-[#E5E7EB]'
                }`}>
                  {step.completed ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    step.id
                  )}
                </div>

                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <h5 className={`font-sora text-xs font-bold ${
                      step.completed ? 'text-[#172033]' : step.active ? 'text-[#0D47A1]' : 'text-[#64748B]'
                    }`}>
                      {step.title}
                    </h5>
                    <span className="font-sans text-[10px] text-[#64748B]">{step.time}</span>
                  </div>
                  {step.active && (
                    <span className="inline-block mt-1 font-sans text-[10px] font-bold text-[#2196F3] bg-[#E3F2FD] px-2 py-0.5 rounded-sm">
                      In Progress Right Now
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate Chef Button when Completed */}
        {isCompleted && (
          <div className="p-4 rounded-lg bg-[#f8faff] border border-[#90CAF9] flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-[#FFB300] text-[32px] fill-1">star</span>
            <div>
              <h4 className="font-sora font-bold text-sm text-[#172033]">How was your dining experience?</h4>
              <p className="font-sans text-xs text-[#64748B] mt-0.5">Your rating releases the provider escrow and updates chef rankings.</p>
            </div>
            <button
              onClick={() => navigate(`/review/${effectiveBookingId}`)}
              className="w-full btn-primary py-3 text-xs"
            >
              Rate Chef &amp; Share Feedback
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
