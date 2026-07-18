import {z} from "zod";
import {protectedProcedure, router} from "../index";
import {
	MAX_AVATAR_SIZE,
	avatarContentType,
	presignAvatarUpload
} from "@watch3r/storage/avatars";
import {
	MAX_WATCHLIST_COVER_SIZE,
	watchlistCoverContentType,
	presignWatchlistCoverUpload
} from "@watch3r/storage/watchlist";
import {watchlistSelectSchema} from "@watch3r/db/schema/watchlist";


export const storageRouter = router({
	getAvatarUploadUrl: protectedProcedure
		.input(
			z.object({
				contentType: avatarContentType,
				size: z.number().int().positive().max(MAX_AVATAR_SIZE),
			}),
		)
		.mutation(async ({ctx, input}) => {
			return presignAvatarUpload({
				userId: ctx.session.user.id,
				contentType: input.contentType,
			});
		}),
	getWatchlistCoverUploadUrl: protectedProcedure
		.input(
			z.object({
				watchlistId: watchlistSelectSchema.shape.id,
				contentType: watchlistCoverContentType,
				size: z.number().int().positive().max(MAX_WATCHLIST_COVER_SIZE),
			}),
		)
		.mutation(async ({input}) => {
			return presignWatchlistCoverUpload({
				watchlistId: input.watchlistId.toString(),
				contentType: input.contentType,
			});
		})
});
