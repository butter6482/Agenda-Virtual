import { router } from "../../server/trpc";
import { bookingsRouter } from "./bookings";

export const appRouter = router({
  bookings: bookingsRouter,
});

export type AppRouter = typeof appRouter;
