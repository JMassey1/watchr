import { protectedProcedure, publicProcedure, router } from "../index";
import {watchlistRouter} from "./watchlist";
import {userRouter} from "./user";
import {storageRouter} from "./storage";

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
  watchlist: watchlistRouter,
  user: userRouter,
  storage: storageRouter,
});
export type AppRouter = typeof appRouter;
