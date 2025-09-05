import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquareIcon } from "lucide-react";
import type { Ticket, User } from "@shared/schema";

interface TicketTableProps {
  tickets: (Ticket & { creator: User; assignee?: User })[];
  onViewTicket: (ticketId: number) => void;
  showAssignee?: boolean;
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusColors = {
  open: "bg-orange-100 text-orange-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function TicketTable({ tickets, onViewTicket, showAssignee = false }: TicketTableProps) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tickets found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
              Ticket ID
            </th>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
              Subject
            </th>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
              Priority
            </th>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
              Status
            </th>
            {showAssignee && (
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
                Assignee
              </th>
            )}
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
              Created
            </th>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="border-b border-border hover:bg-accent transition-colors"
              data-testid={`ticket-row-${ticket.id}`}
            >
              <td className="py-4 px-6">
                <span className="text-sm font-medium text-primary">
                  {ticket.ticketNumber}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className="text-sm font-medium text-foreground">
                  {ticket.subject}
                </span>
              </td>
              <td className="py-4 px-6">
                <Badge className={`text-xs ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </Badge>
              </td>
              <td className="py-4 px-6">
                <Badge className={`text-xs ${statusColors[ticket.status!]}`}>
                  {ticket.status?.replace("_", " ")}
                </Badge>
              </td>
              {showAssignee && (
                <td className="py-4 px-6">
                  {ticket.assignee ? (
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={ticket.assignee.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {ticket.assignee.firstName?.[0]}{ticket.assignee.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">
                        {ticket.assignee.firstName} {ticket.assignee.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </td>
              )}
              <td className="py-4 px-6">
                <span className="text-sm text-muted-foreground">
                  {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ""}
                </span>
              </td>
              <td className="py-4 px-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewTicket(ticket.id)}
                  data-testid={`button-view-${ticket.id}`}
                >
                  <MessageSquareIcon className="h-4 w-4 mr-1" />
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
