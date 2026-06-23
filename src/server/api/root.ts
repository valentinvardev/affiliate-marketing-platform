import { campaignRouter } from "@/server/api/routers/campaign";
import { offerRouter } from "@/server/api/routers/offer";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  campaign: campaignRouter,
  offer: offerRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
