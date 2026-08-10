import {boolean, pgTable, text, timestamp} from "drizzle-orm/pg-core";
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