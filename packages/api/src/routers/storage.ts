import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { presignAvatarUpload } from "@watch3r/storage";
import {
	AVATAR_CONTENT_TYPES,
	MAX_AVATAR_SIZE,
} from "@watch3r/storage/avatars";

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
