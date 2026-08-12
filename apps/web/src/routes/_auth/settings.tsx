import {createFileRoute, Link, useRouter} from "@tanstack/react-router";
import { useRef } from "react";
import { Button } from "@watch3r/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@watch3r/ui/components/avatar";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";

import DvdCase from "@/components/dvd-case";
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
import {useMutation, useSuspenseQuery} from "@tanstack/react-query";
import {queryClient, trpc} from "@/utils/trpc";
import {themePresets} from "@watch3r/db/schema/user";

export const Route = createFileRoute("/_auth/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	const router = useRouter();
	const { data: session, refetch } = authClient.useSession();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadAvatar = useAvatarUpload();

	const user = session?.user;
	const { data: userSettings } = useSuspenseQuery(
		trpc.user.settings.queryOptions()
	);

	const updateUserSettings = useMutation(
		trpc.user.updateSettings.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: trpc.user.settings.queryKey(),
				});
				toast.success("Settings updated!");
			},
			onError: (err) => {
				toast.error("Error updating settings");
				console.error("Error updating settings", err);
			}
		})
	)

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
			<main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
				<div className="max-w-2xl">
					<Button
						type="button"
						onClick={() => router.history.back()}
						className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="size-4" />
						Back to watchlists
					</Button>

					<div className="mt-6 space-y-1.5">
						<h1 className="font-serif text-3xl font-semibold tracking-light text-balance sm:text-4xl">
							Settings
						</h1>
						<p className="text-muted-foreground text-pretty">
							Manage your profile and how others see you.
						</p>
					</div>
				</div>

				{/* Profile */}
				<section className="mt-8 max-w-2xl rounded-2xl border border-border bg-card p-6">
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
				<section className="mt-8 w-fit rounded-2xl border border-border bg-card p-6 xl:grid xl:grid-cols-[minmax(0,420px)_180px] xl:gap-12 xl:items-start xl:pr-15">
					<div>
						<h2 className="font-serif text-lg font-semibold">Theme</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Pick one of these beautiful themes for your watchlist.
						</p>

						<div className="mt-5 flex items-center gap-5">
							<Select
								items={themePresets}
								value={userSettings.themePreset}
								disabled={updateUserSettings.isPending}
								onValueChange={(themePreset) => {
									if (themePreset) {
										updateUserSettings.mutate({ themePreset });
									}
								}}
							>
								<SelectTrigger className="w-full max-w-48">
									<SelectValue/>
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Themes</SelectLabel>
										{themePresets.map((theme) => (
											<SelectItem key={theme.value} value={theme.value}>
												{theme.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</div>
					<ThemePreview />
				</section>
			</main>
		</div>
	);
}

//TODO: Change preview cover based on theme selected (keroppi shows keroppi, bubblegum shows a piece of gum, default shows something normal, etc.)
function ThemePreview() {
	const prefersReducedMotion = useReducedMotion();

	return (
		<div className="hidden xl:block">
			<motion.div
				animate={prefersReducedMotion ? undefined : { rotate: [-3, 3, -3] }}
				transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
				style={{ perspective: 1600 }}
				aria-hidden={true}
				inert
			>
				<DvdCase
					posterUrl="/frieren_cover_tmdb.png"
					posterAlt=""
					title="Frieren: Beyond Journey's End"
					subtitle="Volume One"
					description="An elf mage retraces the road her fallen companions once walked."
					metadata={["2023", "28 episodes"]}
				/>
			</motion.div>
		</div>
	);
}
