import {useQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";

import {trpc} from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	const {session} = Route.useRouteContext();

	const privateData = useQuery(trpc.privateData.queryOptions());
	const watchlistCount = useQuery(trpc.watchlist.myWatchlistCount.queryOptions())

	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome {session.data?.user.name}</p>
			<p>API: {privateData.data?.message}</p>
			<p> You have {watchlistCount.data?.count} watchlist(s)</p>
		</div>
	);
}
