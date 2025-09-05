import nodemailer from 'nodemailer';
import type { Ticket, User } from '@shared/schema';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure based on environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
      },
    });
  }

  async sendTicketCreatedNotification(
    ticket: Ticket & { creator: User },
    adminEmails: string[]
  ): Promise<void> {
    const subject = `New Ticket Created: ${ticket.subject}`;
    const html = this.getTicketCreatedTemplate(ticket);

    try {
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@helpdesk.com',
        to: adminEmails.join(','),
        subject,
        html,
      });
      console.log(`Ticket creation notification sent for ticket ${ticket.ticketNumber}`);
    } catch (error) {
      console.error('Failed to send ticket creation notification:', error);
    }
  }

  async sendTicketClosedNotification(
    ticket: Ticket & { creator: User; assignee?: User }
  ): Promise<void> {
    if (!ticket.creator.email) {
      console.log('No email address for ticket creator, skipping notification');
      return;
    }

    const subject = `Ticket Closed: ${ticket.subject}`;
    const html = this.getTicketClosedTemplate(ticket);

    try {
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@helpdesk.com',
        to: ticket.creator.email,
        subject,
        html,
      });
      console.log(`Ticket closure notification sent to ${ticket.creator.email}`);
    } catch (error) {
      console.error('Failed to send ticket closure notification:', error);
    }
  }

  async sendTicketAssignedNotification(
    ticket: Ticket & { creator: User; assignee: User }
  ): Promise<void> {
    if (!ticket.assignee.email) {
      console.log('No email address for assignee, skipping notification');
      return;
    }

    const subject = `Ticket Assigned: ${ticket.subject}`;
    const html = this.getTicketAssignedTemplate(ticket);

    try {
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@helpdesk.com',
        to: ticket.assignee.email,
        subject,
        html,
      });
      console.log(`Ticket assignment notification sent to ${ticket.assignee.email}`);
    } catch (error) {
      console.error('Failed to send ticket assignment notification:', error);
    }
  }

  private getTicketCreatedTemplate(ticket: Ticket & { creator: User }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Ticket Created</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .ticket-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .priority-high { color: #dc2626; font-weight: bold; }
            .priority-critical { color: #991b1b; font-weight: bold; }
            .priority-medium { color: #ea580c; font-weight: bold; }
            .priority-low { color: #16a34a; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 New Support Ticket Created</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>A new support ticket has been created and requires attention.</p>
              
              <div class="ticket-details">
                <h3>Ticket Details</h3>
                <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
                <p><strong>Subject:</strong> ${ticket.subject}</p>
                <p><strong>Priority:</strong> <span class="priority-${ticket.priority}">${ticket.priority.toUpperCase()}</span></p>
                <p><strong>Category:</strong> ${ticket.category}</p>
                <p><strong>Created by:</strong> ${ticket.creator.firstName} ${ticket.creator.lastName} (${ticket.creator.email})</p>
                <p><strong>Department:</strong> ${ticket.department || 'Not specified'}</p>
                <p><strong>Created:</strong> ${new Date(ticket.createdAt!).toLocaleString()}</p>
              </div>
              
              <div class="ticket-details">
                <h4>Description:</h4>
                <p>${ticket.description}</p>
              </div>
              
              <p>Please log in to the helpdesk portal to review and assign this ticket.</p>
              
              <p>Best regards,<br>Helpdesk System</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getTicketClosedTemplate(ticket: Ticket & { creator: User; assignee?: User }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket Closed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .ticket-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Ticket Resolved</h1>
            </div>
            <div class="content">
              <p>Hello ${ticket.creator.firstName},</p>
              <p>Great news! Your support ticket has been resolved and closed.</p>
              
              <div class="ticket-details">
                <h3>Ticket Details</h3>
                <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
                <p><strong>Subject:</strong> ${ticket.subject}</p>
                <p><strong>Resolved by:</strong> ${ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Support Team'}</p>
                <p><strong>Closed:</strong> ${new Date(ticket.closedAt!).toLocaleString()}</p>
              </div>
              
              <p>If you have any questions about the resolution or need further assistance, please don't hesitate to create a new ticket.</p>
              
              <p>Thank you for using our support services!</p>
              
              <p>Best regards,<br>Support Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getTicketAssignedTemplate(ticket: Ticket & { creator: User; assignee: User }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket Assigned</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .ticket-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Ticket Assigned to You</h1>
            </div>
            <div class="content">
              <p>Hello ${ticket.assignee.firstName},</p>
              <p>A support ticket has been assigned to you. Please review the details below and take appropriate action.</p>
              
              <div class="ticket-details">
                <h3>Ticket Details</h3>
                <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
                <p><strong>Subject:</strong> ${ticket.subject}</p>
                <p><strong>Priority:</strong> ${ticket.priority.toUpperCase()}</p>
                <p><strong>Category:</strong> ${ticket.category}</p>
                <p><strong>Created by:</strong> ${ticket.creator.firstName} ${ticket.creator.lastName}</p>
                <p><strong>Created:</strong> ${new Date(ticket.createdAt!).toLocaleString()}</p>
              </div>
              
              <div class="ticket-details">
                <h4>Description:</h4>
                <p>${ticket.description}</p>
              </div>
              
              <p>Please log in to the helpdesk portal to review and work on this ticket.</p>
              
              <p>Best regards,<br>Helpdesk System</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
