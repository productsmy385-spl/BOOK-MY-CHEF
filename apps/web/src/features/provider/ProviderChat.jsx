import React, { useState } from 'react';

export default function ProviderChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'CUSTOMER',
      text: 'Namaste Chef! For the Gruhapravesam on the 28th, could we request slightly less spice in the Gutti Vankaya curry?',
      time: '11:15 AM',
    },
    {
      id: 2,
      sender: 'CHEF',
      text: 'Certainly! We will use cold-pressed sesame oil and mild Byadgi chillies to keep the rich aroma without sharp heat.',
      time: '11:18 AM',
    },
    {
      id: 3,
      sender: 'CUSTOMER',
      text: 'Perfect! Also, can we include two live Poori counters for lunch service?',
      time: '11:22 AM',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [revisedFee, setRevisedFee] = useState(1500);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'CHEF',
        text: inputText.trim(),
        time: 'Just now',
      },
    ]);
    setInputText('');
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-4rem)] bg-white font-sora">
      {/* Thread Header */}
      <div className="p-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-white z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#0D47A1] text-white flex items-center justify-center font-bold text-sm">
            MN
          </div>
          <div>
            <h3 className="heading-4 text-sm">Meera Nambiar</h3>
            <p className="font-inter text-xs text-[#2196F3] font-medium">Gruhapravesam Feast • 28 Nov 2026</p>
          </div>
        </div>

        <button
          onClick={() => setShowReviseModal(true)}
          className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[15px]">edit_note</span>
          <span>Revise Quotation</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-inter">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[80%] ${
              msg.sender === 'CHEF' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div
              className={`p-3.5 rounded-md text-xs leading-relaxed ${
                msg.sender === 'CHEF'
                  ? 'bg-[#2196F3] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#172033] border border-[#CBD5E1]'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-[#64748B] mt-0.5 px-1">{msg.time}</span>
          </div>
        ))}

        {/* Embedded Quotation Card (Sharp Geometry: card-sharp) */}
        <div className="self-center w-full max-w-sm p-4 card-sharp border-2 border-[#2196F3] flex flex-col gap-2.5 my-2 font-sora">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2196F3] text-[18px]">receipt_long</span>
              <span className="label-micro text-[#0D47A1]">
                Official Digital Quotation
              </span>
            </div>
            <span className="badge-sharp bg-emerald-50 border border-emerald-300 text-emerald-800">
              ACCEPTED BY HOST
            </span>
          </div>

          <div className="p-3 rounded-md bg-[#F8FAFC] text-xs font-inter flex flex-col gap-1.5 border border-[#E5E7EB]">
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
            <div className="pt-2 border-t border-[#E5E7EB] flex justify-between font-bold text-sm text-[#0D47A1] font-sora">
              <span>Total Booking:</span>
              <span>₹{(revisedFee + 8750 + 300 + 450).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => setShowReviseModal(true)}
            className="btn-secondary w-full py-2 text-xs font-semibold"
          >
            Revise Quotation Parameters
          </button>
        </div>
      </div>

      {/* Input Message Box */}
      <form onSubmit={sendMessage} className="p-3 border-t border-[#E5E7EB] bg-white flex items-center gap-2">
        <button type="button" className="btn-ghost p-2" aria-label="Add media">
          <span className="material-symbols-outlined text-[20px] text-[#2196F3]">add_photo_alternate</span>
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message Meera Nambiar..."
          className="input-sharp flex-1 font-inter text-xs"
        />
        <button
          type="submit"
          className="btn-primary w-11 h-12 p-0 shrink-0"
          aria-label="Send message"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </form>

      {/* Revise Quotation Modal */}
      {showReviseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-lg p-5 shadow-xl border border-[#E5E7EB] flex flex-col gap-4 animate-in zoom-in-95 font-sora">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
              <h4 className="heading-4 text-sm">Revise Quotation Items</h4>
              <button onClick={() => setShowReviseModal(false)} className="text-[#64748B] hover:text-[#172033]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div>
              <label htmlFor="visiting-fee" className="block font-sora font-bold uppercase text-[10px] text-[#172033] mb-1.5">Chef Visiting Fee (₹)</label>
              <input
                id="visiting-fee"
                type="number"
                value={revisedFee}
                onChange={(e) => setRevisedFee(parseInt(e.target.value || '0', 10))}
                className="input-sharp w-full font-mono font-bold"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReviseModal(false)}
                className="btn-primary flex-1 py-2.5 text-xs"
              >
                Send Revised Quote
              </button>
              <button
                type="button"
                onClick={() => setShowReviseModal(false)}
                className="btn-ghost py-2.5 px-3 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
