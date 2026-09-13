import {and, count, eq} from "drizzle-orm";
import {protectedProcedure, router} from "../index";
import {db} from "@watch3r/db";
import {
	watchlist,
	watchlistMember,
	watchlistInsertSchema,
	watchlistMemberInsertSchema,
	watchlistRoles, watchlistSelectSchema,
	title,
	watchlistItem,
	mediaTypeEnum, type WatchlistRole,
} from "@watch3r/db/schema/watchlist";
import {z} from "zod";
import {TRPCError} from "@trpc/server";
import {user} from "@watch3r/db/schema/user";
import {searchTitles, getTitleDetails, posterUrl} from "@watch3r/tmdb";


/*
TODO:
- Delete list (needs to check role of user, admin+ to do it)
- Add member (^^)
- Remove member (^^)
*/

async function requireMembership(watchlistId: number, userId: string, acceptedRoles?: WatchlistRole[], errorMsg?: string) {
	const [membership] = await db
		.select({ role: watchlistMember.role })
		.from(watchlistMember)
		.where(
			and(
				eq(watchlistMember.watchlistId, watchlistId),
				eq(watchlistMember.userId, userId)
			)
		)
		.limit(1);

	if (!membership) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not a member of this watchlist"
		});
	}
	if (acceptedRoles && !acceptedRoles.includes(membership.role)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: errorMsg ?? "You do not have permission to perform this action"
		});
	}
	return membership;
}

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
					description: watchlist.description,
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
					role: watchlistMember.role,
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
			await requireMembership(input.watchlistId, userId);

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
		}),

	searchTitles: protectedProcedure
		.input(z.object({ query: z.string().min(1) }))
		.query(async ({ input }) => {
			const results = await searchTitles(input.query);
			// Build poster URLs server-side (env is server-only); the browser
			// loads these public CDN links directly.
			return results.map((r) => ({
				tmdbId: r.tmdbId,
				mediaType: r.mediaType,
				title: r.title,
				year: r.year,
				overview: r.overview,
				posterUrl: posterUrl(r.posterPath, "w200"),
			}));
		}),

	addItem: protectedProcedure
		.input(z.object({
			watchlistId: watchlistSelectSchema.shape.id,
			tmdbId: z.number().int().positive(),
			mediaType: z.enum(mediaTypeEnum.enumValues),
		}))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			await requireMembership(input.watchlistId, userId);

			const details = await getTitleDetails(input.tmdbId, input.mediaType);

			return db.transaction(async (tx) => {
				const [titleRow] = await tx
					.insert(title)
					.values({
						tmdbId: details.tmdbId,
						mediaType: details.mediaType,
						name: details.title,
						releaseYear: details.year,
						posterPath: details.posterPath,
						overview: details.overview,
						runtime: details.runtime,
					})
					.onConflictDoUpdate({
						target: [title.tmdbId, title.mediaType],
						set: {
							name: details.title,
							releaseYear: details.year,
							posterPath: details.posterPath,
							overview: details.overview,
							runtime: details.runtime,
						},
					})
					.returning();

				if (!titleRow) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to persist title",
					});
				}

				await tx
					.insert(watchlistItem)
					.values({
						watchlistId: input.watchlistId,
						titleId: titleRow.id,
						addedBy: userId,
					})
					.onConflictDoNothing();

				return { titleId: titleRow.id };
			});
		}),
	setWatched: protectedProcedure
		.input(z.object({
			watchlistId: watchlistSelectSchema.shape.id,
			titleId: z.number().int().positive(),
			watched: z.boolean(),
		}))
		.mutation(async ({ ctx, input }) => {
			await requireMembership(input.watchlistId, ctx.session.user.id);

			const [updated] = await db
				.update(watchlistItem)
				.set({ watched: input.watched })
				.where(
					and(
						eq(watchlistItem.watchlistId, input.watchlistId),
						eq(watchlistItem.titleId, input.titleId)
					)
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Watchlist item not found"
				});
			}

			return updated;
		}),
	removeItem: protectedProcedure
		.input(z.object({
			watchlistId: watchlistSelectSchema.shape.id,
			titleId: z.number().int().positive(),
		}))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			await requireMembership(input.watchlistId, userId);

			const [watchlistOwner] = await db
				.select({ ownerId: watchlist.ownerId })
				.from(watchlist)
				.where(eq(watchlist.id, input.watchlistId))
				.limit(1);

			if (!watchlistOwner || watchlistOwner.ownerId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the watchlist owner can remove items"
				});
			}

			const [removed] = await db
				.delete(watchlistItem)
				.where(
					and(
						eq(watchlistItem.watchlistId, input.watchlistId),
						eq(watchlistItem.titleId, input.titleId)
					)
				)
				.returning();

			if (!removed) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Watchlist item not found"
				});
			}

			return removed;
		}),
	// List the titles on a watchlist, shaped to what the UI renders.
	getItems: protectedProcedure
		.input(z.object({
			watchlistId: watchlistSelectSchema.shape.id,
		}))
		.query(async ({ ctx, input }) => {
			await requireMembership(input.watchlistId, ctx.session.user.id);

			const rows = await db
				.select({
					id: title.id,
					name: title.name,
					year: title.releaseYear,
					mediaType: title.mediaType,
					posterPath: title.posterPath,
					runtime: title.runtime,
					watched: watchlistItem.watched,
					addedAt: watchlistItem.addedAt,
					addedBy: watchlistItem.addedBy
				})
				.from(watchlistItem)
				.innerJoin(title, eq(watchlistItem.titleId, title.id))
				.where(eq(watchlistItem.watchlistId, input.watchlistId));

			return rows.map((r) => {
				const {posterPath, ...row} = r;
				return {
					...row,
					posterUrl: posterUrl(r.posterPath, "w500")
				}
			})
		})
})
