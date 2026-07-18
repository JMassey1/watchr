import {useMutation, useQuery} from "@tanstack/react-query";
import {createFileRoute, Link} from "@tanstack/react-router";
import {Button} from "@watch3r/ui/components/button";

import {queryClient, trpc} from "@/utils/trpc";
import {useMemo, useState} from "react";
import {CreateListDialog} from "@/components/create-list-dialog";
import {toast} from "sonner";
import {WatchlistCard} from "@/components/watchlist-card";
import {Clapperboard, Crown, Film, Plus, Search, Settings, Users} from "lucide-react";

export const Route = createFileRoute("/_auth/dashboard")({
	component: RouteComponent,
});

type Filter = 'all' | 'owned' | 'shared';
const FILTERS: { key: Filter; label: string }[] = [
	{key: 'all', label: 'All lists'},
	{key: 'owned', label: 'Owned by me'},
	{key: 'shared', label: 'Shared with me'}
]

function RouteComponent() {
	const {session} = Route.useRouteContext();
	const [dialogOpen, setDialogOpen] = useState<boolean>(false);
	const [filter, setFilter] = useState<Filter>('all');
	const [watchlistQuery, setWatchlistQuery] = useState<string>("");

	const myWatchlists = useQuery(trpc.watchlist.myWatchlists.queryOptions());
	const createWatchlist = useMutation(
		trpc.watchlist.create.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: trpc.watchlist.myWatchlists.queryKey(),
				})
				toast.success(`Watchlist Created!`)
				setDialogOpen(false);
			},
			onError: (err) => {
				toast.error("Error creating watchlist");
				console.error("Error creating watchlist", err)
			}
		})
	)

	const filteredWatchlists = useMemo(() => {
		const data = myWatchlists.data ?? [];
		const userId = session.data?.user.id;
		const q = watchlistQuery.trim().toLowerCase();

		return data.filter((wl) => {
			if (filter === 'owned' && wl.ownerId !== userId) return false;
			if (filter === 'shared' && wl.ownerId === userId) return false;
			return !(q && !wl.name.toLowerCase().includes(q));

		});
	}, [myWatchlists.data, session.data?.user.id, filter, watchlistQuery]);

	const stats = [
		{label: "Watchlists", value: myWatchlists.data?.length, icon: Film},
		{
			label: "Owned by you",
			value: myWatchlists.data?.filter((wl) => wl.ownerId === session.data?.user.id).length,
			icon: Crown
		},
		{
			label: "Shared with you",
			value: myWatchlists.data?.filter((wl) => wl.ownerId !== session.data?.user.id).length,
			icon: Users
		},
		{label: "Titles queued", value: 67, icon: Clapperboard},
	]

	return (
		<div className="mih-h-screen">
			<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1.5">
						<h1 className="font-serif text-3xl font-semibold tracking-light text-balance sm:text-4xl">
							Your watchlists
						</h1>
						<p className="text-muted-foreground text-pretty">
							Everything you&apos;re watching with friends, all in one place.
						</p>
					</div>
				</div>

				{/* Stats */}
				<section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
					{stats.map((stat) => (
						<div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">{stat.label}</span>
								<stat.icon className="size-4 text-muted-foreground" aria-hidden="true"/>
							</div>
							<p className="mt-2 font-serif text-3xl font-semibold">{stat.value}</p>
						</div>
					))}
				</section>

				{/* Watchlist Filters */}
				<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="inline-flex rounded-xl border border-border bg-card p-1">
						{FILTERS.map((f) => (
							<Button
								key={f.key}
								onClick={() => setFilter(f.key)}
								aria-pressed={filter === f.key}
								className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
									filter === f.key
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{f.label}
							</Button>
						))}
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						{/* Search Bar */}
						<div className="relative sm:w-64">
							<Search
								className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
							<input
								value={watchlistQuery}
								onChange={(e) => setWatchlistQuery(e.target.value)}
								placeholder="Search watchlists"
								aria-label="Search watchlists"
								className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40"
							/>
						</div>
						<Button onClick={() => setDialogOpen(true)} className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors bg-primary text-primary-foreground">
							<Plus className="size-4"/>
						</Button>
					</div>
				</div>

				{filteredWatchlists.length > 0 ? (
					<section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{filteredWatchlists.map((watchlist) => (
							<WatchlistCard key={`watchlist-card-${watchlist.id}`} watchlist={watchlist}/>
						))}
					</section>
				) : (
					<div
						className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
						<span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
							<Film className="size-6 text-muted-foreground"/>
						</span>
						<h2 className="mt-4 font-serif text-lg font-semibold">No watchlists found</h2>
						<p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
							{watchlistQuery
								? "Try a different search, or create a fresh list to get started."
								: "Create your first watchlist and invite friends to watch along."
							}
						</p>

						<Button onClick={() => setDialogOpen(true)} className="gap-1.5">
							<Plus className="size-4"/>
							New watchlist
						</Button>

					</div>
				)}
			</main>

			<CreateListDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onCreate={(dialogInputs) => {
					console.log("Created list with: ", dialogInputs);
					createWatchlist.mutate({
						name: dialogInputs.watchlist.name,
						memberIds: dialogInputs.members.map((u) => u.id)
					})
				}}
			/>
		</div>
	)
}
