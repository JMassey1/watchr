import {protectedProcedure, router} from "../index";
import {z} from "zod";
import {db} from "@watch3r/db";
import {watchlistMember} from "@watch3r/db/schema/watchlist";
import {user} from "@watch3r/db/schema/auth";
import {and, eq, ilike, or, notInArray} from "drizzle-orm";



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

		})
})