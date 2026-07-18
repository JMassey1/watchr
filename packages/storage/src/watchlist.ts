import {createPresignUpload} from "./index";
import {env} from "@watch3r/env/server";
import {z} from "zod";

export const WATCHLIST_COVER_CONTENT_TYPES = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
} as const;

export const watchlistCoverContentType = z.enum(
	Object.keys(WATCHLIST_COVER_CONTENT_TYPES) as [
		keyof typeof WATCHLIST_COVER_CONTENT_TYPES,
		...(keyof typeof WATCHLIST_COVER_CONTENT_TYPES)[],
	],
);

export type WatchlistCoverContentType = keyof typeof WATCHLIST_COVER_CONTENT_TYPES;

export const MAX_WATCHLIST_COVER_SIZE = 5 * 1024 * 1024; // max 5MB

export const presignWatchlistCoverUpload = createPresignUpload<
	WatchlistCoverContentType,
	{ watchlistId: string }
>({
	bucket: env.S3_COVERS_BUCKET,
	contentTypes: WATCHLIST_COVER_CONTENT_TYPES,
	buildKey: ({ watchlistId, ext }) => `covers/${watchlistId}/${crypto.randomUUID()}.${ext}`,
})