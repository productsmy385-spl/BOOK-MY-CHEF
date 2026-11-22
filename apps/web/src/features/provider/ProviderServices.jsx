import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProviderServices() {
  const navigate = useNavigate();

  const services = [
    {
      id: 1,
      title: 'Chef Visits Home (Live Feast)',
      desc: 'Chef cooks on-site in customer kitchen using traditional brass and copper vessels.',
      price: '₹1,500 base + ₹350/guest',
      active: true,
    },
    {
      id: 2,
      title: 'Cook & Deliver Banquet',
      desc: 'Prepared in studio kitchen, delivered in hot thermal packs with fresh banana leaves.',
      price: '₹400/guest (Min 15 guests)',
      active: true,
    },
    {
      id: 3,
      title: 'Royal Andhra 5-Course Package',
      desc: 'Signature multi-course feast with Gutti Vankaya, Mango Pappu, and fresh Bobbatlu.',
      price: '₹1,499/guest',
      active: true,
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white">
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="font-sora font-extrabold text-lg text-[#172033]">Services &amp; Packages</h2>
          <p className="font-sora text-xs text-[#64748B]">Manage your active culinary listings &amp; rates</p>
        </div>
        <button
          onClick={() => navigate('/provider/onboarding/step-4')}
          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Add New</span>
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {services.map((svc) => (
          <div key={svc.id} className="p-4 rounded-lg bg-white border border-[#E5E7EB] shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="font-sora font-bold text-sm text-[#172033]">{svc.title}</h4>
              <span className="px-2 py-0.5 rounded-sm bg-[#10B981]/15 text-[#10B981] font-sans text-[10px] font-bold">
                ACTIVE
              </span>
            </div>
            <p className="font-sans text-xs text-[#64748B]">{svc.desc}</p>
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs font-sans">
              <span className="font-extrabold text-[#0D47A1] font-sora">{svc.price}</span>
              <button
                onClick={() => navigate('/provider/onboarding/step-5')}
                className="text-[#2196F3] font-bold hover:underline"
              >
                Edit Rates
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
