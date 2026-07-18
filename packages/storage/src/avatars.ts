export const AVATAR_CONTENT_TYPES = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
} as const;

export type AvatarContentType = keyof typeof AVATAR_CONTENT_TYPES;

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // max 5MB

export type PresignAvatarUploadResult = {
	uploadUrl: string;
	key: string;
	publicUrl: string;
};