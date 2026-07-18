import {createPresignUpload} from "./index";
import {env} from "@watch3r/env/server";
import {z} from "zod";

export const AVATAR_CONTENT_TYPES = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
} as const;

export const avatarContentType = z.enum(
	Object.keys(AVATAR_CONTENT_TYPES) as [
		keyof typeof AVATAR_CONTENT_TYPES,
		...(keyof typeof AVATAR_CONTENT_TYPES)[],
	],
);

export type AvatarContentType = keyof typeof AVATAR_CONTENT_TYPES;

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // max 5MB

export const presignAvatarUpload = createPresignUpload<
	AvatarContentType,
	{ userId: string }
>({
	bucket: env.S3_AVATARS_BUCKET,
	contentTypes: AVATAR_CONTENT_TYPES,
	buildKey: ({ userId, ext }) => `avatars/${userId}/${crypto.randomUUID()}.${ext}`,
});

