import { campaignRouter } from "@/server/api/routers/campaign";
import { offerRouter } from "@/server/api/routers/offer";
import { presetRouter } from "@/server/api/routers/preset";
import { stackRouter } from "@/server/api/routers/stack";
import { chatRouter } from "@/server/api/routers/chat";
import { configRouter } from "@/server/api/routers/config";
import { cardsRouter } from "@/server/api/routers/cards";
import { adminRouter } from "@/server/api/routers/admin";
import { accountingRouter } from "@/server/api/routers/accounting";
import { domainsRouter } from "@/server/api/routers/domains";
import { accountRouter } from "@/server/api/routers/account";
import { appsRouter } from "@/server/api/routers/apps";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  campaign: campaignRouter,
  offer: offerRouter,
  preset: presetRouter,
  stack: stackRouter,
  chat: chatRouter,
  config: configRouter,
  cards: cardsRouter,
  admin: adminRouter,
  accounting: accountingRouter,
  domains: domainsRouter,
  account: accountRouter,
  apps: appsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
