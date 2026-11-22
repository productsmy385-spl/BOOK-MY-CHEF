import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProviderAlerts() {
  const navigate = useNavigate();
  const [showUrgentModal, setShowUrgentModal] = useState(false);

  const alerts = [
    {
      id: 1,
      type: 'BOOKING_LEAD',
      title: 'New Event Lead: Gruhapravesam Feast',
      desc: 'Meera Nambiar requested an Andhra Royal Feast for 25 Guests on 28 Nov 2026.',
      time: '10 mins ago',
      urgent: true,
      action: '/provider/chat',
    },
    {
      id: 2,
      type: 'ESCROW',
      title: 'Escrow Advance Deposited: ₹3,300',
      desc: 'Host advance payment successfully secured in escrow wallet for Booking #BMC-7820.',
      time: '1 hour ago',
      urgent: false,
      action: '/provider/wallet',
    },
    {
      id: 3,
      type: 'SYSTEM',
      title: 'FSSAI Hygiene Certificate Verified',
      desc: 'Your regulatory compliance badge is active and visible on your public atelier profile.',
      time: '1 day ago',
      urgent: false,
      action: '/provider/profile',
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white font-sora">
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="heading-3">Activity &amp; Urgent Alerts</h2>
          <p className="body-sm">Real-time host booking requests and escrow alerts</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 font-inter">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => navigate(alert.action)}
            className={`p-4 rounded-lg card-sharp cursor-pointer flex items-start gap-3.5 transition-all ${
              alert.urgent
                ? 'border-2 border-[#2196F3] bg-[#E3F2FD]/20 shadow-xs'
                : 'hover:border-[#90CAF9]'
            }`}
          >
            <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
              alert.urgent ? 'bg-[#2196F3] text-white' : 'bg-[#F8FAFC] text-[#0D47A1] border border-[#CBD5E1]'
            }`}>
              <span className="material-symbols-outlined text-[20px]">
                {alert.type === 'BOOKING_LEAD' ? 'event_available' : alert.type === 'ESCROW' ? 'shield' : 'info'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-sora font-bold text-xs text-[#172033] truncate">{alert.title}</h4>
                <span className="font-inter text-[11px] text-[#64748B] shrink-0">{alert.time}</span>
              </div>
              <p className="font-inter text-xs text-[#64748B] mt-0.5 leading-relaxed">{alert.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Urgent Booking Request Modal (Sharp Geometry: rounded-lg) */}
      {showUrgentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg p-6 shadow-xl border border-[#E5E7EB] flex flex-col gap-4 animate-in fade-in zoom-in-95 font-sora">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-ping"></span>
                <span className="label-micro text-[#EF4444]">
                  Urgent Booking Lead (15m Response Timer)
                </span>
              </div>
              <button onClick={() => setShowUrgentModal(false)} className="text-[#64748B] hover:text-[#172033]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div>
              <h3 className="heading-3 text-base">
                Gruhapravesam Feast for 25 Guests
              </h3>
              <p className="body-sm text-xs mt-0.5">
                Host: <strong className="font-semibold text-[#172033]">Meera Nambiar</strong> • Jubilee Hills, Hyderabad
              </p>
            </div>

            <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#E5E7EB] grid grid-cols-2 gap-2 text-xs font-inter">
              <div>
                <span className="text-[#64748B] block text-[10px]">Date:</span>
                <span className="font-semibold text-[#172033]">28 Nov 2026 (Lunch)</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Cuisine:</span>
                <span className="font-semibold text-[#172033]">Andhra Royal Feast</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#E5E7EB] flex items-center justify-between font-bold text-[#0D47A1]">
                <span>Quotation Value:</span>
                <span className="text-sm">₹11,000 (Advance: ₹3,300)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowUrgentModal(false);
                  navigate('/provider/chat');
                }}
                className="btn-primary flex-1 py-3 text-xs"
              >
                Accept &amp; Chat with Host
              </button>
              <button
                onClick={() => setShowUrgentModal(false)}
                className="btn-ghost px-4 py-3 text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
