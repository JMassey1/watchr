import {z} from "zod";
import {watchlistSelectSchema} from "@watch3r/db/schema/watchlist";
import {authClient} from "@/lib/auth-client";
import {Check, Crown, Users} from "lucide-react";
import {MemberStack} from "@/components/member-stack";
import {useQuery} from "@tanstack/react-query";
import {trpc} from "@/utils/trpc";
import {formatDateOnly} from "@/utils/dates";
import {Link} from "@tanstack/react-router";


export function WatchlistCard({watchlist}: { watchlist: z.infer<typeof watchlistSelectSchema> }) {
	const {data: session} = authClient.useSession();
	const isOwner = session?.user.id === watchlist.ownerId;
	const watched = 0; // TODO: Pull items from list
	const total = 100; // ^^
	const pct_watched = Math.round((watched / total) * 100);

	const watchlistMembers = useQuery(
		trpc.watchlist.getWatchlistMembers.queryOptions({watchlistId: watchlist.id})
	);

	return (
		<Link to="/watchlist/$watchlistId" params={{ watchlistId: String(watchlist.id)}} className="block">

			<article
				className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg hover:shadow-black/5">
				<div className="relative aspect-[16/10] overflow-hidden">
					<img
						src={"/placeholder.svg"}
						alt={`Cover art for ${watchlist.name}`}
						sizes="(max-width: 768px) 100vw, 33vw"
						className="object-cover transition-transform duration-300 group-hover:scale-105"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0"/>
					<span
						className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-card-foreground backdrop-blur-sm">
          {isOwner ? (
			  <>
				  <Crown className="size-3.5 text-primary" aria-hidden="true"/>
				  Owner
			  </>
		  ) : (
			  <>
				  <Users className="size-3.5 text-muted-foreground" aria-hidden="true"/>
				  Member
			  </>
		  )}
        </span>
					<span
						className="absolute bottom-3 right-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-card-foreground backdrop-blur-sm">
          {total} titles
        </span>
				</div>

				<div className="flex flex-1 flex-col gap-4 p-5">
					<div className="space-y-1.5">
						<h3 className="font-serif text-lg font-semibold leading-tight text-balance">{watchlist.name}</h3>
						<p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">Watchlist Description
							FIXME</p>
					</div>

					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Check className="size-3.5 text-primary" aria-hidden="true"/>
				{watched} of {total} watched
            </span>
							<span>{pct_watched}%</span>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
							<div
								className="h-full rounded-full bg-primary transition-all"
								style={{width: `${pct_watched}%`}}
							/>
						</div>
					</div>

					<div className="mt-auto flex items-center justify-between border-t border-border pt-4">
						<MemberStack users={watchlistMembers.data ?? []} size="sm"/>
						<span
							className="text-xs text-muted-foreground">Updated {formatDateOnly(watchlist.updatedAt)}</span>
					</div>
				</div>
			</article>
		</Link>
	)
}