import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@watch3r/env/server";

export const s3 = new S3Client({
	region: env.S3_REGION,
	endpoint: env.S3_ENDPOINT,
	forcePathStyle: true,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
	},
});

/**
 * Client used solely to generate presigned URLs the BROWSER will execute.
 * It is configured with the browser-reachable endpoint so the signed `host`
 * matches what the browser hits. Signing is offline, so this client never
 * opens a connection to the storage backend.
 */
export const s3Presign = new S3Client({
	region: env.S3_REGION,
	endpoint: env.S3_PUBLIC_ENDPOINT,
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
		const uploadUrl = await getSignedUrl(s3Presign, command, {
			expiresIn: expiresInSeconds,
		});
		const publicUrl = `${publicBaseUrl.replace(/\/$/, "")}/${bucket}/${key}`;

		return { uploadUrl, key, publicUrl };
	};
}
