import {pgTable, integer, text, pgEnum, timestamp} from 'drizzle-orm/pg-core'
import {user} from "./auth";

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
