import { protectedProcedure, publicProcedure, router } from "../index";
import {watchlistRouter} from "./watchlist";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  watchlist: watchlistRouter
});
export type AppRouter = typeof appRouter;
