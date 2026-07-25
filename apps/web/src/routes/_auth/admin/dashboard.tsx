import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {createFileRoute, Link} from "@tanstack/react-router";
import {Button} from "@watch3r/ui/components/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@watch3r/ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent, DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@watch3r/ui/components/dropdown-menu";
import {
	ArrowLeft,
	Ban,
	Crown,
	KeyRound,
	MoreHorizontal,
	Pencil,
	Search,
	ShieldCheck,
	Trash2,
	UserCheck,
	Users,
} from "lucide-react";
import React, {useMemo, useState} from "react";
import {toast} from "sonner";

import {authClient} from "@/lib/auth-client";
import {UserAvatar} from "@/components/user-avatar";

export const Route = createFileRoute("/_auth/admin/dashboard")({
	component: RouteComponent,
});

type AdminUser = {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	role?: string | null;
	banned?: boolean | null;
	banReason?: string | null;
	createdAt: string | Date;
};

const inputClass =
	"h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

const USERS_QUERY_KEY = ["admin", "users"] as const;

function RouteComponent() {
	const {session} = Route.useRouteContext();
	const currentUserId = session.data?.user.id;
	const queryClient = useQueryClient();

	const [query, setQuery] = useState("");
	const [editUser, setEditUser] = useState<AdminUser | null>(null);
	const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
	const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

	const usersQuery = useQuery({
		queryKey: USERS_QUERY_KEY,
		queryFn: async () => {
			const {data, error} = await authClient.admin.listUsers({
				query: {limit: 200, sortBy: "createdAt", sortDirection: "desc"},
			});
			if (error) throw new Error(error.message ?? "Failed to load users");
			return (data?.users ?? []) as AdminUser[];
		},
	});

	const invalidate = () => queryClient.invalidateQueries({queryKey: USERS_QUERY_KEY});

	const setRole = useMutation({
		mutationFn: async ({userId, role}: { userId: string; role: "admin" | "user" }) => {
			const {error} = await authClient.admin.setRole({userId, role});
			if (error) throw new Error(error.message ?? "Failed to update role");
		},
		onSuccess: async () => {
			await invalidate();
			toast.success("Role updated");
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const setBanned = useMutation({
		mutationFn: async ({userId, banned}: { userId: string; banned: boolean }) => {
			const {error} = banned
				? await authClient.admin.banUser({userId, banReason: "Banned by admin"})
				: await authClient.admin.unbanUser({userId});
			if (error) throw new Error(error.message ?? "Failed to update ban status");
		},
		onSuccess: async (_data, variables) => {
			await invalidate();
			toast.success(variables.banned ? "User banned" : "User unbanned");
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const removeUser = useMutation({
		mutationFn: async (userId: string) => {
			const {error} = await authClient.admin.removeUser({userId});
			if (error) throw new Error(error.message ?? "Failed to delete user");
		},
		onSuccess: async () => {
			await invalidate();
			setDeleteUser(null);
			toast.success("User deleted");
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const users = usersQuery.data ?? [];
	const filteredUsers = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return users;
		return users.filter(
			(u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
		);
	}, [users, query]);

	const stats = [
		{label: "Total users", value: users.length, icon: Users},
		{label: "Admins", value: users.filter((u) => u.role === "admin").length, icon: Crown},
		{label: "Banned", value: users.filter((u) => u.banned).length, icon: Ban},
	];

	return (
		<div className="min-h-screen">
			<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
				<Link
					to="/dashboard"
					className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="size-4"/>
					Back to dashboard
				</Link>

				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1.5">
						<h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
							Admin settings
						</h1>
						<p className="text-muted-foreground text-pretty">
							Manage user accounts, roles, and passwords.
						</p>
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

				{/* Search */}
				<div className="mt-8 flex items-center justify-between gap-4">
					<div className="relative sm:w-72">
						<Search
							className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search users"
							aria-label="Search users"
							className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40"
						/>
					</div>
				</div>

				{/* Users table */}
				<section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead>
							<tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
								<th className="px-5 py-3 font-medium">User</th>
								<th className="px-5 py-3 font-medium">Role</th>
								<th className="px-5 py-3 font-medium">Status</th>
								<th className="px-5 py-3 font-medium">Joined</th>
								<th className="px-5 py-3 font-medium text-right">Actions</th>
							</tr>
							</thead>
							<tbody>
							{usersQuery.isLoading ? (
								<tr>
									<td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
										Loading users…
									</td>
								</tr>
							) : usersQuery.isError ? (
								<tr>
									<td colSpan={5} className="px-5 py-10 text-center text-destructive">
										Failed to load users.
									</td>
								</tr>
							) : filteredUsers.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
										No users found.
									</td>
								</tr>
							) : (
								filteredUsers.map((user) => {
									const isSelf = user.id === currentUserId;
									const isAdmin = user.role === "admin";
									return (
										<tr key={user.id} className="border-b border-border last:border-0">
											<td className="px-5 py-3">
												<div className="flex items-center gap-3">
													<UserAvatar className="size-9" user={{
														name: user.name,
														image: user.image ?? null,
														id: user.id
													}}/>
													<div className="min-w-0">
														<p className="truncate font-medium">
															{user.name}
															{isSelf && (
																<span
																	className="ml-2 text-xs text-muted-foreground">(you)</span>
															)}
														</p>
														<p className="truncate text-xs text-muted-foreground">{user.email}</p>
													</div>
												</div>
											</td>
											<td className="px-5 py-3">
												<span
													className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
														isAdmin
															? "bg-primary/10 text-primary"
															: "bg-secondary text-muted-foreground"
													}`}
												>
													{isAdmin && <Crown className="size-3"/>}
													{isAdmin ? "Admin" : "User"}
												</span>
											</td>
											<td className="px-5 py-3">
												<span
													className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
														user.banned
															? "bg-destructive/10 text-destructive"
															: "bg-secondary text-muted-foreground"
													}`}
												>
													{user.banned ? "Banned" : "Active"}
												</span>
											</td>
											<td className="px-5 py-3 text-muted-foreground">
												{new Date(user.createdAt).toLocaleDateString()}
											</td>
											<td className="px-5 py-3 text-right">
												<DropdownMenu>
													<DropdownMenuTrigger
														render={
															<Button variant="ghost" size="icon"
															        aria-label="User actions">
																<MoreHorizontal className="size-4"/>
															</Button>
														}
													/>
													<DropdownMenuContent align="end" className="w-52">
														<DropdownMenuGroup>

															<DropdownMenuLabel>Manage user</DropdownMenuLabel>
															<DropdownMenuItem onClick={() => setEditUser(user)}>
																<Pencil className="size-4"/>
																Edit info
															</DropdownMenuItem>
															<DropdownMenuItem onClick={() => setPasswordUser(user)}>
																<KeyRound className="size-4"/>
																Reset password
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() =>
																	setRole.mutate({
																		userId: user.id,
																		role: isAdmin ? "user" : "admin",
																	})
																}
															>
																{isAdmin ? (
																	<UserCheck className="size-4"/>
																) : (
																	<ShieldCheck className="size-4"/>
																)}
																{isAdmin ? "Demote to user" : "Promote to admin"}
															</DropdownMenuItem>
															<DropdownMenuSeparator/>
															<DropdownMenuItem
																disabled={isSelf}
																onClick={() =>
																	setBanned.mutate({
																		userId: user.id,
																		banned: !user.banned
																	})
																}
															>
																{user.banned ? (
																	<UserCheck className="size-4"/>
																) : (
																	<Ban className="size-4"/>
																)}
																{user.banned ? "Unban user" : "Ban user"}
															</DropdownMenuItem>
															<DropdownMenuItem
																variant="destructive"
																disabled={isSelf}
																onClick={() => setDeleteUser(user)}
															>
																<Trash2 className="size-4"/>
																Delete user
															</DropdownMenuItem>
														</DropdownMenuGroup>
													</DropdownMenuContent>
												</DropdownMenu>
											</td>
										</tr>
									);
								})
							)}
							</tbody>
						</table>
					</div>
				</section>
			</main>

			<EditUserDialog user={editUser} onOpenChange={(o) => !o && setEditUser(null)} onSaved={invalidate}/>
			<ResetPasswordDialog user={passwordUser} onOpenChange={(o) => !o && setPasswordUser(null)}/>
			<DeleteUserDialog
				user={deleteUser}
				onOpenChange={(o) => !o && setDeleteUser(null)}
				onConfirm={(id) => removeUser.mutate(id)}
				pending={removeUser.isPending}
			/>
		</div>
	);
}

function EditUserDialog({
							user,
							onOpenChange,
							onSaved,
						}: {
	user: AdminUser | null;
	onOpenChange: (open: boolean) => void;
	onSaved: () => Promise<unknown>;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");

	React.useEffect(() => {
		if (user) {
			setName(user.name);
			setEmail(user.email);
		}
	}, [user]);

	const save = useMutation({
		mutationFn: async () => {
			if (!user) return;
			const {error} = await authClient.admin.updateUser({
				userId: user.id,
				data: {name, email},
			});
			if (error) throw new Error(error.message ?? "Failed to update user");
		},
		onSuccess: async () => {
			await onSaved();
			toast.success("User updated");
			onOpenChange(false);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || !email.trim()) return;
		save.mutate();
	}

	return (
		<Dialog open={!!user} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader className="flex items-start justify-between border-b border-border p-6">
					<DialogTitle className="font-serif text-xl font-semibold">Edit user</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						Update this user&apos;s account details.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col">
					<div className="space-y-5 p-6">
						<div className="space-y-2">
							<label htmlFor="edit-name" className="text-sm font-medium">Name</label>
							<input
								id="edit-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								autoFocus
								className={inputClass}
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="edit-email" className="text-sm font-medium">Email</label>
							<input
								id="edit-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className={inputClass}
							/>
						</div>
					</div>
					<DialogFooter
						className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 p-4">
						<DialogClose render={<Button variant="outline" size="sm">Cancel</Button>}/>
						<Button
							type="submit"
							size="sm"
							disabled={!name.trim() || !email.trim() || save.isPending}
						>
							{save.isPending ? "Saving…" : "Save changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function ResetPasswordDialog({
								 user,
								 onOpenChange,
							 }: {
	user: AdminUser | null;
	onOpenChange: (open: boolean) => void;
}) {
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");

	React.useEffect(() => {
		if (user) {
			setPassword("");
			setConfirm("");
		}
	}, [user]);

	const reset = useMutation({
		mutationFn: async () => {
			if (!user) return;
			const {error} = await authClient.admin.setUserPassword({
				userId: user.id,
				newPassword: password,
			});
			if (error) throw new Error(error.message ?? "Failed to reset password");
		},
		onSuccess: () => {
			toast.success("Password reset");
			onOpenChange(false);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const mismatch = confirm.length > 0 && password !== confirm;
	const tooShort = password.length > 0 && password.length < 8;
	const canSubmit = password.length >= 8 && password === confirm && !reset.isPending;

	function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		reset.mutate();
	}

	return (
		<Dialog open={!!user} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader className="flex items-start justify-between border-b border-border p-6">
					<DialogTitle className="font-serif text-xl font-semibold">Reset password</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						{user ? `Set a new password for ${user.name}.` : ""}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col">
					<div className="space-y-5 p-6">
						<div className="space-y-2">
							<label htmlFor="new-password" className="text-sm font-medium">New password</label>
							<input
								id="new-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoFocus
								placeholder="At least 8 characters"
								className={inputClass}
							/>
							{tooShort && (
								<p className="text-xs text-destructive">Password must be at least 8 characters.</p>
							)}
						</div>
						<div className="space-y-2">
							<label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</label>
							<input
								id="confirm-password"
								type="password"
								value={confirm}
								onChange={(e) => setConfirm(e.target.value)}
								className={inputClass}
							/>
							{mismatch && (
								<p className="text-xs text-destructive">Passwords do not match.</p>
							)}
						</div>
					</div>
					<DialogFooter
						className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 p-4">
						<DialogClose render={<Button variant="outline" size="sm">Cancel</Button>}/>
						<Button type="submit" size="sm" disabled={!canSubmit}>
							{reset.isPending ? "Resetting…" : "Reset password"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function DeleteUserDialog({
							  user,
							  onOpenChange,
							  onConfirm,
							  pending,
						  }: {
	user: AdminUser | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (userId: string) => void;
	pending: boolean;
}) {
	return (
		<Dialog open={!!user} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="flex items-start justify-between border-b border-border p-6">
					<DialogTitle className="font-serif text-xl font-semibold">Delete user</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						{user
							? `This permanently removes ${user.name} (${user.email}). This cannot be undone.`
							: ""}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter
					className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 p-4">
					<DialogClose render={<Button variant="outline" size="sm">Cancel</Button>}/>
					<Button
						variant="destructive"
						size="sm"
						disabled={pending}
						onClick={() => user && onConfirm(user.id)}
					>
						{pending ? "Deleting…" : "Delete user"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
