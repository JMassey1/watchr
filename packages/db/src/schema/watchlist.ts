import {pgTable, integer, text, pgEnum, timestamp, primaryKey, boolean, unique} from 'drizzle-orm/pg-core'
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
    description: text("description"),
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

// Media type mirrors TMDB's own values ('movie' | 'tv'). The UI's
// 'movie' | 'series' wording is mapped in the API layer, not stored.
export const mediaTypeEnum = pgEnum('media_type', ['movie', 'tv']);
export type MediaType = (typeof mediaTypeEnum.enumValues)[number];

// Local cache of a TMDB entry, deduped on (tmdbId, mediaType) so a title
// referenced by multiple watchlists is stored once.
export const title = pgTable("title", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    name: text("name").notNull(),
    releaseYear: integer("release_year"),
    posterPath: text("poster_path"),
    overview: text("overview"),
    runtime: integer("runtime"),
    createdAt: timestamp("created_at", {mode: "date", withTimezone: true}).notNull().defaultNow(),
}, (t) => [
    unique("title_tmdb_unique").on(t.tmdbId, t.mediaType),
])
export const titleInsertSchema = createInsertSchema(title);
export const titleSelectSchema = createSelectSchema(title);

export const watchlistItem = pgTable("watchlist_items", {
    watchlistId: integer("watchlist_id").notNull().references(() => watchlist.id, {onDelete: "cascade"}),
    titleId: integer("title_id").notNull().references(() => title.id, {onDelete: "cascade"}),
    addedBy: text("added_by").notNull().references(() => user.id, {onDelete: "cascade"}),
    watched: boolean("watched").notNull().default(false),
    addedAt: timestamp("added_at", {mode: "date", withTimezone: true}).notNull().defaultNow(),
}, (t) => [
    primaryKey({ columns: [t.watchlistId, t.titleId] }),
])
export const watchlistItemInsertSchema = createInsertSchema(watchlistItem);
export const watchlistItemSelectSchema = createSelectSchema(watchlistItem);