import {createFileRoute, Link, redirect} from '@tanstack/react-router'
import {queryClient, trpc} from "@/utils/trpc";
import {useRef} from "react";
import {useCoverUpload} from "@/hooks/user-cover-upload";
import {toast} from "sonner";
import {ArrowLeft} from "lucide-react";

export const Route = createFileRoute('/_auth/watchlist/$watchlistId/settings')({
  loader: async ({params}) => {
    const watchlists = await queryClient.fetchQuery({
      ...trpc.watchlist.myWatchlists.queryOptions(),
      staleTime: 0,
    });

    const watchlist = watchlists.find((wl) => wl.id === parseInt(params.watchlistId));
    if (!watchlist) {
      throw redirect({
        to: "/dashboard",
        search: {
          error: "watchlist-access-denied",
        },
        replace: true,
      })
    }

    return { watchlist };
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { watchlist } = Route.useLoaderData();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

          {/* Cover */}
          <section className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-semibold">Cover image</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PNG, JPEG, or WebP. Up to 5MB.
            </p>
            

          </section>
        </main>
      </div>
  )
}
