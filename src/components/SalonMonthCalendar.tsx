"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { SalonDayBooking } from "./SalonGridView";

dayjs.extend(utc);
dayjs.extend(timezone);

interface SalonMonthCalendarProps {
  bookings: SalonDayBooking[];
  selectedDate: dayjs.Dayjs;
  onSelectDate: (date: dayjs.Dayjs) => void;
  viewMonth: dayjs.Dayjs;
  onViewMonthChange: (month: dayjs.Dayjs) => void;
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const SALON_TZ = "America/Puerto_Rico";

function getMonday(date: dayjs.Dayjs): dayjs.Dayjs {
  const dow = date.day();
  const diff = dow === 0 ? -6 : 1 - dow;
  return date.add(diff, "day").startOf("day");
}

export function SalonMonthCalendar({ bookings, selectedDate, onSelectDate, viewMonth, onViewMonthChange }: SalonMonthCalendarProps) {
  const bookingCountByDay = new Map<string, number>();
  for (const booking of bookings) {
    if (booking.status !== "CANCELLED" && booking.status !== "REJECTED") {
      const key = dayjs(booking.startTime).tz(SALON_TZ).format("YYYY-MM-DD");
      bookingCountByDay.set(key, (bookingCountByDay.get(key) ?? 0) + 1);
    }
  }

  const startOfMonth = viewMonth.startOf("month");
  const endOfMonth = viewMonth.endOf("month");
  const startOfGrid = getMonday(startOfMonth);
  const endOfGrid = getMonday(endOfMonth).add(6, "day").endOf("day");

  const days: dayjs.Dayjs[] = [];
  let cur = startOfGrid;
  while (cur.isBefore(endOfGrid) || cur.isSame(endOfGrid, "day")) {
    days.push(cur);
    cur = cur.add(1, "day");
  }

  const today = dayjs();

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8D5A3] shadow-sm" style={{ background: "linear-gradient(160deg, #FFFDF7 0%, #FDF6E3 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8D5A3] px-6 py-4">
        <button type="button" onClick={() => onViewMonthChange(viewMonth.subtract(1, "month"))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#B8860B] transition-colors hover:bg-[#D4A01720] active:bg-[#D4A01740]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-base font-bold capitalize tracking-wide text-[#1A1A1A]">
            {viewMonth.locale("es").format("MMMM")}
          </h2>
          <p className="text-xs font-medium text-[#B8860B]">{viewMonth.format("YYYY")}</p>
        </div>
        <button type="button" onClick={() => onViewMonthChange(viewMonth.add(1, "month"))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#B8860B] transition-colors hover:bg-[#D4A01720] active:bg-[#D4A01740]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="px-4 pb-4 pt-3">
        {/* Weekday headers */}
        <div className="mb-2 grid grid-cols-7">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-widest text-[#C4A35A]">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateKey = day.format("YYYY-MM-DD");
            const isCurrentMonth = day.month() === viewMonth.month();
            const isSelected = day.isSame(selectedDate, "day");
            const isToday = day.isSame(today, "day");
            const count = isCurrentMonth ? (bookingCountByDay.get(dateKey) ?? 0) : 0;
            const hasBookings = count > 0;

            if (!isCurrentMonth) {
              return (
                <div key={dateKey} className="flex min-h-[48px] items-center justify-center">
                  <span className="text-sm text-[#D9C99A]">{day.date()}</span>
                </div>
              );
            }

            if (isSelected) {
              return (
                <button key={dateKey} type="button" onClick={() => onSelectDate(day)}
                  className="relative flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-[#D4A017] shadow-md transition-transform active:scale-95">
                  <span className="text-sm font-bold text-white">{day.date()}</span>
                  {hasBookings && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-white/80" />}
                </button>
              );
            }

            if (isToday) {
              return (
                <button key={dateKey} type="button" onClick={() => { onViewMonthChange(day.startOf("month")); onSelectDate(day); }}
                  className="relative flex min-h-[48px] flex-col items-center justify-center rounded-xl border-2 border-[#D4A017] bg-[#D4A01710] transition-colors hover:bg-[#D4A01720] active:scale-95">
                  <span className="text-sm font-bold text-[#B8860B]">{day.date()}</span>
                  {hasBookings && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#D4A017]" />}
                </button>
              );
            }

            if (hasBookings) {
              return (
                <button key={dateKey} type="button" onClick={() => { onViewMonthChange(day.startOf("month")); onSelectDate(day); }}
                  className="relative flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-[#EEF6ED] transition-colors hover:bg-[#DCF0DA] active:scale-95">
                  <span className="text-sm font-semibold text-[#2D7A55]">{day.date()}</span>
                  <span className="absolute bottom-1.5 flex gap-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <span key={i} className="h-1 w-1 rounded-full bg-[#3CB371]" />
                    ))}
                  </span>
                </button>
              );
            }

            return (
              <button key={dateKey} type="button" onClick={() => { onViewMonthChange(day.startOf("month")); onSelectDate(day); }}
                className="relative flex min-h-[48px] flex-col items-center justify-center rounded-xl text-[#3A3A3A] transition-colors hover:bg-[#D4A01715] active:scale-95">
                <span className="text-sm">{day.date()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 border-t border-[#E8D5A3] px-6 py-3">
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#D4A017]" /><span className="text-[10px] text-[#8A7040]">Hoy</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3CB371]" /><span className="text-[10px] text-[#8A7040]">Con citas</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#D4A017]" /><span className="text-[10px] text-[#8A7040]">Seleccionado</span></div>
      </div>
    </div>
  );
}
