import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ASSETS } from '../../assets/assetCatalog';
import { useBookingStore } from '../../stores/useBookingStore';

export default function ProviderChat() {
  const navigate = useNavigate();
  const { quotation } = useBookingStore();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'HOST',
      text: 'Namaste Chef Raghavendra! We are organizing our Gruhapravesam on 28th Nov for 25 guests. We would love authentic Andhra Gutti Vankaya and hot ghee Pappu on banana leaves.',
      time: '10:15 AM',
    },
    {
      id: 2,
      sender: 'CHEF',
      text: 'Namaste Meera ji! Congratulations on your new home. I will gladly prepare our heirloom Gutti Vankaya, slow-simmered mango pappu, and fresh hot Bobbatlu on-site. I have sent the itemized quotation below.',
      time: '10:22 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [revisedFee, setRevisedFee] = useState(quotation.baseVisitingFee);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now(),
        sender: 'CHEF',
        text: inputText,
        time: 'Just now',
      },
    ]);
    setInputText('');
  };

  return (
    <div className="flex flex-col w-full h-screen pb-20 pt-2 bg-white">
      {/* Top Bar */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between bg-white shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-[#64748B] hover:text-[#172033]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#90CAF9] flex-shrink-0">
            <img src={ASSETS.userAvatar} alt="Host Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-sora font-bold text-sm text-[#172033]">Meera Nambiar (Host)</h3>
            <span className="font-sora text-[11px] text-[#2196F3] font-semibold">Gruhapravesam • 28 Nov</span>
          </div>
        </div>

        <a href="tel:+919840112044" className="w-9 h-9 rounded-full bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">call</span>
        </a>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${msg.sender === 'CHEF' ? 'self-end items-end' : 'self-start items-start'}`}
          >
            <div
              className={`p-3.5 rounded-2xl font-sora text-xs leading-relaxed ${
                msg.sender === 'CHEF'
                  ? 'bg-[#2196F3] text-white rounded-tr-none shadow-sm'
                  : 'bg-[#f1f3ff] text-[#172033] rounded-tl-none border border-[#E5E7EB]'
              }`}
            >
              {msg.text}
            </div>
            <span className="font-sora text-[10px] text-[#64748B] mt-0.5 px-1">{msg.time}</span>
          </div>
        ))}

        {/* Embedded Interactive Quotation Card in Thread (Stitch Screen 19) */}
        <div className="self-center w-full max-w-sm p-4 rounded-2xl bg-white border-2 border-[#2196F3] shadow-card flex flex-col gap-2.5 my-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2196F3] text-[18px]">receipt_long</span>
              <span className="font-sora font-bold text-xs text-[#0D47A1] uppercase tracking-wider">
                Official Digital Quotation
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-sora text-[10px] font-bold">
              ACCEPTED BY HOST
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#f1f3ff] text-xs font-sora flex flex-col gap-1.5 border border-[#E5E7EB]">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Chef Base Visiting Fee:</span>
              <span className="font-bold text-[#172033]">₹{revisedFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">25 Guests Feast (₹350/hd):</span>
              <span className="font-bold text-[#172033]">₹8,750</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Travel &amp; Logistics:</span>
              <span className="font-bold text-[#172033]">₹300</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Platform Protection Fee:</span>
              <span className="font-bold text-[#172033]">₹450</span>
            </div>
            <div className="pt-2 border-t border-[#E5E7EB] flex justify-between font-bold text-sm text-[#0D47A1]">
              <span>Total Booking:</span>
              <span>₹{(revisedFee + 8750 + 300 + 450).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => setShowReviseModal(true)}
            className="w-full py-2 bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1] rounded-full font-sora text-xs font-bold hover:bg-[#90CAF9]/40 transition-colors shadow-xs"
          >
            Revise Quotation Parameters
          </button>
        </div>
      </div>

      {/* Input Message Box */}
      <form onSubmit={sendMessage} className="p-3 border-t border-[#E5E7EB] bg-white flex items-center gap-2">
        <button type="button" className="text-[#2196F3] p-1.5 hover:bg-[#E3F2FD] rounded-full transition-colors">
          <span className="material-symbols-outlined text-[22px]">add_photo_alternate</span>
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message Meera Nambiar..."
          className="flex-1 h-11 px-4 rounded-full bg-[#f1f3ff] border border-[#E5E7EB] font-sora text-xs text-[#172033] outline-none focus:ring-2 focus:ring-[#90CAF9] focus:bg-white"
        />
        <button
          type="submit"
          className="w-11 h-11 rounded-full bg-[#2196F3] text-white flex items-center justify-center hover:bg-[#0D47A1] transition-colors shadow-sm flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </form>

      {/* Revise Quotation Modal */}
      {showReviseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
              <h4 className="font-sora font-bold text-sm text-[#172033]">Revise Quotation Items</h4>
              <button onClick={() => setShowReviseModal(false)} className="text-[#64748B]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div>
              <label className="block font-sora font-bold text-xs text-[#172033] mb-1">Chef Visiting Fee (₹)</label>
              <input
                type="number"
                value={revisedFee}
                onChange={(e) => setRevisedFee(parseInt(e.target.value || '0', 10))}
                className="w-full h-11 px-3 rounded-xl bg-[#f1f3ff] border border-[#E5E7EB] font-sora text-xs text-[#172033] outline-none"
              />
            </div>
            <button
              onClick={() => {
                setShowReviseModal(false);
                setMessages([
                  ...messages,
                  {
                    id: Date.now(),
                    sender: 'CHEF',
                    text: `I have updated the quotation. The new total is ₹${(revisedFee + 8750 + 300 + 450).toLocaleString('en-IN')}.`,
                    time: 'Just now',
                  }
                ]);
              }}
              className="w-full py-3 bg-[#2196F3] hover:bg-[#0D47A1] text-white rounded-full font-sora text-xs font-bold shadow-md"
            >
              Send Revised Quote to Host
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
