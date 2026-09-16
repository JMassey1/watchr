import {z} from "zod";
import {watchlistSelectSchema} from "@watch3r/db/schema/watchlist";
import {authClient} from "@/lib/auth-client";
import {Crown, Users} from "lucide-react";
import {MemberStack} from "@/components/member-stack";
import {useQuery} from "@tanstack/react-query";
import {trpc} from "@/utils/trpc";
import type {inferRouterOutputs} from "@trpc/server";
import type {AppRouter} from "@watch3r/api/routers/index";
import {formatDateOnly} from "@/utils/dates";
import {DisplayCard} from "@/components/display-card";

type Watchlist = inferRouterOutputs<AppRouter>["watchlist"]["myWatchlists"][number];

export function WatchlistCard({watchlist}: { watchlist: Watchlist }) {
	const {data: session} = authClient.useSession();
	const isOwner = session?.user.id === watchlist.ownerId;

	const watchlistMembers = useQuery(
		trpc.watchlist.getWatchlistMembers.queryOptions({watchlistId: watchlist.id})
	);

	return (
		<DisplayCard
			title={watchlist.name}
			description={watchlist.description}
			coverImage={watchlist.coverImage}
			link={{
				to: "/watchlist/$watchlistId",
				params: { watchlistId: String(watchlist.id) }
			}}
			badge={
				isOwner ? (
					<>
						<Crown className="size-3.5 text-primary" aria-hidden="true" />
						Owner
					</>
				) : (
					<>
						<Users className="size-3.5 text-primary" aria-hidden="true" />
						Member
					</>
				)
			}
			cornerLabel={`${watchlist.itemCount} titles`}
			progress={{ watched: watchlist.watchedCount, total: watchlist.itemCount}}
			footer={(
				<div className="flex items-center justify-between">
					<MemberStack users={watchlistMembers.data ?? []} size="sm"/>
					<span className="text-xs text-muted-foreground">
						Updated {formatDateOnly(watchlist.updatedAt)}
					</span>
				</div>

			)}
		/>
	)
}
