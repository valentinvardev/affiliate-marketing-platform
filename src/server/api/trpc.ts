import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getServerSession } from "next-auth";
import { db } from "@/server/db";
import { authOptions } from "@/server/auth";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getServerSession(authOptions);
  return { db, session, ...opts };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  if (t._config.isDev) {
    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 400) + 100));
  }
  const result = await next();
  console.log(`[TRPC] ${path} took ${Date.now() - start}ms`);
  return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

/** Requiere sesión iniciada. Estrecha ctx.session a no-nulo. */
export const protectedProcedure = t.procedure.use(timingMiddleware).use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Iniciá sesión." });
  }
  return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } });
});

/** Requiere rol admin. */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin." });
  }
  return next({ ctx });
});

/** Requiere rol estrategista o admin. */
export const estrategistaProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.session.user.role;
  if (role !== "estrategista" && role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo estrategista o admin." });
  }
  return next({ ctx });
});
