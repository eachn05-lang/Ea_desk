import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  pgEnum,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("employee"), // employee, admin
  department: varchar("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket priorities and statuses
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "critical"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketCategoryEnum = pgEnum("ticket_category", ["hardware", "software", "network", "email", "access", "other"]);

// Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number").unique().notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  priority: ticketPriorityEnum("priority").notNull(),
  status: ticketStatusEnum("status").default("open"),
  category: ticketCategoryEnum("category").notNull(),
  department: varchar("department"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
});

// Comments table for ticket communication
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  ticketId: serial("ticket_id").references(() => tickets.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  createdTickets: many(tickets, { relationName: "createdTickets" }),
  assignedTickets: many(tickets, { relationName: "assignedTickets" }),
  comments: many(comments),
}));

export const ticketRelations = relations(tickets, ({ one, many }) => ({
  creator: one(users, {
    fields: [tickets.createdBy],
    references: [users.id],
    relationName: "createdTickets",
  }),
  assignee: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
    relationName: "assignedTickets",
  }),
  comments: many(comments),
}));

export const commentRelations = relations(comments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// Types and schemas
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  closedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const updateTicketSchema = insertTicketSchema.partial().extend({
  id: z.number(),
});
