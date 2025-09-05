import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Link } from "wouter";
import {
  TicketIcon,
  ClockIcon,
  Loader2Icon,
  CheckCircleIcon,
  PlusIcon,
  SearchIcon,
  UserPlus,
  BarChart3,
  Users,
} from "lucide-react";
import type { Ticket, User } from "@shared/schema";

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

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, toast]);

  const { data: tickets, isLoading: ticketsLoading } = useQuery<(Ticket & { creator: User; assignee?: User })[]>({
    queryKey: ["/api/tickets"],
    enabled: !!user,
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }>({
    queryKey: ["/api/stats"],
    enabled: !!user && user.role === "admin",
    retry: false,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your ticket overview.
            </p>
          </div>
          <Link href="/create-ticket">
            <Button data-testid="button-create-ticket">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Stats Cards - Only for admins */}
        {user?.role === "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card data-testid="card-total-tickets">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total Tickets</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : stats?.total || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TicketIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-open-tickets">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Open Tickets</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : stats?.open || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-in-progress-tickets">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">In Progress</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : stats?.inProgress || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Loader2Icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-resolved-tickets">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Resolved</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : stats?.resolved || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets Table */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">Recent Tickets</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Input
                      placeholder="Search tickets..."
                      className="pl-10 pr-4 py-2"
                      data-testid="input-search-tickets"
                    />
                    <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <Select>
                    <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
                      <SelectValue placeholder="All Status" />
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
              </div>
            </div>

            <div className="overflow-x-auto">
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2Icon className="h-6 w-6 animate-spin" />
                </div>
              ) : !tickets || tickets.length === 0 ? (
                <div className="text-center py-12" data-testid="empty-tickets">
                  <TicketIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No tickets found</h3>
                  <p className="text-muted-foreground mb-4">
                    {user?.role === "admin" 
                      ? "No tickets have been created yet." 
                      : "You haven't created any tickets yet."
                    }
                  </p>
                  <Link href="/create-ticket">
                    <Button data-testid="button-create-first-ticket">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Your First Ticket
                    </Button>
                  </Link>
                </div>
              ) : (
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
                      {user?.role === "admin" && (
                        <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
                          Assignee
                        </th>
                      )}
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets?.slice(0, 10).map((ticket: Ticket & { creator: User; assignee?: User }) => (
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
                        {user?.role === "admin" && (
                          <td className="py-4 px-6">
                            {ticket.assignee ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                  <span className="text-primary-foreground text-xs font-medium">
                                    {ticket.assignee.firstName?.[0]}{ticket.assignee.lastName?.[0]}
                                  </span>
                                </div>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card data-testid="card-quick-actions">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/create-ticket">
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto"
                    data-testid="quick-action-create-ticket"
                  >
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                      <PlusIcon className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Create New Ticket</p>
                      <p className="text-xs text-muted-foreground">Submit a new support request</p>
                    </div>
                  </Button>
                </Link>

                {user?.role === "admin" && (
                  <>
                    <Link href="/team">
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-3 h-auto"
                        data-testid="quick-action-team-management"
                      >
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <UserPlus className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">Team Management</p>
                          <p className="text-xs text-muted-foreground">Manage users and roles</p>
                        </div>
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      data-testid="quick-action-view-reports"
                    >
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">View Reports</p>
                        <p className="text-xs text-muted-foreground">Analyze ticket metrics</p>
                      </div>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
