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
	mediaTypeEnum,
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

export const watchlistProcedure = protectedProcedure
	.input(z.object({ watchlistId: watchlistSelectSchema.shape.id }))
	.use(async ({ ctx, input, meta, next }) => {
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

		if (!membership) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You are not a member of this watchlist"
			});
		}
		if (meta?.allowedWatchlistRoles && !meta.allowedWatchlistRoles.includes(membership.role)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have permission to perform this action"
			});
		}

		return next({
			ctx: {
				...ctx,
				watchlistMembership: membership,
			}
		})
	});

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
					role: watchlistMember.role,
					coverImage: watchlist.coverImage,
					updatedAt: watchlist.updatedAt,
					createdAt: watchlist.createdAt,

					itemCount: db.$count(watchlistItem, eq(watchlistItem.watchlistId, watchlist.id)),
					watchedCount: db.$count(watchlistItem, and(eq(watchlistItem.watchlistId, watchlist.id), eq(watchlistItem.watched, true))),
					unwatchedCount: db.$count(watchlistItem, and(eq(watchlistItem.watchlistId, watchlist.id), eq(watchlistItem.watched, false))),
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
	update: watchlistProcedure
		.input(z.object({
			data: watchlistInsertSchema
				.pick({ name: true, coverImage: true })
				.partial()
				.refine((d) => Object.keys(d).length > 0, {
					message: "No fields provided to update",
				}),
		}))
		.mutation(async ({ input }) => {
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

	deleteWatchlist: watchlistProcedure
		.meta({ allowedWatchlistRoles: [watchlistRoles.Owner]})
		.input(z.object({ watchlistId: watchlistSelectSchema.shape.id }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const [deleted_watchlist] = await db
				.delete(watchlist)
				.where(and(
					eq(watchlist.id, input.watchlistId),
					eq(watchlist.ownerId, userId)
				))
				.returning(({ deletedId: watchlist.id}));

			if (!deleted_watchlist) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Watchlist not found"
				});
			}
		}),

	leaveWatchlist: watchlistProcedure
		.mutation(async ({ }) => {
			//TODO: Implement this
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

	addItem: watchlistProcedure
		.input(z.object({
			tmdbId: z.number().int().positive(),
			mediaType: z.enum(mediaTypeEnum.enumValues),
		}))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
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
	setWatched: watchlistProcedure
		.input(z.object({
			titleId: z.number().int().positive(),
			watched: z.boolean(),
		}))
		.mutation(async ({ input }) => {
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
	removeItem: watchlistProcedure
		.meta({ allowedWatchlistRoles: [watchlistRoles.Owner, watchlistRoles.Admin]})
		.input(z.object({
			titleId: z.number().int().positive(),
		}))
		.mutation(async ({ input }) => {
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
	getItems: watchlistProcedure
		.query(async ({ input }) => {
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
