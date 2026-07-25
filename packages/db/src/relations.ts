import * as schema from "./schema";
import {defineRelations} from "drizzle-orm";

export const authRelations = defineRelations(schema, (r) => ({
	user: {
		sessions: r.many.session(),
		accounts: r.many.account(),
	},
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id
		}),
	},
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id
		})
	}
}))

export const watchlistRelations = defineRelations(schema, (r) => ({
	user: {
		ownedWatchlists: r.many.watchlist(),
		memberships: r.many.watchlistMember(),
	},

	watchlist: {
		owner: r.one.user({
			from: r.watchlist.ownerId,
			to: r.user.id,
		}),
		members: r.many.watchlistMember(),
		items: r.many.watchlistItem(),
	},

	watchlistMember: {
		watchlist: r.one.watchlist({
			from: r.watchlistMember.watchlistId,
			to: r.watchlist.id,
		}),
		user: r.one.user({
			from: r.watchlistMember.userId,
			to: r.user.id
		})
	},

	title: {
		watchlistItems: r.many.watchlistItem(),
	},

	watchlistItem: {
		watchlist: r.one.watchlist({
			from: r.watchlistItem.watchlistId,
			to: r.watchlist.id,
		}),
		title: r.one.title({
			from: r.watchlistItem.titleId,
			to: r.title.id,
		}),
		addedByUser: r.one.user({
			from: r.watchlistItem.addedBy,
			to: r.user.id,
		}),
	}
}))

export const relations = { ...authRelations, ...watchlistRelations}