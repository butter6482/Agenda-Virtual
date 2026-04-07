import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { router, authedProcedure } from "../../server/trpc";

dayjs.extend(utc);
dayjs.extend(timezone);

const SALON_TZ = "America/Puerto_Rico";

// ── Shared schemas ──────────────────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const ZGetDayBookingsInput = z.object({
  date: z.string().regex(dateRegex),
  endDate: z.string().regex(dateRegex).optional(),
  timezone: z.string().default(SALON_TZ),
});

const ZCreateManualBookingInput = z.object({
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

const ZUpdateManualBookingInput = z.object({
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

// Export schema types for components
export type TCreateManualBookingInput = z.infer<typeof ZCreateManualBookingInput>;
export { ZCreateManualBookingInput as ZCreateManualBookingInputSchema };

export type TUpdateManualBookingInput = z.infer<typeof ZUpdateManualBookingInput>;

// ── Helper: verify admin access ─────────────────────────────────────────────

async function getAccessibleUserIds(db: PrismaClient, userId: number): Promise<number[]> {
  const adminMemberships = await db.membership.findMany({
    where: { userId, accepted: true, role: { in: ["OWNER", "ADMIN"] } },
    select: { teamId: true },
  });
  const adminTeamIds = adminMemberships.map((m: { teamId: number }) => m.teamId);
  if (adminTeamIds.length === 0) return [userId];

  const teamMembers = await db.membership.findMany({
    where: { teamId: { in: adminTeamIds }, accepted: true },
    select: { userId: true },
  });
  return Array.from(new Set([userId, ...teamMembers.map((m: { userId: number }) => m.userId)]));
}

// ── Router ──────────────────────────────────────────────────────────────────

export const bookingsRouter = router({
  // ── List day bookings (single day or range) ──────────────────────────────
  getDayBookings: authedProcedure.input(ZGetDayBookingsInput).query(async ({ ctx, input }) => {
    const { user, db } = ctx;
    const { date, endDate, timezone: tz } = input;

    const startOfRange = dayjs.tz(date, tz).startOf("day").toDate();
    const endOfRange = endDate
      ? dayjs.tz(endDate, tz).endOf("day").toDate()
      : dayjs.tz(date, tz).endOf("day").toDate();

    const accessibleUserIds = await getAccessibleUserIds(db, user.id);

    const bookings = await db.booking.findMany({
      where: {
        startTime: { gte: startOfRange, lte: endOfRange },
        status: { notIn: ["CANCELLED", "REJECTED"] },
        userId: { in: accessibleUserIds },
        NOT: { title: { contains: "meeting", mode: "insensitive" } },
      },
      select: {
        id: true,
        uid: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true,
        salonPrice: true,
        description: true,
        user: { select: { id: true, name: true, email: true } },
        attendees: { select: { name: true, email: true, phoneNumber: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return bookings;
  }),

  // ── Create manual booking ─────────────────────────────────────────────────
  createManual: authedProcedure.input(ZCreateManualBookingInput).mutation(async ({ ctx, input }) => {
    const { user, db } = ctx;
    const {
      serviceName, startTime, customerName, customerPhone, customerEmail,
      notes, customerTimezone, staffUserId, durationMinutes, salonPrice,
    } = input;

    let bookingUserId = user.id;
    let bookingUserEmail = user.email;

    if (staffUserId && staffUserId !== user.id) {
      const sharedTeam = await db.membership.findFirst({
        where: {
          userId: user.id,
          accepted: true,
          role: { in: ["OWNER", "ADMIN"] },
          team: { members: { some: { userId: staffUserId, accepted: true } } },
        },
      });
      if (!sharedTeam) throw new TRPCError({ code: "FORBIDDEN", message: "Sin permiso para esta empleada." });

      const staffUser = await db.user.findUnique({ where: { id: staffUserId }, select: { id: true, email: true } });
      if (!staffUser) throw new TRPCError({ code: "NOT_FOUND", message: "Empleada no encontrada." });

      bookingUserId = staffUser.id;
      bookingUserEmail = staffUser.email;
    }

    const start = dayjs.utc(startTime);
    const end = start.add(durationMinutes, "minutes");
    const uid = uuidv4();

    const booking = await db.booking.create({
      data: {
        uid,
        title: `${serviceName} - ${customerName}`,
        startTime: start.toDate(),
        endTime: end.toDate(),
        status: "ACCEPTED",
        userId: bookingUserId,
        userPrimaryEmail: bookingUserEmail,
        description: notes || null,
        salonPrice: salonPrice ?? null,
        responses: { name: customerName, email: customerEmail || "", phone: customerPhone, notes: notes || "" },
        attendees: {
          create: {
            name: customerName,
            email: customerEmail || (customerPhone ? `${customerPhone}@coquibook.local` : `${uid}@coquibook.local`),
            timeZone: customerTimezone,
            phoneNumber: customerPhone || null,
            locale: "es",
          },
        },
      },
      select: {
        id: true, uid: true, title: true, startTime: true, endTime: true, status: true,
        attendees: { select: { name: true, email: true, phoneNumber: true } },
      },
    });

    return booking;
  }),

  // ── Update manual booking ─────────────────────────────────────────────────
  updateManualBooking: authedProcedure.input(ZUpdateManualBookingInput).mutation(async ({ ctx, input }) => {
    const { user, db } = ctx;
    const { bookingUid, serviceName, customerName, customerPhone, customerEmail, startTime, durationMinutes, staffUserId, salonPrice, notes } = input;

    const booking = await db.booking.findUnique({
      where: { uid: bookingUid },
      select: { id: true, uid: true, userId: true, attendees: { select: { id: true, email: true } } },
    });
    if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Cita no encontrada." });

    if (booking.userId !== user.id) {
      const sharedTeam = await db.membership.findFirst({
        where: {
          userId: user.id, accepted: true, role: { in: ["OWNER", "ADMIN"] },
          team: { members: { some: { userId: booking.userId ?? 0, accepted: true } } },
        },
      });
      if (!sharedTeam) throw new TRPCError({ code: "FORBIDDEN", message: "Sin permiso para editar esta cita." });
    }

    let targetUserId = booking.userId ?? user.id;
    if (staffUserId && staffUserId !== booking.userId) {
      const hasAccess = await db.membership.findFirst({
        where: {
          userId: user.id, accepted: true, role: { in: ["OWNER", "ADMIN"] },
          team: { members: { some: { userId: staffUserId, accepted: true } } },
        },
      });
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "No puedes asignar a esta empleada." });
      targetUserId = staffUserId;
    }

    const start = dayjs.utc(startTime);
    const end = start.add(durationMinutes, "minute");

    await db.booking.update({
      where: { uid: bookingUid },
      data: {
        title: `${serviceName} - ${customerName}`,
        startTime: start.toDate(),
        endTime: end.toDate(),
        userId: targetUserId,
        description: notes || null,
        salonPrice: salonPrice ?? null,
      },
    });

    const attendee = booking.attendees[0];
    if (attendee) {
      const newEmail = customerEmail || (customerPhone ? `${customerPhone}@coquibook.local` : attendee.email);
      await db.attendee.update({
        where: { id: attendee.id },
        data: { name: customerName, email: newEmail, phoneNumber: customerPhone || null },
      });
    }

    return { success: true };
  }),

  // ── Cancel booking ────────────────────────────────────────────────────────
  cancelBooking: authedProcedure
    .input(z.object({ uid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.booking.update({ where: { uid: input.uid }, data: { status: "CANCELLED" } });
      return { success: true };
    }),

  // ── Save daily tip ────────────────────────────────────────────────────────
  saveDailyTip: authedProcedure
    .input(z.object({ date: z.string(), staffUserId: z.number(), amount: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.salonDailyTip.upsert({
        where: { date_staffUserId: { date: input.date, staffUserId: input.staffUserId } },
        create: { date: input.date, staffUserId: input.staffUserId, amount: input.amount },
        update: { amount: input.amount },
      });
      return { success: true };
    }),

  // ── Get weekly tips ───────────────────────────────────────────────────────
  getWeeklyTips: authedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const tips = await ctx.db.salonDailyTip.findMany({
        where: { date: { gte: input.startDate, lte: input.endDate } },
      });
      const result: Record<string, Record<number, number>> = {};
      for (const tip of tips) {
        if (!result[tip.date]) result[tip.date] = {};
        result[tip.date][tip.staffUserId] = tip.amount;
      }
      return result;
    }),

  // ── List staff members ────────────────────────────────────────────────────
  listStaff: authedProcedure.query(async ({ ctx }) => {
    const { user, db } = ctx;
    const memberships = await db.membership.findMany({
      where: {
        userId: user.id,
        accepted: true,
        team: { members: { some: { accepted: true } } },
      },
      select: {
        team: {
          select: {
            members: {
              where: { accepted: true, role: "MEMBER" },
              select: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
            },
          },
        },
      },
    });

    const seen = new Set<number>();
    const staff: { id: number; name: string | null; email: string; avatarUrl: string | null }[] = [];
    for (const m of memberships) {
      for (const member of m.team.members) {
        if (!seen.has(member.user.id)) {
          seen.add(member.user.id);
          staff.push(member.user);
        }
      }
    }
    return staff;
  }),
});
