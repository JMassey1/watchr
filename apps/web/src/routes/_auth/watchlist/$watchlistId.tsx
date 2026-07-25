import {createFileRoute, Link, redirect} from '@tanstack/react-router'
import {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Button, buttonVariants} from "@watch3r/ui/components/button";
import {ArrowLeft, Check, Clapperboard, Crown, Film, Plus, Search, Settings, Users, ShieldPlus} from "lucide-react";
import {queryClient, trpc} from "@/utils/trpc";
import {MemberStack} from "@/components/member-stack";
import {formatDateOnly} from "@/utils/dates";
import {Field, FieldContent, FieldLabel} from "@watch3r/ui/components/field";
import {Switch} from "@watch3r/ui/components/switch";

export const Route = createFileRoute('/_auth/watchlist/$watchlistId')({
	loader: async ({params}) => {
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

		return {watchlist};
	},
	component: RouteComponent,
})

/*
 * TODO: Watchlist items don't exist in the schema/API yet.
 *  Replace this local type + TEST_ITEMS with a real tRPC query
 *  (e.g. trpc.watchlist.getItems) once the backend is in place.
 */
type WatchlistItem = {
	id: number;
	title: string;
	year: number;
	kind: "movie" | "series";
	runtime: string;
	watched: boolean;
};

const TEST_ITEMS: WatchlistItem[] = [
	{id: 1, title: "Dune: Part Two", year: 2024, kind: "movie", runtime: "2h 46m", watched: true},
	{id: 2, title: "The Bear", year: 2022, kind: "series", runtime: "4 seasons", watched: false},
	{id: 3, title: "Everything Everywhere All at Once", year: 2022, kind: "movie", runtime: "2h 19m", watched: true},
	{id: 4, title: "Severance", year: 2022, kind: "series", runtime: "2 seasons", watched: false},
	{id: 5, title: "Oppenheimer", year: 2023, kind: "movie", runtime: "3h 0m", watched: false},
	{id: 6, title: "Poor Things", year: 2023, kind: "movie", runtime: "2h 21m", watched: true},
];

type ItemFilter = "all" | "watched" | "unwatched";
const ITEM_FILTERS: { key: ItemFilter; label: string }[] = [
	{key: "all", label: "All titles"},
	{key: "unwatched", label: "To watch"},
	{key: "watched", label: "Watched"},
];

function RouteComponent() {
	const {watchlist} = Route.useLoaderData();
	const {session} = Route.useRouteContext();
	const [filter, setFilter] = useState<ItemFilter>("all");
	const [showTestData, setShowTestData] = useState<boolean>(false);
	const [itemQuery, setItemQuery] = useState<string>("");

	const watchlistMembers = useQuery(
		trpc.watchlist.getWatchlistMembers.queryOptions({watchlistId: watchlist.id})
	);
	const isOwner = session.data?.user.id === watchlist.ownerId;
	const isAdmin = session.data?.user.id === watchlistMembers.data?.some((m) => m.id === session.data?.user.id && m.role === "admin");


	// TODO: replace TEST_ITEMS with a real query once items are modelled.
	const items = showTestData ? TEST_ITEMS : [];
	const watchedCount = items.filter((item) => item.watched).length;
	const pctWatched = items.length > 0 ? Math.round((watchedCount / items.length) * 100) : 0;

	const filteredItems = useMemo(() => {
		const q = itemQuery.trim().toLowerCase();

		return items.filter((item) => {
			if (filter === "watched" && !item.watched) return false;
			if (filter === "unwatched" && item.watched) return false;
			return !(q && !item.title.toLowerCase().includes(q));

		});
	}, [filter, itemQuery]);

	const stats = [
		{label: "Titles", value: items.length, icon: Clapperboard},
		{label: "Watched", value: watchedCount, icon: Check},
		{label: "Members", value: watchlistMembers.data?.length ?? 0, icon: Users},
	];

	return (
		<div className="mih-h-screen">
			<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
				{/* Back link */}
				<Link
					to="/dashboard"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="size-4"/>
					Back to watchlists
				</Link>

				{/* Header */}
				<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-2">
						<span
							className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
							{isOwner ? (
								<>
									<Crown className="size-3.5 text-primary" aria-hidden="true"/>
									Owner
								</>
							) : isAdmin ? (
								<>
									<ShieldPlus className="size-3.5 text-primary" aria-hidden="true"/>
									Admin
								</>
							) : (
								<>
									<Users className="size-3.5 text-muted-foreground" aria-hidden="true"/>
									Member
								</>
							)}
						</span>
						<h1 className="font-serif text-3xl font-semibold tracking-light text-balance sm:text-4xl">
							{watchlist.name}
						</h1>
						<p className="text-muted-foreground text-pretty">
							Updated {formatDateOnly(watchlist.updatedAt)}
						</p>
					</div>

					<div className="flex items-center gap-3">
						<MemberStack users={watchlistMembers.data ?? []} size="md"/>
						{isOwner && (
							<Link
								to="/watchlist/$watchlistId/settings"
								params={{watchlistId: watchlist.id.toString()}}
								className={buttonVariants({variant: "outline", className: "gap-1.5"})}
							>
								<Settings className="size-4"/>
								Settings
							</Link>
						)}
						<Button className="gap-1.5">
							<Plus className="size-4"/>
							Add title
						</Button>
					</div>
				</div>

				{/* Stats */}
				<section className="mt-8 grid grid-cols-3 gap-3">
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

				{/* Progress */}
				<div className="mt-6 space-y-1.5">
					<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
						<span className="inline-flex items-center gap-1">
							<Check className="size-3.5 text-primary" aria-hidden="true"/>
							{watchedCount} of {items.length} watched
						</span>
						<span>{pctWatched}%</span>
					</div>
					<div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{width: `${pctWatched}%`}}
						/>
					</div>
				</div>

				{/* Item Filters */}
				<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="inline-flex rounded-xl border border-border bg-card p-1">
						{ITEM_FILTERS.map((f) => (
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
						{/*//TODO: Remove this once we have real items in the schema/API*/}
						<Field orientation="horizontal" className="max-w-sm">
							<Switch id="switch-testdata-sm" size="sm" checked={showTestData} onCheckedChange={setShowTestData} />
							<FieldLabel htmlFor="switch-testdata-sm">Test Data</FieldLabel>
						</Field>

						<div className="relative sm:w-64">
							<Search
								className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
							<input
								value={itemQuery}
								onChange={(e) => setItemQuery(e.target.value)}
								placeholder="Search titles"
								aria-label="Search titles"
								className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40"
							/>
						</div>
					</div>
				</div>

				{/* Items */}
				{filteredItems.length > 0 ? (
					<section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{filteredItems.map((item) => (
							<article
								key={item.id}
								className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg hover:shadow-black/5"
							>
								<div className="relative aspect-16/10 overflow-hidden">
									<img
										src="/placeholder.svg"
										alt={`Poster for ${item.title}`}
										className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									<div
										className="absolute inset-0 bg-linear-to-t from-black/55 via-black/0 to-black/0"/>
									<span
										className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold capitalize text-card-foreground backdrop-blur-sm">
										{item.kind}
									</span>
									{item.watched && (
										<span
											className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
											<Check className="size-3.5" aria-hidden="true"/>
											Watched
										</span>
									)}
								</div>

								<div className="flex flex-1 flex-col gap-4 p-5">
									<div className="space-y-1.5">
										<h3 className="font-serif text-lg font-semibold leading-tight text-balance">
											{item.title}
										</h3>
										<p className="text-sm text-muted-foreground">
											{item.year} &middot; {item.runtime}
										</p>
									</div>
								</div>
							</article>
						))}
					</section>
				) : (
					<div
						className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
						<span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
							<Film className="size-6 text-muted-foreground"/>
						</span>
						<h2 className="mt-4 font-serif text-lg font-semibold">No titles found</h2>
						<p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
							{itemQuery || filter !== "all"
								? "Try a different search or filter, or add a new title to this list."
								: "This watchlist is empty. Add your first title to get watching."}
						</p>
						<Button className="mt-4 gap-1.5">
							<Plus className="size-4"/>
							Add title
						</Button>
					</div>
				)}
			</main>
		</div>
	)
}
