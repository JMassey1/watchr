import {watchlistInsertSchema} from "@watch3r/db/schema/watchlist";
import {publicUserSchema} from "@watch3r/db/schema/auth";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@watch3r/ui/components/dialog";
import {z} from "zod";
import React, {useState} from "react";
import {UserSearchPicker} from "@/components/user-search-picker";
import {Button} from "@watch3r/ui/components/button";


export function CreateListDialog({open, onOpenChange, onCreate}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onCreate: ({watchlist, members}: {
		watchlist: z.infer<typeof watchlistInsertSchema>
		members: z.infer<typeof publicUserSchema>[]
	}) => void
}) {
	const [watchlistName, setWatchlistName] = useState("");
	const [description, setDescription] = useState("");
	const [members, setMembers] = useState<z.infer<typeof publicUserSchema>[]>([]);

	function reset() {
		setWatchlistName("");
		setDescription("");
		setMembers([]);
	}

	function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		if (!watchlistName.trim()) return;

		onCreate({
			watchlist: { name: watchlistName},
			members,
		})
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
				<DialogHeader className="flex items-start justify-between border-b border-border p-6">
					<DialogTitle className="font-serif text-xl font-semibold">Create a new watchlist</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						Give it a name and invite some people.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
					<div className="space-y-5 p-6">
						<div className="space-y-2">
							<label htmlFor="list-name" className="text-sm font-medium">
								List name
							</label>
							<input
								id="list-name"
								value={watchlistName}
								onChange={(e) => setWatchlistName(e.target.value)}
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
						<div className="space-y-2">
							<span className="text-sm font-medium">Invite members</span>
							<UserSearchPicker
								selected={members}
								onSelectedChange={setMembers}
							/>
						</div>

						<DialogFooter className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 p-4">
							<DialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
							<Button type="submit" disabled={!watchlistName.trim()} size="sm">Create List</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}