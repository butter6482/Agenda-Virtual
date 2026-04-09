import { z } from "zod";

const SALON_TZ = "America/Puerto_Rico";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const ZGetDayBookingsInput = z.object({
  date: z.string().regex(dateRegex),
  endDate: z.string().regex(dateRegex).optional(),
  timezone: z.string().default(SALON_TZ),
});

export const ZCreateManualBookingInput = z.object({
  serviceName: z.string().min(1, "El servicio es requerido"),
  startTime: z.preprocess((val) => {
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
      const [datePart, timePart] = val.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);
      const utcMs = Date.UTC(year, month - 1, day, hours + 4, minutes, 0);
      return new Date(utcMs).toISOString();
    }
    return val;
  }, z.string().datetime()),
  customerName: z.string().min(1, "Nombre del cliente es requerido"),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  customerTimezone: z.string().default(SALON_TZ),
  staffUserId: z.number().int().positive().optional(),
  durationMinutes: z.number().int().min(5).default(60),
  salonPrice: z.number().min(0).optional(),
});

export const ZUpdateManualBookingInput = z.object({
  bookingUid: z.string(),
  serviceName: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  startTime: z.preprocess((val) => {
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
      const [datePart, timePart] = val.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);
      const utcMs = Date.UTC(year, month - 1, day, hours + 4, minutes, 0);
      return new Date(utcMs).toISOString();
    }
    return val;
  }, z.string().datetime()),
  durationMinutes: z.number().min(15).max(480),
  staffUserId: z.number().optional(),
  salonPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export type TCreateManualBookingInput = z.infer<typeof ZCreateManualBookingInput>;
export type TUpdateManualBookingInput = z.infer<typeof ZUpdateManualBookingInput>;
