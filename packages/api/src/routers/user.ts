import {protectedProcedure, router} from "../index";
import {TRPCError} from "@trpc/server";
import {z} from "zod";
import {db} from "@watch3r/db";
import {watchlistMember} from "@watch3r/db/schema/watchlist";
import {themePresetEnum, user, userSettings} from "@watch3r/db/schema/user";
import {and, eq, ilike, notInArray, or} from "drizzle-orm";


export const userRouter = router({
	searchUsers: protectedProcedure
		.input(
			z.object({
				watchlistId: z.number().optional(),
				excludeExistingMembers: z.boolean().optional().default(true),
				query: z.string().trim().min(2).max(100),
				limit: z.number().min(1).max(20).default(10)
			}),
		)
		.query(async ({ctx, input}) => {
			const excludeIds = [ctx.session.user.id];
			if (input.excludeExistingMembers && input.watchlistId) {
				const existing = await db
					.select({userId: watchlistMember.userId})
					.from(watchlistMember)
					.where(eq(watchlistMember.watchlistId, input.watchlistId));
				existing.map((member) => {
					excludeIds.push(member.userId);
				})
			}

			const term = `%${input.query}%`;
			return db
				.select({id: user.id, name: user.name, image: user.image})
				.from(user)
				.where(
					and(
						or(ilike(user.name, term), ilike(user.email, term)),
						excludeIds.length > 0
							? notInArray(user.id, excludeIds)
							: undefined,
					),
				)
				.limit(input.limit);

		}),

	settings: protectedProcedure
		.query(async ({ctx}) => {
			const userId = ctx.session.user.id;

			// Users should always have settings, so add them if they don't have it
			await db
				.insert(userSettings)
				.values({userId})
				.onConflictDoNothing();

			const [settings] = await db
				.select({
					themePreset: userSettings.themePreset
				})
				.from(userSettings)
				.where(eq(userSettings.userId, userId))
				.limit(1);

			if (!settings) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to load user settings",
				});
			}

			return settings;
		}),

	updateSettings: protectedProcedure
		.input(z.object({
			themePreset: z.enum(themePresetEnum.enumValues),
		}))
		.mutation(async ({ctx, input}) => {
			const [settings] = await db
				.insert(userSettings)
				.values({
					userId: ctx.session.user.id,
					themePreset: input.themePreset,
				})
				.onConflictDoUpdate({
					target: userSettings.userId,
					set: {themePreset: input.themePreset},
				})
				.returning();

			if (!settings) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update user settings",
				});
			}

			return settings;
		})
})
