import {useQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Button} from "@watch3r/ui/components/button";

import {trpc} from "@/utils/trpc";
import {useState} from "react";
import {CreateListDialog} from "@/components/create-list-dialog";
import {UserSearchPicker} from "@/components/user-search-picker";

export const Route = createFileRoute("/_auth/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	const {session} = Route.useRouteContext();
	const [dialogOpen, setDialogOpen] = useState<boolean>(false);

	const privateData = useQuery(trpc.privateData.queryOptions());
	const watchlistCount = useQuery(trpc.watchlist.myWatchlistCount.queryOptions())

	return (
		<div className="flex flex-col">
			<h1>Dashboard</h1>
			<p>Welcome {session.data?.user.name}</p>
			<p>API: {privateData.data?.message}</p>
			<p> You have {watchlistCount.data?.count} watchlist(s)</p>
			<br/>
			<Button
				className="max-w-md mb-10" // Keeps it small, adds 10 bottom margin
				variant="outline"
				onClick={() => {
					setDialogOpen((prev) => !prev);
				}}
			>
				Hello
			</Button>
			<CreateListDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onCreate={(list) => {}}
			/>
		{/*	TODO: Wire up TRPC call to above^^*/}
		</div>
	);
}
