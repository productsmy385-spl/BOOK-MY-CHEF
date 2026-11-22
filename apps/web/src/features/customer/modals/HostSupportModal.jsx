import React, { useState } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';

export default function HostSupportModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [category, setCategory] = useState('BOOKING');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    const generatedId = `BMC-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(generatedId);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubject('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sora">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#f8faff] to-[#E3F2FD]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2196F3] text-[22px]">support_agent</span>
            <div>
              <h3 className="font-bold text-sm text-[#172033]">Host Concierge &amp; Support</h3>
              <p className="font-inter text-xs text-[#64748B]">24/7 dedicated celebration support desk</p>
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
          {isSubmitted ? (
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">check_circle</span>
              </div>
              <h4 className="font-sora font-bold text-base text-[#172033]">Support Ticket Created</h4>
              <p className="text-xs text-[#64748B] max-w-xs">
                Your inquiry has been escalated to our Priority Host Concierge team. We will call and email you within 15 minutes.
              </p>
              <div className="p-3 bg-[#E3F2FD] border border-[#90CAF9] rounded-md font-mono font-bold text-[#0D47A1] text-xs">
                Reference ID: {ticketId}
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 btn-primary py-2 px-6 text-xs font-bold font-sora cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                  Issue Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'BOOKING', label: 'Booking Inquiry', icon: 'event' },
                    { id: 'ESCROW', label: 'Payment / Escrow', icon: 'account_balance' },
                    { id: 'MENU', label: 'Menu Customization', icon: 'restaurant' },
                    { id: 'HYGIENE', label: 'Hygiene & Quality', icon: 'sanitizer' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2 rounded-md border flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors ${
                        category === cat.id
                          ? 'bg-[#E3F2FD] border-[#2196F3] text-[#0D47A1] font-bold'
                          : 'bg-white border-[#CBD5E1] text-[#64748B] hover:border-[#90CAF9]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#2196F3]">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your question or issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-semibold font-sora mb-1 text-[11px]">
                  Description / Event Details *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe your requirements, booking dates, guest count or specific requests..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-md text-xs text-[#172033] focus:ring-1 focus:ring-[#2196F3] outline-none resize-none"
                />
              </div>

              {/* Emergency Hotline Info */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2.5 text-amber-900">
                <span className="material-symbols-outlined text-[20px] text-amber-600">phone_in_talk</span>
                <div className="text-[11px]">
                  <span className="font-bold block">Live Event Emergency?</span>
                  <span>Call 1800-BOOK-CHEF (9:00 AM – 11:00 PM IST)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md border border-[#CBD5E1] text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5 text-xs font-bold font-sora cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
