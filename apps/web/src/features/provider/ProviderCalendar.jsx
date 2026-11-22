import React, { useState } from 'react';

export default function ProviderCalendar() {
  const [selectedDay, setSelectedDay] = useState(28);
  const [blockedDays, setBlockedDays] = useState([14, 15, 21]);

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const toggleBlockDay = (day) => {
    if (blockedDays.includes(day)) {
      setBlockedDays(blockedDays.filter((d) => d !== day));
    } else {
      setBlockedDays([...blockedDays, day]);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-28 pt-2 px-4 bg-white font-sora">
      {/* Header & Date Lock Controls */}
      <div className="py-2 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="heading-3">Availability &amp; Slots</h2>
          <p className="body-sm">Manage date locks and view upcoming bookings</p>
        </div>
        <button
          onClick={() => toggleBlockDay(selectedDay)}
          className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all shadow-xs ${
            blockedDays.includes(selectedDay)
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {blockedDays.includes(selectedDay) ? 'Unblock Date' : 'Block Selected Date'}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Month Calendar Grid (Sharp Geometry: rounded-lg card-sharp) */}
        <div className="card-sharp p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-sora font-extrabold text-sm text-[#172033]">November 2026</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2196F3] inline-block mr-1"></span>
              <span className="font-inter text-[11px] text-[#64748B]">Confirmed</span>
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] inline-block ml-2 mr-1"></span>
              <span className="font-inter text-[11px] text-[#64748B]">Blocked</span>
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
                  className={`h-11 rounded-md flex flex-col items-center justify-center font-sora text-xs transition-all relative ${
                    isSelected
                      ? 'bg-[#0D47A1] text-white font-bold ring-2 ring-[#90CAF9] shadow-xs'
                      : isConfirmed
                      ? 'bg-[#E3F2FD] text-[#0D47A1] font-bold border border-[#90CAF9]'
                      : isBlocked
                      ? 'bg-red-50 text-red-500 line-through border border-red-200'
                      : 'bg-[#F8FAFC] text-[#172033] hover:bg-[#E3F2FD] border border-[#E5E7EB]'
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
        <div className="card-sharp p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="heading-4 text-sm">
              Schedule for {selectedDay} November 2026
            </h4>
            <span className="badge-sharp bg-[#E3F2FD] border border-[#90CAF9] text-[#0D47A1]">
              {selectedDay === 28 ? '1 Confirmed Booking' : blockedDays.includes(selectedDay) ? 'Date Blocked' : 'Available'}
            </span>
          </div>

          {selectedDay === 28 ? (
            <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#CBD5E1] flex flex-col gap-2 font-inter text-xs">
              <div className="flex items-center justify-between">
                <span className="font-sora font-bold text-sm text-[#0D47A1]">Gruhapravesam Feast</span>
                <span className="badge-sharp bg-emerald-50 border border-emerald-300 text-emerald-800">
                  LOCKED
                </span>
              </div>
              <p className="text-[#64748B]">Host: Meera Nambiar • 25 Guests • Andhra Royal Banquet</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-[11px] font-semibold text-[#172033]">
                <span>12:00 PM – 4:30 PM (Lunch Slot)</span>
                <span className="text-[#0D47A1]">Advance Paid ₹3,300</span>
              </div>
            </div>
          ) : (
            <p className="font-inter text-xs text-[#64748B] py-2">
              {blockedDays.includes(selectedDay)
                ? 'This date is currently blocked from accepting automatic host reservations.'
                : 'No reservations booked for this date yet. Your atelier is available for customer booking.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
