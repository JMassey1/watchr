import {createFileRoute, Link} from "@tanstack/react-router";
import {Button, buttonVariants} from "@watch3r/ui/components/button";

import DvdCase from "@/components/dvd-case";
import {authClient} from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const {data: session, isPending} = authClient.useSession();

	return (
		<main className="bg-background text-foreground">
			<section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(38rem,7fr)] lg:gap-8">
				<div className="max-w-xl">
					<Button
						onClick={() => console.log("session, pending", {session, isPending})}
						variant="outline"
						className={buttonVariants({size: "lg"})}
					>
						Log Session (DEBUG)
					</Button>
					<p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-primary">
						Your shelf, shared
					</p>
					<h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
						Keep a watchlist with the friends you watch with.
					</h1>
					<p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
						Collect what you want to watch, share the list, and decide what comes next together.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						{!isPending && !session && (
							<Link
								to="/login"
								search={{mode: "sign-up"}}
								className={buttonVariants({size: "lg"})}
							>
								Create account
							</Link>
						)}
						<Link
							to="/dashboard"
							className={buttonVariants({variant: "outline", size: "lg"})}
						>
							Open your dashboard
						</Link>
					</div>
				</div>

				<div className="flex flex-col min-h-[32rem] items-center justify-center px-4 py-12 sm:px-12 lg:justify-end lg:pl-64 lg:pr-12">
					<DvdCase
						posterUrl="/frieren_cover_tmdb.png"
						posterAlt="Frieren: Beyond Journey's End cover"
						title="Frieren: Beyond Journey's End"
						subtitle="Volume One"
						description="An elf mage retraces the road her fallen companions once walked."
						metadata={["2023", "28 episodes"]}
					/>
					<p className="mt-5 text-sm text-muted-foreground">
						Click the case to open it.
					</p>
				</div>
			</section>

			<section className="border-t border-border bg-card">
				<div className="mx-auto w-full max-w-7xl px-6 py-20 md:px-10 md:py-28">
					<div className="mx-auto max-w-2xl text-center">
						<p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-primary">
							How it works
						</p>
						<h2 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
							One watchlist. Everyone on the same page.
						</h2>
						<p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
							Create shared watchlists, add movie and TV titles, and track what you have watched together.
						</p>
					</div>

					<div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-10">
						<div className="border-t border-border pt-6">
							<p className="text-sm font-medium tracking-[0.18em] text-muted-foreground">01</p>
							<h3 className="mt-4 font-serif text-xl">Bring everyone together</h3>
							<p className="mt-3 leading-7 text-muted-foreground">
								Create a watchlist and share it with the members you watch with.
							</p>
						</div>
						<div className="border-t border-border pt-6">
							<p className="text-sm font-medium tracking-[0.18em] text-muted-foreground">02</p>
							<h3 className="mt-4 font-serif text-xl">Build your queue</h3>
							<p className="mt-3 leading-7 text-muted-foreground">
								Add the movies and TV titles your group wants to watch next.
							</p>
						</div>
						<div className="border-t border-border pt-6">
							<p className="text-sm font-medium tracking-[0.18em] text-muted-foreground">03</p>
							<h3 className="mt-4 font-serif text-xl">Keep up with progress</h3>
							<p className="mt-3 leading-7 text-muted-foreground">
								Mark titles as watched and see your shared progress at a glance.
							</p>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
