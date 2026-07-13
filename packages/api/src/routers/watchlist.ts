import { count, eq } from "drizzle-orm";
import {protectedProcedure, router} from "../index";
import {db} from "@watch3r/db";
import {watchlistMember} from "@watch3r/db/schema/watchlist";

export const watchlistRouter = router({
	myWatchlistCount: protectedProcedure.query(async ({ ctx }) => {
		const [row] = await db
			.select({ value: count() })
			.from(watchlistMember)
			.where(eq(watchlistMember.userId, ctx.session.user.id));

		return { count: row?.value ?? 0 };
	})
})