import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UsersIcon,
  ShieldCheckIcon,
  UserIcon,
  MailIcon,
  Loader2Icon,
} from "lucide-react";
import type { User } from "@shared/schema";

export default function TeamManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [user, authLoading, toast]);

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

  const { data: teamMembers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/team"],
    enabled: !!user && user.role === "admin",
    retry: false,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/team/${data.userId}/role`, { role: data.role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
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
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading team...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Team Management</h2>
        <p className="text-muted-foreground">
          Manage team members and their roles within the helpdesk system.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card data-testid="card-total-members">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Members</p>
                <p className="text-2xl font-bold text-foreground">
                  {teamMembers?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-admins">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Administrators</p>
                <p className="text-2xl font-bold text-foreground">
                  {teamMembers?.filter((member: User) => member.role === "admin").length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-employees">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Employees</p>
                <p className="text-2xl font-bold text-foreground">
                  {teamMembers?.filter((member: User) => member.role === "employee").length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!teamMembers || teamMembers.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-team">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No team members found</h3>
              <p className="text-muted-foreground">
                Team members will appear here once they sign in to the system.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member: User) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                  data-testid={`team-member-${member.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profileImageUrl} alt={`${member.firstName} ${member.lastName}`} />
                      <AvatarFallback>
                        {member.firstName?.[0]}{member.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">
                          {member.firstName} {member.lastName}
                        </h3>
                        <Badge
                          variant={member.role === "admin" ? "default" : "secondary"}
                          className={member.role === "admin" ? "bg-purple-100 text-purple-800" : ""}
                        >
                          {member.role === "admin" ? "Administrator" : "Employee"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <MailIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {member.email || "No email"}
                        </span>
                      </div>
                      {member.department && (
                        <p className="text-sm text-muted-foreground">
                          Department: {member.department}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Joined: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role || "employee"}
                      onValueChange={(role) => handleRoleChange(member.id, role)}
                      disabled={member.id === user?.id || updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-[140px]" data-testid={`select-role-${member.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    {member.id === user?.id && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <ShieldCheckIcon className="h-5 w-5" />
              Administrator Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• View and manage all tickets in the system</li>
              <li>• Assign tickets to team members</li>
              <li>• Update ticket status and priority</li>
              <li>• Access team management and user roles</li>
              <li>• View analytics and reports</li>
              <li>• Receive email notifications for new tickets</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <UserIcon className="h-5 w-5" />
              Employee Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Create new support tickets</li>
              <li>• View and comment on own tickets</li>
              <li>• View tickets assigned to them</li>
              <li>• Update status of assigned tickets</li>
              <li>• Receive email notifications for ticket updates</li>
              <li>• Access basic dashboard features</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
