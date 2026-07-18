import {and, count, eq} from "drizzle-orm";
import {protectedProcedure, router} from "../index";
import {db} from "@watch3r/db";
import {
	watchlist,
	watchlistMember,
	watchlistInsertSchema,
	watchlistMemberInsertSchema,
	watchlistRoles, watchlistSelectSchema
} from "@watch3r/db/schema/watchlist";
import {z} from "zod";
import {TRPCError} from "@trpc/server";
import {user} from "@watch3r/db/schema/auth";


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
					ownerId: watchlist.ownerId,
					coverImage: watchlist.coverImage,
					updatedAt: watchlist.updatedAt,
					createdAt: watchlist.createdAt,
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
	getWatchlistMembers: protectedProcedure
		.input(z.object({
			watchlistId: watchlistSelectSchema.shape.id,
		}))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const [membership] = await db
				.select({ userId: watchlistMember.userId})
				.from(watchlistMember)
				.where(
					and(
						eq(watchlistMember.watchlistId, input.watchlistId),
						eq(watchlistMember.userId, userId)
					)
				)
				.limit(1);

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a member of this watchlist"
				})
			}
			return db
				.select({
					id: user.id,
					name: user.name,
					image: user.image,
				})
				.from(watchlistMember)
				.innerJoin(user, eq(watchlistMember.userId, user.id))
				.where(eq(watchlistMember.watchlistId, input.watchlistId));
		}),
	create: protectedProcedure
		.input(watchlistInsertSchema.omit({ ownerId: true}).extend({
			memberIds: z.array(watchlistMemberInsertSchema.shape.userId).default([]),
		}))
		.mutation(async ({ ctx, input }) => {
			const { memberIds, ...watchlistData } = input;

			return db.transaction(async (tx) => {
				const [createdWatchlist] = await tx
					.insert(watchlist)
					.values({
						ownerId: ctx.session.user.id,
						name: watchlistData.name,
					}).returning();

				if (!createdWatchlist) {
					// tx.rollback(); -- TS doesn't recognize this as an error, nor does it take any custom message
					//   -- all it does is just throw a special error (so useless?)
					throw new Error("Error Creating new Watchlist");
				}

				// Add the owner as a watchlistMember
				await tx.insert(watchlistMember).values({
					watchlistId: createdWatchlist.id,
						userId: ctx.session.user.id,
						role: watchlistRoles.Owner
				});

				if (memberIds.length > 0) {
					await tx.insert(watchlistMember).values(
						memberIds.map((userId) => ({
							watchlistId: createdWatchlist.id,
							userId: userId,
							role: watchlistRoles.User
						}))
					)
				}
			})
		}),
	update: protectedProcedure
		.input(z.object({
			watchlistId: watchlistSelectSchema.shape.id,
			data: watchlistInsertSchema
				.pick({ name: true, coverImage: true })
				.partial()
				.refine((d) => Object.keys(d).length > 0, {
					message: "No fields provided to update",
				}),
		}))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [membership] = await db
				.select({ role: watchlistMember.role })
				.from(watchlistMember)
				.where(
					and(
						eq(watchlistMember.watchlistId, input.watchlistId),
						eq(watchlistMember.userId, userId)
					)
				)
				.limit(1);

			if (!membership ||
				(membership.role !== watchlistRoles.Owner &&
					membership.role !== watchlistRoles.Admin)
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update this watchlist"
				});
			}

			const [updated] = await db
				.update(watchlist)
				.set(input.data)
				.where(eq(watchlist.id, input.watchlistId))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Watchlist not found"
				});
			}

			return updated;
		})
})