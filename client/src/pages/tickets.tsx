import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  SearchIcon,
  FilterIcon,
  TicketIcon,
  MessageSquareIcon,
  UserIcon,
  CalendarIcon,
  Loader2Icon,
} from "lucide-react";
import type { Ticket, User, Comment } from "@shared/schema";

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

export default function Tickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");

  const { data: tickets, isLoading } = useQuery<(Ticket & { creator: User; assignee?: User })[]>({
    queryKey: ["/api/tickets"],
    retry: false,
  });

  const { data: ticketDetails, isLoading: ticketDetailsLoading } = useQuery<Ticket & { creator: User; assignee?: User; comments: (Comment & { user: User })[] }>({
    queryKey: ["/api/tickets", selectedTicket],
    enabled: !!selectedTicket,
    retry: false,
  });

  const { data: teamMembers } = useQuery<User[]>({
    queryKey: ["/api/team"],
    enabled: user?.role === "admin",
    retry: false,
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: { ticketId: number; updates: any }) => {
      await apiRequest("PATCH", `/api/tickets/${data.ticketId}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Ticket updated successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: { ticketId: number; content: string }) => {
      await apiRequest("POST", `/api/tickets/${data.ticketId}/comments`, {
        content: data.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", selectedTicket] });
      setNewComment("");
      toast({ title: "Comment added successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const filteredTickets = tickets?.filter((ticket: Ticket) => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = (ticketId: number, status: string) => {
    updateTicketMutation.mutate({ ticketId, updates: { status } });
  };

  const handleAssignTicket = (ticketId: number, assignedTo: string) => {
    updateTicketMutation.mutate({ ticketId, updates: { assignedTo } });
  };

  const handleAddComment = () => {
    if (!selectedTicket || !newComment.trim()) return;
    addCommentMutation.mutate({ ticketId: selectedTicket, content: newComment });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">All Tickets</h2>
        <p className="text-muted-foreground">
          Manage and track all support tickets
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets by subject or ticket number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-tickets"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                <FilterIcon className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {!filteredTickets || filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12" data-testid="empty-tickets">
              <TicketIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No tickets found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "No tickets have been created yet."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket: Ticket & { creator: User; assignee?: User }) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-primary" data-testid={`ticket-number-${ticket.id}`}>
                        {ticket.ticketNumber}
                      </span>
                      <Badge className={`text-xs ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={`text-xs ${statusColors[ticket.status!]}`}>
                        {ticket.status?.replace("_", " ")}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2" data-testid={`ticket-subject-${ticket.id}`}>
                      {ticket.subject}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        {ticket.creator.firstName} {ticket.creator.lastName}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ""}
                      </div>
                      {ticket.assignee && (
                        <div className="flex items-center gap-1">
                          <span>Assigned to: {ticket.assignee.firstName} {ticket.assignee.lastName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket.id)}
                      data-testid={`button-view-ticket-${ticket.id}`}
                    >
                      <MessageSquareIcon className="h-4 w-4 mr-1" />
                      View Details
                    </Button>

                    {user?.role === "admin" && (
                      <>
                        <Select
                          value={ticket.status || ""}
                          onValueChange={(status) => handleStatusUpdate(ticket.id, status)}
                        >
                          <SelectTrigger className="w-[140px]" data-testid={`select-status-${ticket.id}`}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={ticket.assignedTo || ""}
                          onValueChange={(assignedTo) => handleAssignTicket(ticket.id, assignedTo)}
                        >
                          <SelectTrigger className="w-[160px]" data-testid={`select-assignee-${ticket.id}`}>
                            <SelectValue placeholder="Assign to..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {teamMembers?.map((member: User) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.firstName} {member.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ticket Details Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Ticket Details - {ticketDetails?.ticketNumber}
            </DialogTitle>
          </DialogHeader>

          {ticketDetailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="h-6 w-6 animate-spin" />
            </div>
          ) : ticketDetails ? (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Subject</h4>
                  <p className="text-muted-foreground">{ticketDetails.subject}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Priority</h4>
                  <Badge className={`text-xs ${priorityColors[ticketDetails.priority]}`}>
                    {ticketDetails.priority}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Status</h4>
                  <Badge className={`text-xs ${statusColors[ticketDetails.status!]}`}>
                    {ticketDetails.status?.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Category</h4>
                  <p className="text-muted-foreground">{ticketDetails.category}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Created By</h4>
                  <p className="text-muted-foreground">
                    {ticketDetails.creator.firstName} {ticketDetails.creator.lastName}
                  </p>
                </div>
                {ticketDetails.assignee && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Assigned To</h4>
                    <p className="text-muted-foreground">
                      {ticketDetails.assignee.firstName} {ticketDetails.assignee.lastName}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Description</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">{ticketDetails.description}</p>
                </div>
              </div>

              {/* Comments */}
              <div>
                <h4 className="font-semibold text-foreground mb-4">Comments</h4>
                <div className="space-y-4 mb-4">
                  {ticketDetails.comments?.map((comment: Comment & { user: User }) => (
                    <div key={comment.id} className="bg-card border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-medium">
                            {comment.user.firstName?.[0]}{comment.user.lastName?.[0]}
                          </span>
                        </div>
                        <span className="font-medium text-sm">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
                        </span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="border-t pt-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-3"
                    data-testid="textarea-new-comment"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    data-testid="button-add-comment"
                  >
                    {addCommentMutation.isPending ? (
                      <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MessageSquareIcon className="h-4 w-4 mr-2" />
                    )}
                    Add Comment
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
