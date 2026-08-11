import { env } from "@watch3r/env/server";
import { z } from "zod";

export const mediaTypeSchema = z.enum(["movie", "tv"]);
export type MediaType = z.infer<typeof mediaTypeSchema>;

// Return type for titles
export type TmdbTitle = {
	tmdbId: number;
	mediaType: MediaType;
	title: string;
	year: number | null;
	posterPath: string | null;
	overview: string | null;
	runtime: string | null;
};

async function tmdbFetch<T>(
	path: string,
	schema: z.ZodType<T>,
	params: Record<string, string> = {},
): Promise<T> {
	const url = new URL(`${env.TMDB_API_URL}${path}`);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}

	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${env.TMDB_API_READ_ACCESS_TOKEN}`,
			accept: "application/json",
		},
	});

	if (!res.ok) {
		throw new Error(`TMDB request failed (${res.status}) for ${path}`);
	}

	return schema.parse(await res.json());
}

function yearFromDate(date: string | null | undefined): number | null {
	if (!date) return null;
	const year = Number.parseInt(date.slice(0, 4), 10);
	return Number.isNaN(year) ? null : year;
}

// --- /search/multi ----------------------------------------------------------

const searchResultSchema = z.object({
	id: z.number(),
	media_type: z.string(),
	title: z.string().optional(),
	name: z.string().optional(),
	release_date: z.string().optional(),
	first_air_date: z.string().optional(),
	poster_path: z.string().nullable().optional(),
	overview: z.string().nullable().optional(),
});
const searchResponseSchema = z.object({
	results: z.array(searchResultSchema),
});

export async function searchTitles(query: string): Promise<TmdbTitle[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const { results } = await tmdbFetch("/search/multi", searchResponseSchema, {
		query: trimmed,
		include_adult: "false",
	});

	return results
		.filter((r): r is typeof r & { media_type: MediaType } =>
			r.media_type === "movie" || r.media_type === "tv",
		)
		.map((r) => ({
			tmdbId: r.id,
			mediaType: r.media_type,
			title: (r.title ?? r.name) ?? "",
			year: yearFromDate(r.release_date ?? r.first_air_date),
			posterPath: r.poster_path ?? null,
			overview: r.overview ?? null,
			runtime: null,
		}));
}

// --- /movie/{id} · /tv/{id} --------------------------------------------------

const detailsSchema = z.object({
	id: z.number(),
	title: z.string().optional(),
	name: z.string().optional(),
	release_date: z.string().optional(),
	first_air_date: z.string().optional(),
	poster_path: z.string().nullable().optional(),
	overview: z.string().nullable().optional(),
	runtime: z.number().nullable().optional(),
	episode_run_time: z.array(z.number()).optional(),
	number_of_episodes: z.number().optional(),
	number_of_seasons: z.number().optional(),
});

export async function getTitleDetails(
	tmdbId: number,
	mediaType: MediaType,
): Promise<TmdbTitle> {
	const d = await tmdbFetch(`/${mediaType}/${tmdbId}`, detailsSchema);

	return {
		tmdbId: d.id,
		mediaType,
		title: (d.title ?? d.name) ?? "",
		year: yearFromDate(d.release_date ?? d.first_air_date),
		posterPath: d.poster_path ?? null,
		overview: d.overview ?? null,
		runtime: mediaType === "tv"
					? d.number_of_seasons ? `${d.number_of_seasons} seasons` : null
					: d.runtime ? `${d.runtime} min` : null,
	};
}

// --- images ------------------------------------------------------------------

/** Build a public poster URL the browser can load directly. */
export function posterUrl(
	posterPath: string | null,
	size: "w200" | "w500" | "original" = "w500",
): string {
	if (!posterPath) return "placeholder.svg";
	return `${env.TMDB_IMAGE_BASE_URL}/${size}${posterPath}`;
}
