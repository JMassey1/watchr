import type {WatchlistRole} from "@watch3r/db/schema/watchlist";

export interface TRPCMeta {
	allowedWatchlistRoles?: WatchlistRole[]
}