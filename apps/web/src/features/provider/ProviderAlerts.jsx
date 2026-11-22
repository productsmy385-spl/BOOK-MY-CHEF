import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProviderAlerts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [showUrgentModal, setShowUrgentModal] = useState(true);

  const alerts = [
    {
      id: 1,
      type: 'BOOKING_LEAD',
      title: 'New Booking Request: 25 Guests Housewarming',
      desc: 'Ananya Rao requested Andhra Royal Feast for 28 Nov at Jubilee Hills.',
      time: '15 mins ago',
      urgent: true,
      action: '/provider/chat',
    },
    {
      id: 2,
      type: 'ESCROW',
      title: 'Advance Escrow Deposited: ₹3,300',
      desc: 'Host advance secured in platform escrow for Booking #BMC-8942-HYD.',
      time: '2 hours ago',
      urgent: false,
      action: '/provider/wallet',
    },
    {
      id: 3,
      type: 'SYSTEM',
      title: 'FSSAI License Renewal Reminder',
      desc: 'Your certified FSSAI license is valid for the next 14 months.',
      time: '1 day ago',
      urgent: false,
      action: '/provider/profile',
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white">
      {/* Header */}
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="font-sora font-extrabold text-lg text-[#172033]">Notifications &amp; Alerts</h2>
          <p className="font-sora text-xs text-[#64748B]">Real-time host booking requests and escrow alerts</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => navigate(alert.action)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              alert.urgent
                ? 'border-2 border-[#2196F3] bg-[#E3F2FD]/20 shadow-sm'
                : 'border-[#E5E7EB] bg-white hover:border-[#90CAF9]'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              alert.urgent ? 'bg-[#2196F3] text-white' : 'bg-[#f1f3ff] text-[#0D47A1]'
            }`}>
              <span className="material-symbols-outlined text-[20px]">
                {alert.type === 'BOOKING_LEAD' ? 'event_available' : alert.type === 'ESCROW' ? 'shield' : 'info'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-sora font-bold text-xs text-[#172033] truncate">{alert.title}</h4>
                <span className="font-sora text-[10px] text-[#64748B] flex-shrink-0">{alert.time}</span>
              </div>
              <p className="font-sora text-xs text-[#64748B] mt-0.5 leading-relaxed">{alert.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Urgent Booking Request Bottom Sheet Modal (Stitch Screen 23) */}
      {showUrgentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-ping"></span>
                <span className="font-sora font-bold text-xs text-[#EF4444] uppercase tracking-wider">
                  Urgent Booking Lead (15m Response Timer)
                </span>
              </div>
              <button onClick={() => setShowUrgentModal(false)} className="text-[#64748B]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div>
              <h3 className="font-sora font-extrabold text-base text-[#172033]">
                Gruhapravesam Feast for 25 Guests
              </h3>
              <p className="font-sora text-xs text-[#64748B] mt-0.5">
                Host: <strong>Ananya Rao</strong> • Jubilee Hills, Hyderabad
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f1f3ff] grid grid-cols-2 gap-2 text-xs font-sora">
              <div>
                <span className="text-[#64748B] block text-[10px]">Date:</span>
                <span className="font-semibold text-[#172033]">28 Nov 2026 (Lunch)</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Cuisine:</span>
                <span className="font-semibold text-[#172033]">Andhra Royal Feast</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-[#E5E7EB] flex items-center justify-between font-bold text-[#0D47A1]">
                <span>Quotation Value:</span>
                <span className="text-sm">₹11,000 (Advance: ₹3,300)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setShowUrgentModal(false);
                  navigate('/provider/chat');
                }}
                className="flex-1 py-3 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Accept Booking</span>
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
              <button
                onClick={() => {
                  setShowUrgentModal(false);
                  navigate('/provider/chat');
                }}
                className="px-4 py-3 bg-white border border-[#2196F3] text-[#2196F3] rounded-full font-sora text-xs font-bold hover:bg-[#E3F2FD] active:scale-95 transition-all"
              >
                Chat / Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
