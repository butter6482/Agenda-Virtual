"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useMemo, useState } from "react";
import { trpc } from "../trpc/react";
import { Button } from "./ui/button";
import { SalonGridView } from "./SalonGridView";
import type { SalonDayBooking, StaffConfig } from "./SalonGridView";
import { SalonMonthCalendar } from "./SalonMonthCalendar";
import { SalonDailySummary } from "./SalonDailySummary";
import { CreateManualBookingDialog } from "./CreateManualBookingDialog";

dayjs.extend(utc);
dayjs.extend(timezone);

const SALON_TZ = "America/Puerto_Rico";

function getWeekMonday(date: dayjs.Dayjs): dayjs.Dayjs {
  const dow = date.day();
  const diff = dow === 0 ? -6 : 1 - dow;
  return date.add(diff, "day").startOf("day");
}

export function BookingContainer() {
  const [salonDate, setSalonDate] = useState(dayjs());
  const [salonSubView, setSalonSubView] = useState<"month" | "day">("month");
  const [calendarMonth, setCalendarMonth] = useState(() => dayjs().startOf("month"));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editBooking, setEditBooking] = useState<SalonDayBooking | null>(null);
  const [createDialogDefaults, setCreateDialogDefaults] = useState<{
    hour?: number; minute?: number; staffUserId?: number; date?: dayjs.Dayjs;
  }>({});
  const [confirmDelete, setConfirmDelete] = useState<SalonDayBooking | null>(null);

  const utils = trpc.useUtils();
  const cancelMutation = trpc.bookings.cancelBooking.useMutation({
    onSuccess: () => {
      utils.bookings.getDayBookings.invalidate();
      setConfirmDelete(null);
    },
  });

  const { data: staffMembers } = trpc.bookings.listStaff.useQuery();

  const weekMonday = useMemo(() => getWeekMonday(salonDate), [salonDate]);
  const weekSaturday = useMemo(() => weekMonday.add(5, "day"), [weekMonday]);

  const { data: rawDayBookings } = trpc.bookings.getDayBookings.useQuery(
    { date: salonDate.format("YYYY-MM-DD") },
    { enabled: salonSubView === "day", staleTime: 0 }
  );

  const { data: rawWeekBookings } = trpc.bookings.getDayBookings.useQuery(
    { date: weekMonday.format("YYYY-MM-DD"), endDate: weekSaturday.format("YYYY-MM-DD") },
    { enabled: salonSubView === "day", staleTime: 0 }
  );

  const { data: rawMonthBookings } = trpc.bookings.getDayBookings.useQuery(
    { date: calendarMonth.format("YYYY-MM-DD"), endDate: calendarMonth.endOf("month").format("YYYY-MM-DD") },
    { enabled: salonSubView === "month", staleTime: 0 }
  );

  const salonDayBookings = useMemo<SalonDayBooking[]>(() => rawDayBookings ?? [], [rawDayBookings]);
  const salonWeekBookings = useMemo<SalonDayBooking[]>(() => rawWeekBookings ?? [], [rawWeekBookings]);
  const salonMonthBookings = useMemo<SalonDayBooking[]>(() => rawMonthBookings ?? [], [rawMonthBookings]);

  const salonStaff: StaffConfig[] = useMemo(() => {
    if (!staffMembers?.length) return [];
    return staffMembers.map((s, i) => ({
      id: s.id,
      name: s.name ?? s.email,
      color: s.name?.toLowerCase().includes("marielis") ? "pink" : s.name?.toLowerCase().includes("yasmary") ? "green" : (i % 2 === 0 ? "pink" : "green"),
    })) as StaffConfig[];
  }, [staffMembers]);

  function closeDialog(open: boolean) {
    setShowCreateDialog(open);
    if (!open) { setCreateDialogDefaults({}); setEditBooking(null); }
  }

  return (
    <>
      <div className="flex justify-end mb-1">
        <Button color="primary" StartIcon="plus" size="sm"
          onClick={() => { setCreateDialogDefaults({ date: salonDate, hour: 8, minute: 0 }); setEditBooking(null); setShowCreateDialog(true); }}>
          Crear cita
        </Button>
      </div>

      <div className="mt-4">
        {salonSubView === "month" ? (
          <SalonMonthCalendar
            bookings={salonMonthBookings}
            selectedDate={salonDate}
            viewMonth={calendarMonth}
            onViewMonthChange={(month) => setCalendarMonth(month)}
            onSelectDate={(date) => { setSalonDate(date); setCalendarMonth(date.startOf("month")); setSalonSubView("day"); }}
          />
        ) : (
          <>
            <button type="button" onClick={() => setSalonSubView("month")}
              className="mb-3 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#B8860B] hover:bg-[#D4A01722]">
              ← Ver mes
            </button>
            <SalonGridView
              bookings={salonDayBookings}
              date={salonDate}
              onDateChange={setSalonDate}
              staff={salonStaff}
              onClickEmpty={(hour, minute, staffId) => { setCreateDialogDefaults({ hour, minute, staffUserId: staffId, date: salonDate }); setEditBooking(null); setShowCreateDialog(true); }}
              onClickBooking={(booking) => { setEditBooking(booking); setCreateDialogDefaults({}); setShowCreateDialog(true); }}
              onDeleteBooking={(booking) => setConfirmDelete(booking)}
            />
            <SalonDailySummary bookings={salonWeekBookings} staff={salonStaff} date={salonDate} />
          </>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="mb-1 text-base font-black text-[#1A1A1A]">¿Eliminar esta cita?</p>
            <p className="mb-0.5 text-sm font-semibold text-gray-700">{confirmDelete.attendees?.[0]?.name ?? "Cliente"}</p>
            <p className="mb-5 text-xs text-gray-400">{confirmDelete.title}</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate({ uid: confirmDelete.uid })}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60">
                {cancelMutation.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateManualBookingDialog
        isOpenDialog={showCreateDialog}
        setIsOpenDialog={closeDialog}
        defaultStaffUserId={createDialogDefaults.staffUserId}
        defaultHour={createDialogDefaults.hour}
        defaultMinute={createDialogDefaults.minute}
        defaultDate={createDialogDefaults.date}
        editBooking={editBooking}
      />
    </>
  );
}
