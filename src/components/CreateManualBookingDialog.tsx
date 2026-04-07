"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { trpc } from "../trpc/react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogClose } from "./ui/dialog";
import { Form, TextField, TextArea, Label } from "./ui/form";
import Select from "react-select";

import { ZCreateManualBookingInputSchema, type TCreateManualBookingInput } from "../trpc/routers/bookings";
import type { SalonDayBooking } from "./SalonGridView";

dayjs.extend(utc);
dayjs.extend(timezone);

const SALON_TZ = "America/Puerto_Rico";

interface ICreateManualBookingDialog {
  isOpenDialog: boolean;
  setIsOpenDialog: (open: boolean) => void;
  defaultStaffUserId?: number;
  defaultHour?: number;
  defaultMinute?: number;
  defaultDate?: dayjs.Dayjs;
  editBooking?: SalonDayBooking | null;
}

const HOUR_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((h) => ({
  label: h === 0 ? "0 horas" : h === 1 ? "1 hora" : `${h} horas`,
  value: h,
}));

const MINUTE_OPTIONS = [0, 15, 30, 45].map((m) => ({ label: `${m} min`, value: m }));

const STAFF_COLORS = {
  pink: { accent: "#FF69B4", accentLight: "#FFE4EC", accentMid: "#FFB3C6", bg: "#FFF8FA", text: "#7B2040", dot: "#FF69B4", btn: "bg-[#FF69B4] hover:bg-[#e55ca0] text-white", section: "text-[#C2185B]", totalBg: "#FFF0F4", totalText: "#7B2040", totalBorder: "#FFB3C6" },
  green: { accent: "#3CB371", accentLight: "#E8F5E9", accentMid: "#B5EAD7", bg: "#F8FDF9", text: "#1A4A35", dot: "#3CB371", btn: "bg-[#3CB371] hover:bg-[#2e8f5a] text-white", section: "text-[#2E7D32]", totalBg: "#F0FBF4", totalText: "#1A4A35", totalBorder: "#B5EAD7" },
} as const;

function getStaffColor(name: string, index: number): "pink" | "green" {
  if (name.toLowerCase().includes("marielis")) return "pink";
  if (name.toLowerCase().includes("yasmary")) return "green";
  return index % 2 === 0 ? "pink" : "green";
}

function SectionLabel({ icon, label, colorKey }: { icon: string; label: string; colorKey: "pink" | "green" }) {
  const c = STAFF_COLORS[colorKey];
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-sm">{icon}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest ${c.section}`}>{label}</span>
      <div className="h-px flex-1" style={{ background: c.accentMid, opacity: 0.5 }} />
    </div>
  );
}

function formatDuration(hours: number, mins: number): string {
  const total = hours * 60 + mins;
  if (total === 0) return "0 min";
  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return hours === 1 ? "1 hora" : `${hours} horas`;
  return `${mins} min`;
}

export const CreateManualBookingDialog = (props: ICreateManualBookingDialog) => {
  const utils = trpc.useUtils();
  const { isOpenDialog, setIsOpenDialog, defaultStaffUserId, defaultHour, defaultMinute, defaultDate, editBooking } = props;
  const isEditMode = !!editBooking;

  const [durationHours, setDurationHours] = useState(1);
  const [durationMins, setDurationMins] = useState(0);
  const totalMin = durationHours * 60 + durationMins;

  const methods = useForm<TCreateManualBookingInput>({
    resolver: zodResolver(ZCreateManualBookingInputSchema),
    defaultValues: { customerTimezone: SALON_TZ, customerEmail: "", notes: "", staffUserId: defaultStaffUserId, durationMinutes: 60 },
  });

  useEffect(() => {
    if (!isOpenDialog) return;
    if (editBooking) {
      const startPR = dayjs(editBooking.startTime).tz(SALON_TZ);
      const endPR = dayjs(editBooking.endTime).tz(SALON_TZ);
      const totalMinEdit = Math.max(15, endPR.diff(startPR, "minute"));
      setDurationHours(Math.floor(totalMinEdit / 60));
      setDurationMins(totalMinEdit % 60);
      const serviceName = editBooking.title?.split(" - ")[0] ?? "";
      const customerName = editBooking.attendees?.[0]?.name ?? "";
      const customerPhone = editBooking.attendees?.[0]?.phoneNumber ?? "";
      const rawEmail = editBooking.attendees?.[0]?.email ?? "";
      const customerEmail = rawEmail.includes("@coquibook.local") || rawEmail.includes("@manual.coquibook.local") ? "" : rawEmail;
      methods.reset({ customerTimezone: SALON_TZ, serviceName, customerName, customerPhone: customerPhone ?? "", customerEmail, startTime: startPR.format("YYYY-MM-DDTHH:mm"), staffUserId: editBooking.user?.id, salonPrice: editBooking.salonPrice ?? undefined, notes: editBooking.description ?? "", durationMinutes: totalMinEdit } as TCreateManualBookingInput);
      return;
    }
    setDurationHours(1);
    setDurationMins(0);
    methods.reset({ customerTimezone: SALON_TZ, customerEmail: "", notes: "", staffUserId: undefined, durationMinutes: 60 } as TCreateManualBookingInput);
    if (defaultHour != null) {
      const baseDate = defaultDate ?? dayjs();
      methods.setValue("startTime", baseDate.hour(defaultHour).minute(defaultMinute ?? 0).second(0).format("YYYY-MM-DDTHH:mm"));
    }
    if (defaultStaffUserId != null) methods.setValue("staffUserId", defaultStaffUserId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpenDialog, editBooking, defaultHour, defaultMinute, defaultDate, defaultStaffUserId]);

  const { data: staffMembers } = trpc.bookings.listStaff.useQuery();
  const hasStaff = staffMembers && staffMembers.length > 1;
  const staffOptions = staffMembers?.map((s, i) => ({ label: s.name ?? s.email, value: s.id, color: getStaffColor(s.name ?? "", i) })) ?? [];
  const watchedStaffId = methods.watch("staffUserId");
  const selectedStaffOption = staffOptions.find((o) => o.value === watchedStaffId);
  const colorKey: "pink" | "green" = selectedStaffOption?.color ?? "pink";
  const c = STAFF_COLORS[colorKey];

  function onMutationSuccess(verb: string) {
    utils.bookings.invalidate();
    setIsOpenDialog(false);
    methods.reset();
    setDurationHours(1);
    setDurationMins(0);
    toast.success(`Cita ${verb} exitosamente`);
  }

  const createMutation = trpc.bookings.createManual.useMutation({
    onSuccess: () => onMutationSuccess("creada"),
    onError: (error) => toast.error(error.message || "Error al crear la cita"),
  });

  const updateMutation = trpc.bookings.updateManualBooking.useMutation({
    onSuccess: () => onMutationSuccess("actualizada"),
    onError: (error) => toast.error(error.message || "Error al actualizar la cita"),
  });

  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

  return (
    <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl transition-colors duration-300" style={{ background: c.accent }} />
        <DialogHeader title={isEditMode ? "Editar Cita" : "Nueva Cita"} subtitle={isEditMode ? "Modifica los datos de la cita" : "Agenda una cita para el salón"} />

        <Form form={methods} handleSubmit={(data) => {
          const duration = totalMin > 0 ? totalMin : 60;
          if (isEditMode && editBooking) {
            updateMutation.mutate({ bookingUid: editBooking.uid, serviceName: data.serviceName, customerName: data.customerName, customerPhone: data.customerPhone, customerEmail: data.customerEmail, startTime: data.startTime, durationMinutes: duration, staffUserId: data.staffUserId, salonPrice: data.salonPrice, notes: data.notes });
          } else {
            createMutation.mutate({ ...data, durationMinutes: duration });
          }
        }}>
          <div className="space-y-4 pt-1 pb-2">

            {hasStaff && (
              <div>
                <SectionLabel icon="👩‍💼" label="Empleada" colorKey={colorKey} />
                <Controller name="staffUserId" control={methods.control} render={({ field }) => (
                  <div className="relative">
                    {selectedStaffOption && <span className="absolute left-3 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full" style={{ background: c.dot }} />}
                    <div style={selectedStaffOption ? { paddingLeft: "6px" } : undefined}>
                      <Select options={staffOptions} onChange={(val) => field.onChange(val?.value ?? undefined)}
                        value={staffOptions.find((opt) => opt.value === field.value) ?? null}
                        placeholder="Selecciona una empleada" isClearable />
                    </div>
                  </div>
                )} />
              </div>
            )}

            <div>
              <SectionLabel icon="✂️" label="Servicio" colorKey={colorKey} />
              <TextField label="" placeholder="Ej. manicure, blower, uñas acrílicas..." {...methods.register("serviceName")} required />
            </div>

            <div>
              <SectionLabel icon="📅" label="Fecha y Hora" colorKey={colorKey} />
              <TextField label="" type="datetime-local" {...methods.register("startTime")} required />
            </div>

            <div>
              <SectionLabel icon="⏱️" label="Duración" colorKey={colorKey} />
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-[11px] text-gray-500 mb-1 block">Horas</Label>
                  <Select options={HOUR_OPTIONS} onChange={(val) => setDurationHours(val?.value ?? 0)} value={HOUR_OPTIONS.find((o) => o.value === durationHours) ?? HOUR_OPTIONS[1]} />
                </div>
                <div className="flex-1">
                  <Label className="text-[11px] text-gray-500 mb-1 block">Minutos</Label>
                  <Select options={MINUTE_OPTIONS} onChange={(val) => setDurationMins(val?.value ?? 0)} value={MINUTE_OPTIONS.find((o) => o.value === durationMins) ?? MINUTE_OPTIONS[0]} />
                </div>
                <div className="shrink-0 pt-5">
                  <div className="rounded-lg border px-3 py-2 text-center" style={{ background: c.totalBg, borderColor: c.totalBorder, color: c.totalText }}>
                    <div className="text-[10px] font-semibold opacity-70 leading-tight">Total</div>
                    <div className="text-sm font-black leading-tight whitespace-nowrap">{formatDuration(durationHours, durationMins)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel icon="👤" label="Cliente" colorKey={colorKey} />
              <div className="space-y-3">
                <TextField label="Nombre" placeholder="Ej. María González" {...methods.register("customerName")} required />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Teléfono (Opcional)" placeholder="787-555-1234" {...methods.register("customerPhone")} />
                  <TextField label="Email (Opcional)" type="email" placeholder="maria@ejemplo.com" {...methods.register("customerEmail")} />
                </div>
                <TextArea label="Notas (Opcional)" placeholder="Detalles adicionales..." {...methods.register("notes")} />
              </div>
            </div>

            <div>
              <SectionLabel icon="💰" label="Precio" colorKey={colorKey} />
              <Controller name="salonPrice" control={methods.control} render={({ field, fieldState }) => (
                <div>
                  <div className="flex items-center overflow-hidden rounded-md border transition-all" style={{ borderColor: fieldState.error ? "#ef4444" : "#D1D5DB" }}>
                    <span className="flex items-center border-r px-3 py-2 text-sm font-bold" style={{ background: c.accentLight, borderColor: "#D1D5DB", color: c.text }}>$</span>
                    <input type="number" placeholder="0.00" min={0} step="0.01" className="w-full bg-white px-3 py-2 text-sm outline-none" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                  </div>
                  {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose onClick={() => { methods.reset(); setDurationHours(1); setDurationMins(0); }} />
            <Button type="submit" color="primary" disabled={isPending} loading={isPending}>
              {isEditMode ? "Guardar Cambios" : "Crear Cita"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
