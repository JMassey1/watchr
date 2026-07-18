import {pgTable, integer, text, pgEnum, timestamp, primaryKey} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import {user} from "./auth";

export const watchlistRoleEnum = pgEnum('role', ['owner', 'admin', 'user']);
export type WatchlistRole = (typeof watchlistRoleEnum.enumValues)[number];
export const watchlistRoles = Object.fromEntries(
    watchlistRoleEnum.enumValues.map((role) => [
        `${role.charAt(0).toUpperCase()}${role.slice(1)}`,
        role,
    ]),
) as { [R in WatchlistRole as Capitalize<R>]: R };

export const watchlist = pgTable("watchlist", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    coverImage: text("cover_image"),
    ownerId: text("owner_id").notNull().references(() => user.id, {onDelete: 'cascade'}),
    updatedAt: timestamp("updated_at", {mode: "date", withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
    createdAt: timestamp("created_at", {mode: "date", withTimezone: true}).notNull().defaultNow(),
})
export const watchlistInsertSchema = createInsertSchema(watchlist).partial({"ownerId": true});
export const watchlistSelectSchema = createSelectSchema(watchlist);

export const watchlistMember = pgTable("watchlist_members", {
    watchlistId: integer("watchlist_id").notNull().references(() => watchlist.id, {onDelete: "cascade"}),
    userId: text("user_id").notNull().references(() => user.id, {onDelete: "cascade"}),
    role: watchlistRoleEnum("role").notNull().default("user"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
},
    (t) => [
        primaryKey({ columns: [t.watchlistId, t.userId] })
    ]
)
export const watchlistMemberInsertSchema = createInsertSchema(watchlistMember);