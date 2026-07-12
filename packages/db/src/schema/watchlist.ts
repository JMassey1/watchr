import {pgTable, integer, text, pgEnum, timestamp} from 'drizzle-orm/pg-core'
import {user} from "./auth";
import {relations} from "drizzle-orm";

export const watchlistRoleEnum = pgEnum('role', ['owner', 'admin', 'user']);

export const watchlist = pgTable("watchlist", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    ownerId: text("owner_id").notNull().references(() => user.id, {onDelete: 'cascade'}),
})

export const watchlistMember = pgTable("watchlist_members", {
    watchlistId: integer("watchlist_id").notNull().references(() => watchlist.id, {onDelete: "cascade"}),
    userId: text("user_id").notNull().references(() => user.id, {onDelete: "cascade"}),
    role: watchlistRoleEnum("role").notNull().default("user"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
})

export const userRelations = relations(user, ({many}) => ({
    ownedWatchlists: many(watchlist),
    memberships: many(watchlistMember)
}))

export const watchlistRelations = relations(watchlist, ({one, many}) => ({
    owner: one(user, {
        fields: [watchlist.ownerId],
        references: [user.id]
    }),
    members: many(watchlistMember)
}));

export const watchlistMemberRelations = relations(watchlistMember, ({one}) => ({
    watchlist: one(watchlist, {
        fields: [watchlistMember.watchlistId],
        references: [watchlist.id]
    }),
    user: one(user, {
        fields: [watchlistMember.userId],
        references: [user.id]
    })
}))