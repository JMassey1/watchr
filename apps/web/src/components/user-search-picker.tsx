import {useState} from "react";
import {userSelectSchema} from "@watch3r/db/schema/auth";
import {useQuery} from "@tanstack/react-query";
import {trpc} from "@/utils/trpc";
import {z} from "zod";
import {useDebouncedValue} from "@tanstack/react-pacer";
import {Check, Loader2, PlusIcon, Search, SearchIcon, X} from "lucide-react";
import {Avatar, AvatarBadge, AvatarFallback, AvatarImage} from "@watch3r/ui/components/avatar";
import {Input} from "@watch3r/ui/components/input";
import {Button} from "@watch3r/ui/components/button";


export function UserSearchPicker({watchlistId, placeholder, disabled, selected, onSelectedChange}: {
	watchlistId?: number            // forwarded to searchUsers to exclude existing members
	placeholder?: string
	disabled?: boolean
	selected: z.infer<typeof userSelectSchema>[]
	onSelectedChange: (user: z.infer<typeof userSelectSchema>[]) => void
}) {
	function toggleInvite(user: z.infer<typeof userSelectSchema>) {
		const next = selected.some((u) => u.id === user.id)
			? selected.filter((u) => u.id !== user.id)
			: [...selected, user];
		onSelectedChange(next);
	}

	// Search
	const [query, setQuery] = useState<string>("");
	const [debouncedQuery] = useDebouncedValue(query, {
		wait: 500,
	});

	const isSearchable = debouncedQuery.trim().length >= 2
	const searchResults = useQuery(
		trpc.user.searchUsers.queryOptions(
			{query: debouncedQuery, watchlistId},
			{enabled: isSearchable}
		),
	)

	// stuff for dedup
	const selectedIds = new Set(selected.map((u) => u.id));
	const visibleResults = searchResults.data?.filter(
		(user) => !selectedIds.has(user.id)
	);


	return (
		<div className="flex flex-col gap-3">
			{/* Search Field */}
			<div className="relative">
				<Search
					className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
				<Input
					type="text"
					value={query}
					disabled={disabled}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={placeholder ?? "Search users..."}
					className="pl-9 pr-9"
					aria-label="Search users"
				/>
				{query.length > 0 && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => setQuery("")}
						className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
						aria-label="Clear search"
					>
						<X className="size-4"/>
					</Button>
				)}
			</div>

			{/* Selected users — always visible regardless of query */}
			{selected.length > 0 && (
				<>
					<section className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Selected
							</span>
							<span className="text-xs text-muted-foreground">
								{selected.length}
							</span>
						</div>

						<div className="flex flex-wrap gap-2">
							{selected.map((user) => (
								<button
									key={user.id}
									type="button"
									onClick={() => toggleInvite(user)}
									aria-pressed={true}
									className="group inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 py-1 pl-1 pr-3 text-sm text-foreground transition-colors hover:bg-primary/15"
								>
									<Avatar>
										{user.image && <AvatarImage src={user.image || "placeholder.svg"}/>}
										<AvatarFallback>W3</AvatarFallback>
										<AvatarBadge>
											<Check/>
										</AvatarBadge>
									</Avatar>
									{user.name}
									<X className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground"/>
								</button>
							))}
						</div>
					</section>
				</>
			)}

			{/* Divider between selected and results*/}
			{selected.length > 0 && isSearchable && (
				<div className="h-px w-full bg-border" />
			)}

			{/* Results section (with states) */}
			<section className="flex flex-col gap-2">
				{isSearchable && (
					<div className="flex items-center gap-2">
						<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Results
						</span>
						{searchResults.isLoading && (
							<Loader2 className="size-3.5 animate-spin text-muted-foreground"/>
						)}
					</div>
				)}

				{/* States */}
				{query.length > 0 && query.length < 2 && (
					<p className="text-sm text-muted-foreground">
						Type at least 2 characters to search.
					</p>
				)}
				{isSearchable &&
					!searchResults.isLoading &&
					searchResults.data?.length === 0 && (
						<p className="text-sm text-muted-foreground">No users found.</p>
					)}

				{/*	Result chips*/}
				<div className="flex flex-wrap gap-2">
					{isSearchable && visibleResults?.map((user) => {
						const active = selected.some((u) => u.id === user.id)
						return (
							<button
								key={user.id}
								type="button"
								onClick={() => toggleInvite(user)}
								aria-pressed={false}
								className="inline-flex items-center gap-2 rounded-full border border-dashed border-border bg-background py-1 pl-1 pr-3 text-sm text-muted-foreground transition-colors hover:border-solid hover:bg-secondary hover:text-foreground"
							>
								<Avatar>
									{user.image && <AvatarImage src="placeholder.svg"/>}
									<AvatarFallback>W3</AvatarFallback>
									<AvatarBadge>
										<PlusIcon />
									</AvatarBadge>
								</Avatar>
								{user.name}
							</button>
						)
					})}
				</div>
			</section>
		</div>
	);
}