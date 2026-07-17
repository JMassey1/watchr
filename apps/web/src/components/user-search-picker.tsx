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


export function UserSearchPicker({watchlistId, placeholder, disabled}: {
	watchlistId?: number            // forwarded to searchUsers to exclude existing members
	placeholder?: string
	disabled?: boolean
}) {
	function toggleInvite(user: z.infer<typeof userSelectSchema>) {
		setSelected((prev) =>
			prev.includes(user)
				? prev.filter((u) => u.id !== user.id)
				: [...prev, user]
		)
	}

	// Search
	const [query, setQuery] = useState<string>("");
	const [debouncedQuery] = useDebouncedValue(query, {
		wait: 500,
	})

	const [selected, setSelected] = useState<z.infer<typeof userSelectSchema>[]>([]);

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
				<div className="flex flex-wrap gap-2">
					{selected.map((user) => (
						<button
							key={user.id}
							type="button"
							onClick={() => toggleInvite(user)}
							aria-pressed={true}
							className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 py-1 pl-1 pr-3 text-sm text-foreground transition-colors"
						>
							<Avatar>
								{user.image && <AvatarImage src="placeholder.svg"/>}
								<AvatarFallback>W3</AvatarFallback>
								<AvatarBadge>
									<Check/>
								</AvatarBadge>
							</Avatar>
							{user.name}
							<X className="size-3.5 text-muted-foreground"/>
						</button>
					))}
				</div>
			)}

			{/* States */}
			{query.length > 0 && query.length < 2 && (
				<p className="text-sm text-muted-foreground">
					Type at least 2 characters to search.
				</p>
			)}

			{isSearchable && searchResults.isLoading && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Loader2 className="size-4 animate-spin"/>
					Searching…
				</div>
			)}

			{isSearchable &&
				!searchResults.isLoading &&
				searchResults.data?.length === 0 && (
					<p className="text-sm text-muted-foreground">No users found.</p>
				)}

			{/* User Display */}
			<div className="flex flex-wrap gap-2">
				{isSearchable && visibleResults?.map((user) => {
					const active = selected.some((u) => u.id === user.id)
					return (
						<button
							key={user.id}
							type="button"
							onClick={() => toggleInvite(user)}
							aria-pressed={active}
							className={`inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors ${
								active
									? "border-primary bg-primary/10 text-foreground"
									: "border-border bg-background text-muted-foreground hover:bg-secondary"
							}`}
						>
							{/*<Avatar person={user} ring={false} className="size-6 text-[10px]" />*/}
							<Avatar>
								{user.image && <AvatarImage src="placeholder.svg"/>}
								<AvatarFallback>W3</AvatarFallback>
								<AvatarBadge>
									{active ? <Check/> : <PlusIcon/>}
								</AvatarBadge>
							</Avatar>
							{user.name}
							{active && <Check className="size-3.5 text-primary"/>}
						</button>
					)
				})}
			</div>
		</div>
	);
}