import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProviderCalendar() {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(28);
  const [blockedDays, setBlockedDays] = useState([14, 15, 29]);

  const toggleBlock = (day) => {
    if (blockedDays.includes(day)) {
      setBlockedDays(blockedDays.filter(d => d !== day));
    } else {
      setBlockedDays([...blockedDays, day]);
    }
  };

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white">
      {/* Header */}
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="font-sora font-extrabold text-lg text-[#172033]">Calendar &amp; Availability</h2>
          <p className="font-sora text-xs text-[#64748B]">November 2026 • 12 Confirmed Events</p>
        </div>
        <button
          onClick={() => toggleBlock(selectedDay)}
          className={`px-3 py-1.5 rounded-full font-sora text-xs font-bold transition-all shadow-xs ${
            blockedDays.includes(selectedDay)
              ? 'bg-[#10B981] text-white'
              : 'bg-white border border-[#EF4444] text-[#EF4444]'
          }`}
        >
          {blockedDays.includes(selectedDay) ? 'Unblock Date' : 'Block Selected Date'}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Month Calendar Grid (Stitch Screen 21) */}
        <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-sora font-extrabold text-sm text-[#172033]">November 2026</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2196F3] inline-block mr-1"></span>
              <span className="font-sora text-[10px] text-[#64748B]">Confirmed</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block ml-2 mr-1"></span>
              <span className="font-sora text-[10px] text-[#64748B]">Blocked</span>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-sora text-[10px] font-bold text-[#64748B] uppercase">
            <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
          </div>

          {/* Dates Matrix */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysInMonth.map((day) => {
              const isSelected = selectedDay === day;
              const isConfirmed = day === 28 || day === 2 || day === 7 || day === 18;
              const isBlocked = blockedDays.includes(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center font-sora text-xs transition-all relative ${
                    isSelected
                      ? 'bg-[#0D47A1] text-white font-bold ring-2 ring-[#90CAF9] shadow-sm'
                      : isConfirmed
                      ? 'bg-[#E3F2FD] text-[#0D47A1] font-bold border border-[#90CAF9]'
                      : isBlocked
                      ? 'bg-red-50 text-red-500 line-through border border-red-200'
                      : 'bg-[#f1f3ff] text-[#172033] hover:bg-[#E3F2FD]'
                  }`}
                >
                  <span>{day}</span>
                  {isConfirmed && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2196F3] absolute bottom-1"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Breakdown */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="font-sora font-bold text-sm text-[#172033]">
              Schedule for {selectedDay} November 2026
            </h4>
            <span className="font-sora text-xs font-bold text-[#0D47A1]">
              {selectedDay === 28 ? '1 Confirmed Booking' : blockedDays.includes(selectedDay) ? 'Date Blocked' : 'Available for Bookings'}
            </span>
          </div>

          {selectedDay === 28 ? (
            <div className="p-3.5 rounded-xl bg-[#E3F2FD]/50 border border-[#90CAF9] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-sora font-bold text-[#0D47A1] uppercase tracking-wider block">
                  Lunch (12:30 PM) • Jubilee Hills
                </span>
                <h5 className="font-sora font-bold text-xs text-[#172033] mt-0.5">
                  Gruhapravesam Feast • Meera Nambiar
                </h5>
                <span className="font-sora text-[11px] text-[#64748B]">25 Guests • Andhra Royal Feast</span>
              </div>
              <button
                onClick={() => navigate('/provider/event-day')}
                className="px-3.5 py-1.5 bg-[#2196F3] text-white rounded-full font-sora text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                Checklist
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#f1f3ff] text-center font-sora text-xs text-[#64748B]">
              {blockedDays.includes(selectedDay)
                ? 'This date is marked as a personal holiday. Customers cannot book.'
                : 'No conflicting events. Slots open for morning and evening bookings.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
