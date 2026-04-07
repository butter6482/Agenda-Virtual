import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import { authOptions } from "./auth";
import { db } from "./db";

export const createTRPCContext = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user
    ? { id: session.user.id, email: session.user.email, name: session.user.name }
    : null;
  return { db, user };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
