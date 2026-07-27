import {useState} from "react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {useDebouncedValue} from "@tanstack/react-pacer";
import {Film, Loader2, Plus, Search, Tv, X} from "lucide-react";
import {toast} from "sonner";

import {queryClient, trpc} from "@/utils/trpc";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@watch3r/ui/components/dialog";
import {Input} from "@watch3r/ui/components/input";
import {Button} from "@watch3r/ui/components/button";

export function AddTitleDialog({watchlistId, open, onOpenChange}: {
	watchlistId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [query, setQuery] = useState<string>("");
	const [debouncedQuery] = useDebouncedValue(query, {wait: 500});

	const isSearchable = debouncedQuery.trim().length >= 2;
	const searchResults = useQuery(
		trpc.watchlist.searchTitles.queryOptions(
			{query: debouncedQuery},
			{enabled: isSearchable},
		),
	);

	// Track which title is mid-add so we can show a spinner on that row only.
	const [addingId, setAddingId] = useState<number | null>(null);
	const addItem = useMutation(
		trpc.watchlist.addItem.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: trpc.watchlist.getItems.queryKey({watchlistId}),
				});
				toast.success("Title added");
			},
			onError: (err) => {
				toast.error("Couldn't add title");
				console.error("Error adding title", err);
			},
			onSettled: () => setAddingId(null),
		}),
	);

	function reset() {
		setQuery("");
		setAddingId(null);
	}

	const results = searchResults.data ?? [];

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) reset();
				onOpenChange(next);
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader className="flex items-start justify-between border-b border-border p-6">
					<DialogTitle className="font-serif text-xl font-semibold">Add a title</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						Search TMDB for a movie or show to add to this list.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 overflow-hidden px-6 pb-6">
					{/* Search field */}
					<div className="relative">
						<Search
							className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
						<Input
							type="text"
							value={query}
							autoFocus
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search movies & shows..."
							className="pl-9 pr-9"
							aria-label="Search titles"
						/>
						{query.length > 0 && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => setQuery("")}
								className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
								aria-label="Clear search"
							>
								<X className="size-4"/>
							</Button>
						)}
					</div>

					{/* Results */}
					<section className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Results
							</span>
							{searchResults.isLoading && isSearchable && (
								<Loader2 className="size-3.5 animate-spin text-muted-foreground"/>
							)}
						</div>

						{/* States */}
						{query.length > 0 && query.length < 2 && (
							<p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
						)}
						{isSearchable && !searchResults.isLoading && results.length === 0 && (
							<p className="text-sm text-muted-foreground">No titles found.</p>
						)}
						{query.length === 0 && (
							<p className="text-sm text-muted-foreground">Start typing to search for a title.</p>
						)}

						{/* Result rows */}
						<ul className="flex max-h-96 flex-col gap-1 overflow-y-auto scrollbar-hide">
							{isSearchable && results.map((result) => {
								const isAdding = addingId === result.tmdbId;
								return (
									<li key={`${result.mediaType}-${result.tmdbId}`}>
										<div className="flex items-center gap-3 rounded-xl border border-border bg-card p-2 transition-colors hover:bg-secondary/50">
											<div className="relative h-18 w-12 shrink-0 overflow-hidden rounded-md bg-secondary">
												{result.posterUrl ? (
													<img
														src={result.posterUrl}
														alt={`Poster for ${result.title}`}
														className="size-full object-cover"
														loading="lazy"
													/>
												) : (
													<span className="flex size-full items-center justify-center text-muted-foreground">
														{result.mediaType === "tv" ? <Tv className="size-5"/> : <Film className="size-5"/>}
													</span>
												)}
											</div>

											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium">{result.title}</p>
												<p className="text-xs text-muted-foreground">
													<span className="capitalize">{result.mediaType === "tv" ? "series" : "movie"}</span>
													{result.year ? ` \u00b7 ${result.year}` : ""}
												</p>
											</div>

											<Button
												type="button"
												size="sm"
												variant="outline"
												disabled={isAdding || addItem.isPending}
												onClick={() => {
													setAddingId(result.tmdbId);
													addItem.mutate({
														watchlistId,
														tmdbId: result.tmdbId,
														mediaType: result.mediaType,
													});
												}}
												className="gap-1.5"
											>
												{isAdding ? (
													<Loader2 className="size-4 animate-spin"/>
												) : (
													<Plus className="size-4"/>
												)}
												Add
											</Button>
										</div>
									</li>
								);
							})}
						</ul>
					</section>
				</div>
			</DialogContent>
		</Dialog>
	);
}
