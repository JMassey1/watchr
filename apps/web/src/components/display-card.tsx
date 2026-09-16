import {Link, LinkProps} from "@tanstack/react-router";
import type {ReactNode} from "react";
import {Check} from "lucide-react";
import {Progress} from "@watch3r/ui/components/progress";

type DisplayCardProps = {
	coverImage?: string | null;
	title?: string | null;
	description?: string | null;
	badge?: ReactNode;
	cornerLabel?: ReactNode;
	progress?: { watched: number; total: number };
	isWatched?: boolean;
	disableHoverEffect?: boolean;
	footer?: ReactNode;
	link?: LinkProps;
}

export function DisplayCard(props: DisplayCardProps) {
	const {
		coverImage,
		title,
		description,
		badge,
		cornerLabel,
		progress,
		footer,
		link,
		isWatched = false,
		disableHoverEffect = false
	} = props;
	const progressPercent = progress && progress.total > 0
		? Math.round((progress.watched / progress.total) * 100)
		: 0;

	const hoverClassname = disableHoverEffect
		? ""
		: "transition-[border-color,box-shadow] hover:border-primary hover:shadow-lg hover:shadow-black/5";

	const footerClassname = (title || description || progress)
		? "mt-auto border-t border-border pt-4"
		: "mt-auto"

	const card = (
		<article
			className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg hover:shadow-black/5 ${hoverClassname}`}>

			{/* Top Section */}
			<div className="relative aspect-16/10 overflow-hidden">
				{/* Image */}
				<img
					src={coverImage || "placeholder.svg"}
					alt={`Cover art for ${title}`}
					sizes="(max-width: 768px) 100vw, 33vs"
					style={coverImage && isWatched ? {filter: "grayscale(100%)"} : undefined}
					className={`object-cover transition-transform duration-300 ${
						!isWatched ? "group-hover:scale-105" : ""
					}`}
				/>
				<div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/0 to-black/0"/>

				{/* Badge */}
				{badge && (
					<span
						className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-card-foreground backdrop-blur-sm">
						{badge}
					</span>
				)}

				{/* Corner Label */}
				{cornerLabel && (
					<span
						className="absolute bottom-3 right-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-card-foreground backdrop-blur-sm">
						{cornerLabel}
					</span>
				)}
			</div>

			{/* Bottom Section */}
			<div className="flex flex-1 flex-col gap-4 p-5">

				{/* Title/Description */}
				{(title || description) && (
					<div className="space-y-1.5">
						{title && (
							<h3 className="font-serif text-lg font-semibold leading-tight text-balance">{title}</h3>
						)}
						{description && (
							<p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
						)}
					</div>
				)}

				{/* Progress */}
				{progress && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
							<span className="inline-flex items-center gap-1">
								<Check className="size-3.5 text-primary" aria-hidden="true"/>
								{progress.watched} of {progress.total} watched
							</span>
							<span>{progressPercent}%</span>
						</div>
						<Progress value={progressPercent} className="h-1.5 w-full"/>
					</div>
				)}

				{/* Footer */}
				{footer && (
					<div className={footerClassname}>
						{footer}
					</div>
				)}
			</div>
		</article>
	);

	if (link) {
		return (
			<Link {...link} className="block">
				{card}
			</Link>
		);
	}
	return card;
}