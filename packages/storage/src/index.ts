import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@watch3r/env/server";
import {
	WATCHLIST_COVER_CONTENT_TYPES,
	type WatchlistCoverContentType,
} from "./watchlist";

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

export type PresignUploadResult = {
	uploadUrl: string;
	key: string;
	publicUrl: string;
};

export function createPresignUpload<
	TContentType extends string,
	TParams extends Record<string, string>
>({
	bucket,
	contentTypes,
	buildKey,
	publicBaseUrl = env.S3_PUBLIC_URL,
}: {
	bucket: string;
	contentTypes: Record<TContentType, string>;
	buildKey: (params: TParams & {ext: string}) => string;
	publicBaseUrl?: string;
}) {
	return async function presignUpload({
		contentType,
		expiresInSeconds = 60,
		...params
	}: TParams & {
		contentType: TContentType;
		expiresInSeconds?: number;
	}): Promise<PresignUploadResult> {
		const ext = contentTypes[contentType];
		const key = buildKey({ ...(params as unknown as TParams), ext });

		const command = new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			ContentType: contentType,
		});
		const uploadUrl = await getSignedUrl(s3, command, {
			expiresIn: expiresInSeconds,
		});
		const publicUrl = `${publicBaseUrl.replace(/\/$/, "")}/${key}`;

		return { uploadUrl, key, publicUrl };
	};
}

export async function presignWatchlistCoverUpload({
	watchlistId,
	contentType,
	expiresInSeconds = 60,
}: {
	watchlistId: string;
	contentType: WatchlistCoverContentType;
	expiresInSeconds?: number;
}): Promise<PresignUploadResult> {
	const ext = WATCHLIST_COVER_CONTENT_TYPES[contentType];
	const key = `covers/${watchlistId}/${crypto.randomUUID()}.${ext}`;

	const command = new PutObjectCommand({
		Bucket: env.S3_COVERS_BUCKET,
		Key: key,
		ContentType: contentType,
	});

	const uploadUrl = await getSignedUrl(s3, command, {
		expiresIn: expiresInSeconds,
	});

	const publicUrl = `${env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

	return { uploadUrl, key, publicUrl };
}