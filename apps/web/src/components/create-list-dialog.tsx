import {watchlistInsertSchema} from "@watch3r/db/schema/watchlist";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@watch3r/ui/components/dialog";
import {z} from "zod";
import React, {useState} from "react";
import {trpc} from "@/utils/trpc";
import {inferProcedureOutput} from "@trpc/server";
import type {AppRouter} from "@watch3r/api/routers/index";
import {useQuery} from "@tanstack/react-query";

type UserId = inferProcedureOutput<AppRouter['user']['searchUsers']>[number]['id'];

export function CreateListDialog({
	userId,
	open,
	onOpenChange,
	onCreate,
}: {
	userId: z.infer<typeof watchlistInsertSchema>["ownerId"]
	open: boolean
	onOpenChange: (open: boolean) => void
	onCreate: (list: z.infer<typeof watchlistInsertSchema>) => void
}) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	// Search
	const [debouncedQuery, setDebouncedQuery] = useState<string>(""); //FIXME: Debounce!!
	const [selected, setSelected] = useState<UserId[]>([]);
	const searchResults = useQuery(
		trpc.user.searchUsers.queryOptions({
			query: debouncedQuery,
		}, {
			enabled: debouncedQuery.length >= 2,
		}),
	)

	function reset() {
		setName("");
		setDescription("")
	}

	function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		if (!name.trim()) return;

		onCreate({
			ownerId: userId,
			name
		});
		onOpenChange(false);
		reset();
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) reset()
				onOpenChange(next);
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Create a new watchlist</DialogTitle>
					<DialogDescription>
						Give it a name and invite some people.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="space-y-2">
						<label htmlFor="list-name" className="text-sm font-medium">
							List name
						</label>
						<input
							id="list-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. My Epic Watchlist"
							autoFocus
							className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="list-desc" className="text-sm font-medium">
							Description{" "}
							<span className="text-muted-foreground">(optional)</span>
						</label>
						<textarea
							disabled
							id="list-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What's this list for?"
							rows={2}
							className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
							/>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}