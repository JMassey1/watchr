import {and, count, eq, sql} from "drizzle-orm";
import {protectedProcedure, router} from "../index";
import {db} from "@watch3r/db";
import {watchlist, watchlistInsertSchema, watchlistMember} from "@watch3r/db/schema/watchlist";
import {z} from "zod";

/*
TODO:
- Delete list (needs to check role of user, admin+ to do it)
- Add member (^^)
- Remove member (^^)
*/

export const watchlistRouter = router({
	myWatchlistCount: protectedProcedure.query(async ({ ctx }) => {
		const [row] = await db
			.select({ value: count() })
			.from(watchlistMember)
			.where(eq(watchlistMember.userId, ctx.session.user.id));

		return { count: row?.value ?? 0 };
	}),
	myWatchlists: protectedProcedure
		.input(z
			.object({
				ownedOnly: z.boolean().optional().default(false)
			}).optional(),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			return db
				.select({
					id: watchlist.id,
					name: watchlist.name,
					owner: watchlist.ownerId,
					isOwner: sql<boolean>`${watchlist.ownerId} = ${userId}`
				})
				.from(watchlistMember)
				.innerJoin(watchlist, eq(watchlistMember.watchlistId, watchlist.id))
				.where(
					input?.ownedOnly
						? and(
							eq(watchlistMember.userId, userId),
							eq(watchlist.ownerId, userId),
							)
						: eq(watchlistMember.userId, userId)
				);
		}),
	create: protectedProcedure
		.input(watchlistInsertSchema.omit({ ownerId: true}))
		.mutation(async ({ ctx, input }) => {
			return db.insert(watchlist).values({...input, ownerId: ctx.session.user.id}).returning();
		})
})