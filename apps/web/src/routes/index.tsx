import {createFileRoute, Link} from "@tanstack/react-router";
import {buttonVariants} from "@watch3r/ui/components/button";

import DvdCase from "@/components/dvd-case";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<main className="bg-background text-foreground">
			<section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(38rem,7fr)] lg:gap-8">
				<div className="max-w-xl">
					<p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-primary">
						Your shelf, shared
					</p>
					<h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
						Keep a watchlist with the friends you watch with.
					</h1>
					<p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
						Collect what you want to watch, share the list, and decide what comes next together.
					</p>
					<div className="mt-8">
						<Link to="/dashboard" className={buttonVariants({size: "lg"})}>
							Open your dashboard
						</Link>
					</div>
					<p className="mt-5 text-sm text-muted-foreground">
						Click the case to open it.
					</p>
				</div>

				<div className="flex min-h-[32rem] items-center justify-center rounded-xl border border-border bg-card px-4 py-12 sm:px-12 lg:justify-end lg:pl-64 lg:pr-12">
					<DvdCase
						posterUrl="/frieren_cover_tmdb.png"
						posterAlt="Frieren: Beyond Journey's End cover"
						title="Frieren: Beyond Journey's End"
						subtitle="Volume One"
						description="An elf mage retraces the road her fallen companions once walked."
						metadata={["2023", "28 episodes"]}
					/>
				</div>
			</section>
		</main>
	);
}
