import {boolean, pgEnum, pgTable, text, timestamp} from "drizzle-orm/pg-core";
import {createSelectSchema} from "drizzle-orm/zod";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	role: text("role").default("user").notNull(),
	banned: boolean("banned").default(false).notNull(),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires", { precision: 6, withTimezone: true }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});
export const userSelectSchema = createSelectSchema(user);
export const publicUserSchema = userSelectSchema.pick({
	id: true,
	name: true,
	image: true
}).partial({
	image: true
})

export const themePresetValues = ["default", "bubblegum"] as const;
export type ThemePreset = (typeof themePresetValues)[number];
export const themePresets = themePresetValues.map((value) => ({
	label: `${value.charAt(0).toUpperCase()}${value.slice(1)}`,
	value,
}));
export const themePresetEnum = pgEnum("theme", themePresetValues);

export const userSettings = pgTable("user_settings", {
	userId: text("user_id").notNull().references(() => user.id, {onDelete: "cascade"}).primaryKey(),
	themePreset: themePresetEnum("theme_preset").notNull().default("default")
})
