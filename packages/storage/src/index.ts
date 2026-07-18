import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@watch3r/env/server";

/**
 * S3-compatible client. In dev this points at the local MinIO container; in
 * prod set the S3_* env vars to your Cloudflare R2 credentials/endpoint.
 *
 * `forcePathStyle` is required for MinIO (bucket in the path rather than a
 * virtual-host subdomain).
 */
export const s3 = new S3Client({
	region: env.S3_REGION,
	endpoint: env.S3_ENDPOINT,
	forcePathStyle: true,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
	},
});

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

// Creates presigned upload url
export async function presignAvatarUpload({
	userId,
	contentType,
	expiresInSeconds = 60,
}: {
	userId: string;
	contentType: AvatarContentType;
	expiresInSeconds?: number;
}): Promise<PresignAvatarUploadResult> {
	const ext = AVATAR_CONTENT_TYPES[contentType];
	const key = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;

	const command = new PutObjectCommand({
		Bucket: env.S3_BUCKET,
		Key: key,
		ContentType: contentType,
	});

	const uploadUrl = await getSignedUrl(s3, command, {
		expiresIn: expiresInSeconds,
	});

	const publicUrl = `${env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

	return { uploadUrl, key, publicUrl };
}
