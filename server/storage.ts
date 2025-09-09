import {
  users,
  tickets,
  comments,
  type User,
  type UpsertUser,
  type Ticket,
  type InsertTicket,
  type Comment,
  type InsertComment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Ticket operations
  getAllTickets(): Promise<(Ticket & { creator: User; assignee?: User })[]>;
  getTicketById(id: number): Promise<(Ticket & { creator: User; assignee?: User; comments: (Comment & { user: User })[] }) | undefined>;
  getTicketsByUser(userId: string): Promise<(Ticket & { creator: User; assignee?: User })[]>;
  getTicketsByAssignee(userId: string): Promise<(Ticket & { creator: User; assignee?: User })[]>;
  createTicket(ticket: Omit<InsertTicket, 'ticketNumber'>): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket>;
  deleteTicket(id: number): Promise<void>;
  
  // Comment operations
  getCommentsByTicket(ticketId: number): Promise<(Comment & { user: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Stats operations
  getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }>;
  
  // Team operations
  getTeamMembers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
}

const assigneeUser = alias(users, "assignee_user");

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Ticket operations
  async getAllTickets(): Promise<(Ticket & { creator: User; assignee?: User })[]> {
    const results = await db
      .select()
      .from(tickets)
      .leftJoin(users, eq(tickets.createdBy, users.id))
      .leftJoin(assigneeUser, eq(tickets.assignedTo, assigneeUser.id))
      .orderBy(desc(tickets.createdAt));

    return results.map(result => ({
      ...result.tickets,
      creator: result.users!,
      assignee: result.assignee_user || undefined,
    }));
  }

  async getTicketById(id: number): Promise<(Ticket & { creator: User; assignee?: User; comments: (Comment & { user: User })[] }) | undefined> {
    const [ticketResult] = await db
      .select()
      .from(tickets)
      .leftJoin(users, eq(tickets.createdBy, users.id))
      .leftJoin(assigneeUser, eq(tickets.assignedTo, assigneeUser.id))
      .where(eq(tickets.id, id));

    if (!ticketResult) return undefined;

    const commentsResults = await db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.ticketId, id))
      .orderBy(desc(comments.createdAt));

    const ticketComments = commentsResults.map(result => ({
      ...result.comments,
      user: result.users!,
    }));

    return {
      ...ticketResult.tickets,
      creator: ticketResult.users!,
      assignee: ticketResult.assignee_user || undefined,
      comments: ticketComments,
    };
  }

  async getTicketsByUser(userId: string): Promise<(Ticket & { creator: User; assignee?: User })[]> {
    const results = await db
      .select()
      .from(tickets)
      .leftJoin(users, eq(tickets.createdBy, users.id))
      .leftJoin(assigneeUser, eq(tickets.assignedTo, assigneeUser.id))
      .where(eq(tickets.createdBy, userId))
      .orderBy(desc(tickets.createdAt));

    return results.map(result => ({
      ...result.tickets,
      creator: result.users!,
      assignee: result.assignee_user || undefined,
    }));
  }

  async getTicketsByAssignee(userId: string): Promise<(Ticket & { creator: User; assignee?: User })[]> {
    const results = await db
      .select()
      .from(tickets)
      .leftJoin(users, eq(tickets.createdBy, users.id))
      .leftJoin(assigneeUser, eq(tickets.assignedTo, assigneeUser.id))
      .where(eq(tickets.assignedTo, userId))
      .orderBy(desc(tickets.createdAt));

    return results.map(result => ({
      ...result.tickets,
      creator: result.users!,
      assignee: result.assignee_user || undefined,
    }));
  }

  async createTicket(ticket: Omit<InsertTicket, 'ticketNumber'>): Promise<Ticket> {
    // Generate ticket number
    const ticketCount = await db.select({ count: count() }).from(tickets);
    const ticketNumber = `TKT-${String(ticketCount[0].count + 1).padStart(4, '0')}`;

    const [newTicket] = await db
      .insert(tickets)
      .values({ ...ticket, ticketNumber })
      .returning();
    return newTicket;
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  async deleteTicket(id: number): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  // Comment operations
  async getCommentsByTicket(ticketId: number): Promise<(Comment & { user: User })[]> {
    const results = await db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.ticketId, ticketId))
      .orderBy(desc(comments.createdAt));

    return results.map(result => ({
      ...result.comments,
      user: result.users!,
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  // Stats operations
  async getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }> {
    const [stats] = await db
      .select({
        total: count(),
        open: count(eq(tickets.status, "open")),
        inProgress: count(eq(tickets.status, "in_progress")),
        resolved: count(eq(tickets.status, "resolved")),
        closed: count(eq(tickets.status, "closed")),
      })
      .from(tickets);

    return {
      total: Number(stats.total),
      open: Number(stats.open),
      inProgress: Number(stats.inProgress),
      resolved: Number(stats.resolved),
      closed: Number(stats.closed),
    };
  }

  // Team operations
  async getTeamMembers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.firstName);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
