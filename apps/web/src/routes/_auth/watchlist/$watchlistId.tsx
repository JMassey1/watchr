import {createFileRoute, redirect} from '@tanstack/react-router'
import {queryClient, trpc} from "@/utils/trpc";

export const Route = createFileRoute('/_auth/watchlist/$watchlistId')({
    loader: async ({ params }) => {
		const watchlists = await queryClient.fetchQuery({
			...trpc.watchlist.myWatchlists.queryOptions(),
			staleTime: 0,
		});

		const watchlist = watchlists.find((wl) => wl.id === parseInt(params.watchlistId));
		if (!watchlist) {
			throw redirect({
				to: "/dashboard",
				search: {
					error: "watchlist-access-denied",
				},
				replace: true,
			});
		}

		return { watchlist };
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { watchlist } = Route.useLoaderData();
	
    return <div>Hello "/_auth/watchlist/$watchlistId"!</div>
}
