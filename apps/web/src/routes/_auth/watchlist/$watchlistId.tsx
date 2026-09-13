import {createFileRoute, Link, redirect} from '@tanstack/react-router'
import {useMemo, useRef, useState} from "react";
import {useMutation, useQuery, useSuspenseQuery} from "@tanstack/react-query";
import {Button, buttonVariants} from "@watch3r/ui/components/button";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@watch3r/ui/components/alert-dialog";
import {ArrowLeft, Check, Clapperboard, Crown, Film, LayoutGrid, List, Plus, Search, Settings, Users, ShieldPlus} from "lucide-react";
import {queryClient, trpc} from "@/utils/trpc";
import {MemberStack} from "@/components/member-stack";
import {AddTitleDialog} from "@/components/add-title-dialog";
import {formatDateOnly} from "@/utils/dates";
import {DisplayCard} from "@/components/display-card";
import {DisplayRow} from "@/components/display-row";
import DvdCase from "@/components/dvd-case";
import {toast} from "sonner";
import {ButtonGroup} from "@watch3r/ui/components/button-group";

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

type ItemFilter = "all" | "watched" | "unwatched";
const ITEM_FILTERS: { key: ItemFilter; label: string }[] = [
	{key: "all", label: "All titles"},
	{key: "unwatched", label: "To watch"},
	{key: "watched", label: "Watched"},
];

function RouteComponent() {
	const {watchlist} = Route.useLoaderData();
	const {session} = Route.useRouteContext();
	const user = session.data?.user;
	const { data: userSettings } = useSuspenseQuery(
		trpc.user.settings.queryOptions()
	)

	const [filter, setFilter] = useState<ItemFilter>("all");
	const [itemQuery, setItemQuery] = useState<string>("");
	const [view, setView] = useState<"cards" | "list" | "dvd">("cards");
	const [addTitleOpen, setAddTitleOpen] = useState<boolean>(false);
	const [titleToRemove, setTitleToRemove] = useState<{id: number; name: string} | null>(null);

	const watchlistMembers = useQuery(
		trpc.watchlist.getWatchlistMembers.queryOptions({watchlistId: watchlist.id})
	);
	const itemsQuery = useQuery(
		trpc.watchlist.getItems.queryOptions({watchlistId: watchlist.id})
	);
	const isOwner = user?.id === watchlist.ownerId;
	const isAdmin = watchlistMembers.data?.some((m) => m.id === user?.id && m.role === "admin");

	// Also guard submissions before React renders the mutations' pending state.
	const actionInFlight = useRef(false);
	const setWatched = useMutation(
		trpc.watchlist.setWatched.mutationOptions({
			networkMode: "always",
			retry: false,
			onSuccess: async (updated, variables) => {
				queryClient.setQueryData(
					trpc.watchlist.getItems.queryKey({watchlistId: variables.watchlistId}),
					(previous) => previous?.map((item) =>
						item.id === variables.titleId ? {...item, watched: updated.watched} : item,
					),
				);
				await queryClient.invalidateQueries({
					queryKey: trpc.watchlist.getItems.queryKey({watchlistId: variables.watchlistId}),
				});
				toast.success(variables.watched ? "Title marked as watched" : "Title marked as unwatched");
			},
			onError: (err) => {
				toast.error("Couldn't update watched status");
				console.error("Error updating watched status", err);
			},
			onSettled: () => { actionInFlight.current = false; },
		}),
	);
	const removeItem = useMutation(
		trpc.watchlist.removeItem.mutationOptions({
			networkMode: "always",
			retry: false,
			onSuccess: async (_item, variables) => {
				queryClient.setQueryData(
					trpc.watchlist.getItems.queryKey({watchlistId: variables.watchlistId}),
					(previous) => previous?.filter((item) => item.id !== variables.titleId),
				);
				await queryClient.invalidateQueries({
					queryKey: trpc.watchlist.getItems.queryKey({watchlistId: variables.watchlistId}),
				});
				toast.success("Title removed from watchlist");
				setTitleToRemove(null);
			},
			onError: (err) => {
				toast.error("Couldn't remove title from watchlist");
				console.error("Error removing title from watchlist", err);
			},
			onSettled: () => { actionInFlight.current = false; },
		}),
	);
	const actionsPending = setWatched.isPending || removeItem.isPending;

	const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
	const watchedCount = items.filter((item) => item.watched).length;
	const pctWatched = items.length > 0 ? Math.round((watchedCount / items.length) * 100) : 0;

	const filteredItems = useMemo(() => {
		const q = itemQuery.trim().toLowerCase();

		return items.filter((item) => {
			if (filter === "watched" && !item.watched) return false;
			if (filter === "unwatched" && item.watched) return false;
			return !(q && !item.name.toLowerCase().includes(q));

		});
	}, [items, filter, itemQuery]);

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
						<Button onClick={() => setAddTitleOpen(true)} className="gap-1.5">
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
				<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
					<ButtonGroup className="inline-flex rounded-xl border border-border bg-card p-1">
						{ITEM_FILTERS.map((f) => (
							<Button
								key={f.key}
								variant={filter === f.key ? "default" : "secondary"}
								onClick={() => setFilter(f.key)}
								aria-pressed={filter === f.key}
								className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
							>
								{f.label}
							</Button>
						))}
					</ButtonGroup>

					<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
						<ButtonGroup aria-label="Title view" className="inline-flex self-start rounded-xl border border-border bg-card p-1">
							{userSettings.themePreset === "keroppi" && (
								<Button
									type="button"
									size="icon"
									variant={view === "dvd" ? "default" : "secondary"}
									onClick={() => setView("dvd")}
									aria-pressed={view === "dvd"}
									className="rounded-lg p-0 text-sm font-medium transition-colors"
								>
									<img src="/keroppi_icon.png" className="size-7 shrink-0" aria-hidden="true" alt="Keroppi"/>
								</Button>
							)}
							<Button
								type="button"
								size="icon"
								variant={view === "cards" ? "default" : "secondary"}
								onClick={() => setView("cards")}
								aria-pressed={view === "cards"}
								className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
							>
								<LayoutGrid className="size-4" aria-hidden="true"/>
							</Button>
							<Button
								type="button"
								size="icon"
								variant={view === "list" ? "default" : "secondary"}
								onClick={() => setView("list")}
								aria-pressed={view === "list"}
								className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
							>
								<List className="size-4" aria-hidden="true"/>
							</Button>
						</ButtonGroup>
					</div>
				</div>

				{/* Items */}
				{filteredItems.length > 0 ? (
					<section className={view === "list" ? "mt-6 flex flex-col gap-3" : "mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
						{filteredItems.map((item) => {
							const watchlistActions = {
								watched: item.watched,
								disabled: actionsPending,
								onToggleWatched: () => {
									if (actionsPending || actionInFlight.current) return;
									actionInFlight.current = true;
									setWatched.mutate({watchlistId: watchlist.id, titleId: item.id, watched: !item.watched});
								},
								onRemove: isOwner ? () => {
									if (actionsPending || actionInFlight.current) return;
									setTitleToRemove({id: item.id, name: item.name});
								} : undefined,
							};

							if (view === "list") {
								return <DisplayRow
									key={`wl-item-row-${item.id}`}
									posterUrl={item.posterUrl}
									title={item.name}
									mediaType={item.mediaType}
									year={item.year}
									runtime={item.runtime}
									watchlistActions={watchlistActions}
								/>;
							} else if (view === "dvd") {
								return <DvdCase
									key={`wl-item-case-${item.id}`}
									posterUrl={item.posterUrl}
									posterAlt={`${item.name} Cover`}
									title={item.name}
									subtitle={item.runtime ?? "PLACEHOLDER SUBTITLE"}
									description="PLACEHOLDER DESCRIPTION"
									metadata={[item.mediaType === "movie" ? "Movie" : "TV", item.year?.toString() ?? "PLACEHOLDER YEAR"]}
									watchlistActions={watchlistActions}
								/>
							} else {
								return <DisplayCard
									key={`wl-item-card-${item.id}`}
									coverImage={item.posterUrl}
									badge={item.mediaType === "movie" ? "Movie" : "TV"}
									cornerLabel={item.watched ? "Watched" : null}
									footer={(
										<div className="space-y-1.5">
											<h3 className="font-serif text-lg font-semibold leading-tight text-balance">{item.name}</h3>
											<p className="text-sm text-muted-foreground">
												{item.year} &middot; {item.runtime}
											</p>
										</div>
									)}
								/>
							}
						})}
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
						<Button onClick={() => setAddTitleOpen(true)} className="mt-4 gap-1.5">
							<Plus className="size-4"/>
							Add title
						</Button>
					</div>
				)}
			</main>

			<AddTitleDialog
				watchlistId={watchlist.id}
				open={addTitleOpen}
				onOpenChange={setAddTitleOpen}
			/>
			<AlertDialog
				open={titleToRemove !== null}
				onOpenChange={(open) => {
					if (!open && !actionsPending && !actionInFlight.current) setTitleToRemove(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Remove "{titleToRemove?.name}" from "{watchlist.name}"?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This only removes it from this watchlist, not from other watchlists or the title catalog.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={actionsPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							type="button"
							variant="destructive"
							disabled={actionsPending || !titleToRemove}
							onClick={() => {
								if (!titleToRemove || actionsPending || actionInFlight.current) return;
								actionInFlight.current = true;
								removeItem.mutate({watchlistId: watchlist.id, titleId: titleToRemove.id});
							}}
						>
							{actionsPending ? "Removing..." : "Remove"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
