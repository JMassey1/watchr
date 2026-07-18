import { z } from "zod";
import { protectedProcedure, router } from "../index";
import {
	AVATAR_CONTENT_TYPES,
	MAX_AVATAR_SIZE,
	presignAvatarUpload,
} from "@watch3r/storage";

const avatarContentType = z.enum(
	Object.keys(AVATAR_CONTENT_TYPES) as [
		keyof typeof AVATAR_CONTENT_TYPES,
		...(keyof typeof AVATAR_CONTENT_TYPES)[],
	],
);

export const storageRouter = router({
	getAvatarUploadUrl: protectedProcedure
		.input(
			z.object({
				contentType: avatarContentType,
				size: z.number().int().positive().max(MAX_AVATAR_SIZE),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return presignAvatarUpload({
				userId: ctx.session.user.id,
				contentType: input.contentType,
			});
		}),
});
