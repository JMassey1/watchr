import {queryClient, trpc, trpcClient} from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import {watchlistSelectSchema} from "@watch3r/db/schema/watchlist";
import {z} from "zod";

const MAX_COVER_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

function isAllowedType(type: string): type is AllowedType {
	return (ALLOWED_TYPES as readonly string[]).includes(type);
}

export function useCoverUpload({ watchlist }: { watchlist: z.infer<typeof watchlistSelectSchema>}) {
	return useMutation({
		mutationFn: async (file: File) => {
			if (!isAllowedType(file.type)) {
				throw new Error("Unsupported file type. Use PNG, JPEG, or WebP.");
			}
			if (file.size > MAX_COVER_SIZE) {
				throw new Error("Image is too large (max 5MB).");
			}

			const { uploadUrl, publicUrl } =
				await trpcClient.storage.getWatchlistCoverUploadUrl.mutate({
					watchlistId: watchlist.id,
					contentType: file.type,
					size: file.size,
				});

			const res = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			});
			if (!res.ok) {
				throw new Error("Upload failed. Please try again.");
			}

			const updatedWatchlist = await trpcClient.watchlist.update.mutate({
				watchlistId: watchlist.id,
				data: { coverImage: publicUrl }
			});
			await queryClient.invalidateQueries({ queryKey: trpc.watchlist.myWatchlists.queryKey()})
			return updatedWatchlist;
		}
	})
}