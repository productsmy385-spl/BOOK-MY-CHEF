import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProviderStore } from '../../stores/useProviderStore';

export default function ProviderWallet() {
  const navigate = useNavigate();
  const { metrics } = useProviderStore();
  const [withdrawn, setWithdrawn] = useState(false);

  const transactions = [
    {
      id: 'tx-1',
      title: 'Advance Held in Escrow • Gruhapravesam',
      bookingRef: '#BMC-8942-HYD',
      amount: '+₹3,300',
      type: 'ESCROW_CREDIT',
      date: '22 Nov 2026',
      status: 'HELD_IN_ESCROW',
    },
    {
      id: 'tx-2',
      title: 'Bank Payout Dispatched',
      bookingRef: 'PAYOUT_781920',
      amount: '-₹35,000',
      type: 'PAYOUT',
      date: '18 Nov 2026',
      status: 'SETTLED',
    },
    {
      id: 'tx-3',
      title: 'Event Completed • Corporate Tasting',
      bookingRef: '#BMC-7110-HYD',
      amount: '+₹18,000',
      type: 'EARNING_RELEASED',
      date: '16 Nov 2026',
      status: 'SETTLED',
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white">
      {/* Top Header */}
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-[#64748B] hover:text-[#172033]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h2 className="font-sora font-extrabold text-lg text-[#172033]">Escrow &amp; Payouts Wallet</h2>
            <p className="font-sora text-xs text-[#64748B]">Automated settlements protected by Razorpay Route</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Wallet Balance Hero (Stitch Screen 20 - Sharp Geometry) */}
        <div className="p-5 rounded-lg bg-gradient-to-br from-[#0D47A1] via-[#2196F3] to-[#0D47A1] text-white shadow-md flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-sora text-xs uppercase tracking-wider text-[#90CAF9] font-bold">
              Available for Payout
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md font-sans text-[10px] font-bold text-white border border-white/20">
              Instant Transfer
            </span>
          </div>

          <div>
            <h3 className="font-sora font-extrabold text-3xl text-white">
              ₹{metrics.walletAvailable.toLocaleString('en-IN')}
            </h3>
            <span className="font-sans text-xs text-white/80 mt-1 block">
              Direct to HDFC Bank ****4921
            </span>
          </div>

          <div className="pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs font-sans">
            <div>
              <span className="text-[#90CAF9] text-[10px] block">In-Escrow (Locked):</span>
              <span className="font-bold text-white text-sm font-sora">₹{metrics.walletInEscrow.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-right">
              <span className="text-[#90CAF9] text-[10px] block">Lifetime Revenue:</span>
              <span className="font-bold text-white text-sm font-sora">₹4,85,200</span>
            </div>
          </div>
        </div>

        {/* Withdraw Action */}
        <button
          onClick={() => setWithdrawn(true)}
          disabled={withdrawn}
          className="w-full btn-primary py-3.5 text-xs flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">account_balance</span>
          <span>{withdrawn ? 'Payout Initiated to Bank Account!' : 'Withdraw ₹48,500 to Bank Account'}</span>
        </button>

        {/* Bank Account Verification Card */}
        <div className="p-4 rounded-lg bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#f1f3ff] text-[#0D47A1] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-sora font-bold text-xs text-[#172033]">HDFC Bank Ltd</h4>
                <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded-sm">
                  Verified
                </span>
              </div>
              <span className="font-sans text-[11px] text-[#64748B]">A/C No: *******4921 • IFSC: HDFC0001234</span>
            </div>
          </div>
          <span className="text-xs font-sans font-bold text-[#2196F3] cursor-pointer hover:underline">Manage</span>
        </div>

        {/* Transaction History Ledger */}
        <div className="p-4 rounded-lg bg-white border border-[#E5E7EB] shadow-sm flex flex-col gap-3">
          <span className="font-sora font-bold text-xs text-[#172033] uppercase tracking-wider">
            Escrow &amp; Settlement Ledger
          </span>

          <div className="flex flex-col gap-3 pt-1 border-t border-[#E5E7EB]">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-xs font-sans">
                <div>
                  <h5 className="font-bold text-[#172033]">{tx.title}</h5>
                  <span className="text-[10px] text-[#64748B]">{tx.date} • {tx.bookingRef}</span>
                </div>
                <div className="text-right">
                  <span className={`font-extrabold text-sm font-sora ${tx.amount.startsWith('+') ? 'text-[#10B981]' : 'text-[#172033]'}`}>
                    {tx.amount}
                  </span>
                  <span className="block text-[10px] font-semibold text-[#0D47A1]">
                    {tx.status === 'HELD_IN_ESCROW' ? 'Held in Escrow' : 'Settled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
