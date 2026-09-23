import {createFileRoute, Link} from '@tanstack/react-router'
import {trpc} from "@/utils/trpc";
import {useRef} from "react";
import {useQuery} from "@tanstack/react-query";
import {useCoverUpload} from "@/hooks/user-cover-upload";
import {toast} from "sonner";
import {ArrowLeft, Loader2, Upload} from "lucide-react";
import {Button} from "@watch3r/ui/components/button";
import {Route as WatchlistRoute} from "./route";

export const Route = createFileRoute('/_auth/watchlist/$watchlistId/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const { watchlist: initialWatchlist } = WatchlistRoute.useLoaderData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: watchlists } = useQuery(trpc.watchlist.myWatchlists.queryOptions());
  const watchlist =
    watchlists?.find((wl) => wl.id === initialWatchlist.id) ?? initialWatchlist;

  const uploadCover = useCoverUpload({ watchlist })

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    uploadCover.mutate(file, {
      onSuccess: async () => {
        toast.success("Cover updated!");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    })
  };

  return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            to="/watchlist/$watchlistId"
            params={{ watchlistId: watchlist.id.toString() }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
            <ArrowLeft className="size-4" />
            Back to {watchlist.name}
          </Link>

          <div className="mt-6 space-y-1.5">
            <h1 className="font-serif text-3xl font-semibold tracking-light text-balance sm:text-4xl">
              Settings
            </h1>
            <p className="text-muted-foreground text-pretty">
              Manage your watchlist and how others see it.
            </p>
          </div>

          {/* Title / Description */}
          <section className="mt-8 rounded 2-xl border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-semibold">Title / Description</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This is where you can add a title and description for your watchlist.
            </p>


          </section>

          {/* Cover */}
          <section className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-semibold">Cover image</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PNG, JPEG, or WebP. Up to 5MB.
            </p>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* Mini card preview */}
              <div className="w-full max-w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={watchlist.coverImage ?? "/placeholder.svg"}
                    alt={`Cover art for ${watchlist.name}`}
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base font-semibold leading-tight text-balance">
                    {watchlist.name}
                  </h3>
                </div>
              </div>

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
                  disabled={uploadCover.isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  {uploadCover.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {uploadCover.isPending ? "Uploading..." : "Upload new"}
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>
  )
}
