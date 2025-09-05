import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { emailService } from "./emailService";
import { insertTicketSchema, insertCommentSchema, updateTicketSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Ticket routes
  app.get('/api/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let tickets;
      if (user?.role === 'admin') {
        tickets = await storage.getAllTickets();
      } else {
        tickets = await storage.getTicketsByUser(userId);
      }
      
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permissions
      if (user?.role !== 'admin' && ticket.createdBy !== userId && ticket.assignedTo !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.post('/api/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTicketSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      const ticket = await storage.createTicket(validatedData);
      
      // Send notification to admins
      const adminUsers = (await storage.getTeamMembers()).filter(u => u.role === 'admin' && u.email);
      const adminEmails = adminUsers.map(u => u.email!);
      
      if (adminEmails.length > 0) {
        const creator = await storage.getUser(userId);
        if (creator) {
          await emailService.sendTicketCreatedNotification(
            { ...ticket, creator },
            adminEmails
          );
        }
      }
      
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.patch('/api/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only admins and assignees can update tickets
      const ticket = await storage.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      if (user?.role !== 'admin' && ticket.assignedTo !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = updateTicketSchema.parse({
        id: ticketId,
        ...req.body,
      });
      
      // Handle status changes
      const updates: any = { ...validatedData };
      if (validatedData.status === 'resolved' && !ticket.resolvedAt) {
        updates.resolvedAt = new Date();
      }
      if (validatedData.status === 'closed' && !ticket.closedAt) {
        updates.closedAt = new Date();
      }
      
      const updatedTicket = await storage.updateTicket(ticketId, updates);
      
      // Send notifications based on changes
      if (validatedData.status === 'closed' && ticket.status !== 'closed') {
        const fullTicket = await storage.getTicketById(ticketId);
        if (fullTicket) {
          await emailService.sendTicketClosedNotification(fullTicket);
        }
      }
      
      if (validatedData.assignedTo && validatedData.assignedTo !== ticket.assignedTo) {
        const assignee = await storage.getUser(validatedData.assignedTo);
        if (assignee) {
          const fullTicket = await storage.getTicketById(ticketId);
          if (fullTicket) {
            await emailService.sendTicketAssignedNotification({
              ...fullTicket,
              assignee,
            });
          }
        }
      }
      
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating ticket:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  app.delete('/api/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only admins can delete tickets
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteTicket(ticketId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  // Comment routes
  app.get('/api/tickets/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check ticket access
      const ticket = await storage.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      if (user?.role !== 'admin' && ticket.createdBy !== userId && ticket.assignedTo !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const comments = await storage.getCommentsByTicket(ticketId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/tickets/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check ticket access
      const ticket = await storage.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      if (user?.role !== 'admin' && ticket.createdBy !== userId && ticket.assignedTo !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        ticketId,
        userId,
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Stats route
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const stats = await storage.getTicketStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Team management routes
  app.get('/api/team', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const team = await storage.getTeamMembers();
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.patch('/api/team/:userId/role', isAuthenticated, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      const { role } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!['employee', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(targetUserId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
