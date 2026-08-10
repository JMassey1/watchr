import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { Button } from "@watch3r/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@watch3r/ui/components/avatar";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import {
	Select,
	SelectContent,
	SelectGroup, SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from "@watch3r/ui/components/select";

export const Route = createFileRoute("/_auth/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: session, refetch } = authClient.useSession();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadAvatar = useAvatarUpload();

	const user = session?.user;

	//DEBUG STUFF
	const themes = [
		{ label: "Default", value: "default" },
		{ label: "Bubblegum", value: "bubblegum" },
	]

	const handleFile = (file: File | undefined) => {
		if (!file) return;
		uploadAvatar.mutate(file, {
			onSuccess: async () => {
				toast.success("Avatar updated!");
				await refetch();
			},
			onError: (err) => {
				toast.error(err instanceof Error ? err.message : "Upload failed");
			},
		});
	};

	return (
		<div className="mih-h-screen">
			<main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
				<Link
					to="/dashboard"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="size-4" />
					Back to watchlists
				</Link>

				<div className="mt-6 space-y-1.5">
					<h1 className="font-serif text-3xl font-semibold tracking-light text-balance sm:text-4xl">
						Settings
					</h1>
					<p className="text-muted-foreground text-pretty">
						Manage your profile and how others see you.
					</p>
				</div>

				{/* Profile */}
				<section className="mt-8 rounded-2xl border border-border bg-card p-6">
					<h2 className="font-serif text-lg font-semibold">Profile picture</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						PNG, JPEG, or WebP. Up to 5MB.
					</p>

					<div className="mt-5 flex items-center gap-5">
						<Avatar size="lg" className="size-16">
							{user?.image && <AvatarImage src={user.image} alt={user.name ?? "Avatar"} />}
							<AvatarFallback>{(user?.name || "W3").substring(0,2).toUpperCase()}</AvatarFallback>
						</Avatar>

						<div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/png,image/jpeg,image/webp"
								className="hidden"
								onChange={(e) => handleFile(e.target.files?.[0])}
							/>
							<Button
								variant="outline"
								disabled={uploadAvatar.isPending}
								onClick={() => fileInputRef.current?.click()}
								className="gap-1.5"
							>
								{uploadAvatar.isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Upload className="size-4" />
								)}
								{uploadAvatar.isPending ? "Uploading..." : "Upload new"}
							</Button>
						</div>
					</div>
				</section>

				{/* Theme */}
				<section className="mt-8 rounded-2xl border border-border bg-card p-6">
					<h2 className="font-serif text-lg font-semibold">Theme</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Pick one of these beautiful themes for your watchlist.
					</p>

					<div className="mt-5 flex items-center gap-5">

						<Select items={themes} defaultValue={themes[0]}>
							<SelectTrigger className="w-full max-w-48">
								<SelectValue/>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Themes</SelectLabel>
									{themes.map((theme) => (
										<SelectItem key={theme.value} value={theme.value}>
											{theme.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

				</section>
			</main>
		</div>
	);
}
