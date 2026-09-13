import {Button} from "@watch3r/ui/components/button";
import {Eye, EyeOff, Trash2} from "lucide-react";

type DisplayRowProps = {
	posterUrl?: string | null;
	title: string;
	mediaType: "movie" | "tv";
	year: number | null;
	runtime: string | null;
	watchlistActions: {
		watched: boolean;
		onToggleWatched: () => void;
		onRemove?: () => void;
		disabled?: boolean;
	};
};

export function DisplayRow({posterUrl, title, mediaType, year, runtime, watchlistActions}: DisplayRowProps) {
	return (
		<article className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3 sm:gap-4">
			<img
				src={posterUrl?.trim() || "/placeholder.svg"}
				alt={`Cover art for ${title}`}
				loading="lazy"
				className="aspect-2/3 w-14 shrink-0 rounded-lg object-cover sm:w-16"
			/>
			<div className="min-w-0 flex-1">
				<h3 className="wrap-break-word font-serif text-lg font-semibold leading-tight">{title}</h3>
				<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
					<span>{mediaType === "movie" ? "Movie" : "TV"}</span>
					{year !== null && <span>{year}</span>}
					{runtime && <span className="min-w-0 wrap-break-word">{runtime}</span>}
					<span>{watchlistActions.watched ? "Watched" : "To watch"}</span>
				</div>
			</div>
			<div className="flex shrink-0 flex-col gap-2 sm:flex-row">
				<Button
					type="button"
					variant={watchlistActions.watched ? "default" : "secondary"}
					size="icon"
					onClick={watchlistActions.onToggleWatched}
					disabled={watchlistActions.disabled}
					aria-label={`Watched: ${title}`}
					aria-pressed={watchlistActions.watched}
					title={`Mark ${title} as ${watchlistActions.watched ? "unwatched" : "watched"}`}
					className="size-11 rounded-lg focus-visible:ring-2"
				>
					{watchlistActions.watched ? <Eye aria-hidden="true" className="size-5"/> : <EyeOff aria-hidden="true" className="size-5"/>}
				</Button>
				{watchlistActions.onRemove && (
					<Button
						type="button"
						variant="destructive"
						size="icon"
						onClick={watchlistActions.onRemove}
						disabled={watchlistActions.disabled}
						aria-label={`Remove ${title} from this watchlist`}
						title={`Remove ${title} from this watchlist`}
						className="size-11 rounded-lg focus-visible:ring-2"
					>
						<Trash2 aria-hidden="true" className="size-5"/>
					</Button>
				)}
			</div>
		</article>
	);
}
