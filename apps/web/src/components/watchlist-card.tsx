import {z} from "zod";
import {watchlistSelectSchema} from "@watch3r/db/schema/watchlist";
import {authClient} from "@/lib/auth-client";
import {Crown, Users} from "lucide-react";
import {MemberStack} from "@/components/member-stack";
import {useQuery} from "@tanstack/react-query";
import {trpc} from "@/utils/trpc";
import {formatDateOnly} from "@/utils/dates";
import {DisplayCard} from "@/components/display-card";


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
			cornerLabel={`${total} titles`}
			progress={{ watched: 0, total}}
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
