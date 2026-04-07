"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Fragment } from "react";

dayjs.extend(utc);
dayjs.extend(timezone);

export type SalonDayBooking = {
  uid: string;
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  salonPrice?: number | null;
  description?: string | null;
  user?: { id: number; name?: string | null; email?: string } | null;
  attendees?: { name: string; email?: string; phoneNumber?: string | null }[];
};

const HOUR_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const totalMinutes = 8 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h < 12 ? "AM" : "PM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return { label: `${displayH}:${m === 0 ? "00" : m} ${period}`, hour: h, minute: m };
});

const SALON_TZ = "America/Puerto_Rico";

export type StaffConfig = {
  id: number;
  name: string;
  color: "pink" | "green";
};

interface SalonGridViewProps {
  bookings: SalonDayBooking[];
  date: dayjs.Dayjs;
  onDateChange: (date: dayjs.Dayjs) => void;
  staff: StaffConfig[];
  onClickEmpty: (hour: number, minute: number, staffId: number) => void;
  onClickBooking: (booking: SalonDayBooking) => void;
  onDeleteBooking: (booking: SalonDayBooking) => void;
}

const COLORS = {
  pink: {
    header: "bg-gradient-to-b from-[#FFE4EC] to-[#FFD0E0] border-[#FF69B4]",
    headerText: "text-[#7B2040]",
    headerAccent: "bg-[#FF69B4]",
    block: "bg-gradient-to-br from-[#FFF0F4] to-[#FFE4EC]",
    blockBorder: "border-l-[3px] border-l-[#FF69B4] border border-[#FFB3C6]",
    blockTitle: "text-[#3D0015]",
    blockService: "text-[#C2185B]",
    blockTime: "text-[#AD1457]",
    blockPrice: "text-[#880E4F]",
    dot: "bg-[#FF69B4]",
    empty: "border-[#FFAAC0] hover:bg-[#FFF0F4] hover:border-[#FF69B4]",
    emptyPlus: "text-[#FF69B4] opacity-40 group-hover:opacity-100",
    colBorder: "border-[#FFB3C6]",
  },
  green: {
    header: "bg-gradient-to-b from-[#E8F5E9] to-[#C8E6C9] border-[#3CB371]",
    headerText: "text-[#1A4A35]",
    headerAccent: "bg-[#3CB371]",
    block: "bg-gradient-to-br from-[#F0FBF4] to-[#E8F5E9]",
    blockBorder: "border-l-[3px] border-l-[#3CB371] border border-[#B5EAD7]",
    blockTitle: "text-[#0D2B1F]",
    blockService: "text-[#2E7D32]",
    blockTime: "text-[#1B5E20]",
    blockPrice: "text-[#1B5E20]",
    dot: "bg-[#3CB371]",
    empty: "border-[#81C784] hover:bg-[#F0FBF4] hover:border-[#3CB371]",
    emptyPlus: "text-[#3CB371] opacity-40 group-hover:opacity-100",
    colBorder: "border-[#B5EAD7]",
  },
};

function BookingBlock({
  booking, color, onClick, onDelete,
}: {
  booking: SalonDayBooking;
  color: "pink" | "green";
  onClick: () => void;
  onDelete: () => void;
}) {
  const c = COLORS[color];
  const clientName = booking.attendees?.[0]?.name ?? "Cliente";
  const service = booking.title?.split(" - ")[0] ?? booking.title;
  const price = booking.salonPrice;
  const startPR = dayjs(booking.startTime).tz(SALON_TZ);
  const endPR = dayjs(booking.endTime).tz(SALON_TZ);
  const durationMin = endPR.diff(startPR, "minute");
  const startFormatted = startPR.format("h:mm a");

  const durationLabel =
    durationMin >= 60
      ? durationMin % 60 === 0
        ? `${durationMin / 60}h`
        : `${Math.floor(durationMin / 60)}h ${durationMin % 60}min`
      : `${durationMin}min`;

  return (
    <div className="group relative h-full w-full">
      <button
        type="button"
        className={`${c.block} ${c.blockBorder} h-full w-full cursor-pointer rounded-lg p-2.5 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]`}
        onClick={onClick}>
        <div className="mb-1.5 flex items-center justify-between">
          <span className={`${c.blockTime} flex items-center gap-1 text-[10px] font-bold`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot}`} />
            {startFormatted}
          </span>
          <span className="text-[10px] font-medium text-gray-500">{durationLabel}</span>
        </div>
        <p className={`${c.blockTitle} truncate text-xs font-black leading-tight`}>{clientName}</p>
        <p className={`${c.blockService} mt-0.5 truncate text-[11px] font-medium`}>{service}</p>
        {price != null && (
          <div className="mt-1.5">
            <span
              className={`${c.blockPrice} inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-black`}
              style={{ background: color === "pink" ? "#FFE4EC" : "#E8F5E9" }}>
              ${price}
            </span>
          </div>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-600"
        title="Eliminar cita">
        ✕
      </button>
    </div>
  );
}

function EmptySlot({ color, onClick }: { color: "pink" | "green"; onClick: () => void }) {
  const c = COLORS[color];
  return (
    <button
      type="button"
      className={`${c.empty} group flex h-full w-full cursor-pointer items-center justify-center rounded-lg border border-dashed transition-all`}
      onClick={onClick}>
      <span className={`${c.emptyPlus} text-xl font-light transition-all`}>+</span>
    </button>
  );
}

export function SalonGridView({ bookings, date, onDateChange, staff, onClickEmpty, onClickBooking, onDeleteBooking }: SalonGridViewProps) {
  const bookingIndex = new Map<number, Map<string, SalonDayBooking>>();
  const coveredSlots = new Map<number, Set<string>>();
  const bookingSpans = new Map<number, Map<string, number>>();

  for (const s of staff) {
    bookingIndex.set(s.id, new Map());
    coveredSlots.set(s.id, new Set());
    bookingSpans.set(s.id, new Map());
  }

  const dayStartPR = dayjs(date).tz(SALON_TZ).startOf("day");

  for (const booking of bookings) {
    const bookingUserId = booking.user?.id;
    if (!bookingUserId) continue;
    if (booking.status === "CANCELLED" || booking.status === "REJECTED") continue;

    const startPR = dayjs(booking.startTime).tz(SALON_TZ);
    if (!startPR.isSame(dayStartPR, "day")) continue;

    const staffMap = bookingIndex.get(bookingUserId);
    if (!staffMap) continue;

    const h = startPR.hour();
    const m = startPR.minute();
    const slotKey = `${h}:${m === 0 ? "00" : m}`;
    staffMap.set(slotKey, booking);

    const endPR = dayjs(booking.endTime).tz(SALON_TZ);
    const durationMin = endPR.diff(startPR, "minute");
    const spans = Math.max(1, Math.ceil(durationMin / 30));
    bookingSpans.get(bookingUserId)?.set(slotKey, spans);

    for (let i = 1; i < spans; i++) {
      const coveredTime = startPR.add(i * 30, "minute");
      const ch = coveredTime.hour();
      const cm = coveredTime.minute();
      const coveredKey = `${ch}:${cm === 0 ? "00" : cm}`;
      coveredSlots.get(bookingUserId)?.add(coveredKey);
    }
  }

  const formattedDate = dayjs(date).tz(SALON_TZ).locale("es").format("dddd, D [de] MMMM YYYY");
  const colTemplate = `80px repeat(${staff.length}, 1fr)`;

  return (
    <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ background: "#FDFAF3", borderColor: "#C8B88A" }}>
      {/* Date navigation */}
      <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ background: "linear-gradient(135deg, #FFF9EC 0%, #F5EDD8 100%)", borderColor: "#D4B870" }}>
        <button type="button" onClick={() => onDateChange(date.subtract(1, "day"))}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#B8860B] transition-colors hover:bg-[#D4A01722] active:bg-[#D4A01740]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Anterior
        </button>
        <p className="text-sm font-bold capitalize text-[#1A1A1A]">{formattedDate}</p>
        <button type="button" onClick={() => onDateChange(date.add(1, "day"))}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#B8860B] transition-colors hover:bg-[#D4A01722] active:bg-[#D4A01740]">
          Siguiente
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <div className="overflow-x-auto">
        {/* Staff headers */}
        <div className="grid min-w-[440px] gap-x-2 px-3 pt-3" style={{ gridTemplateColumns: colTemplate }}>
          <div />
          {staff.map((s) => {
            const c = COLORS[s.color];
            return (
              <div key={s.id} className={`${c.header} mb-2 overflow-hidden rounded-xl border text-center`}>
                <div className={`h-1 w-full ${c.headerAccent}`} />
                <div className="px-2 py-2">
                  <p className={`${c.headerText} text-xs font-black uppercase tracking-wider`}>
                    {s.color === "pink" ? "🌸" : "🌿"} {s.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slot grid */}
        <div className="grid min-w-[440px] gap-x-2 px-3 pb-2" style={{ gridTemplateColumns: colTemplate, gridAutoRows: "64px" }}>
          {HOUR_SLOTS.map((slot, slotIdx) => {
            const isHour = slot.minute === 0;
            const gridRow = slotIdx + 1;
            return (
              <Fragment key={`slot-${slot.hour}-${slot.minute}`}>
                <div className={`flex items-center justify-end pr-2 ${isHour ? "py-1.5" : "py-1"}`}
                  style={{ gridColumn: 1, gridRow, borderTop: isHour ? "1px solid #C8B888" : "1px solid #E2D5A8" }}>
                  <span className={`text-[10px] font-bold leading-tight ${isHour ? "text-[#8B6914] opacity-90" : "text-[#B8860B] opacity-50"}`}>
                    {slot.label}
                  </span>
                </div>
                {staff.map((s, staffIdx) => {
                  const slotKey = `${slot.hour}:${slot.minute === 0 ? "00" : slot.minute}`;
                  if (coveredSlots.get(s.id)?.has(slotKey)) return null;
                  const booking = bookingIndex.get(s.id)?.get(slotKey);
                  const spans = booking ? (bookingSpans.get(s.id)?.get(slotKey) ?? 1) : 1;
                  const isLastStaff = staffIdx === staff.length - 1;
                  const c = COLORS[s.color];
                  return (
                    <div key={`cell-${s.id}-${slot.label}`}
                      className={`${!isLastStaff ? `border-r ${c.colBorder}` : ""}`}
                      style={{
                        gridColumn: staffIdx + 2,
                        gridRow: spans > 1 ? `${gridRow} / span ${spans}` : gridRow,
                        borderTop: isHour ? "1px solid #C8B888" : "1px solid #E2D5A8",
                        padding: "3px 0 3px 3px",
                        paddingRight: isLastStaff ? 0 : "6px",
                      }}>
                      {booking ? (
                        <BookingBlock booking={booking} color={s.color}
                          onClick={() => onClickBooking(booking)}
                          onDelete={() => onDeleteBooking(booking)} />
                      ) : (
                        <EmptySlot color={s.color} onClick={() => onClickEmpty(slot.hour, slot.minute, s.id)} />
                      )}
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
