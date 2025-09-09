import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertTicketSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2Icon, TicketIcon } from "lucide-react";
import { z } from "zod";

const createTicketFormSchema = insertTicketSchema.omit({
  createdBy: true,
});

type CreateTicketFormData = z.infer<typeof createTicketFormSchema>;

export default function CreateTicket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketFormSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "medium",
      category: "other",
      department: "",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: CreateTicketFormData) => {
      await apiRequest("POST", "/api/tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Your ticket has been created successfully!",
      });
      setLocation("/tickets");
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
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTicketFormData) => {
    createTicketMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h2 className="text-3xl font-bold text-foreground mb-2">Create New Ticket</h2>
        <p className="text-muted-foreground">
          Submit a new support request and we'll get back to you as soon as possible.
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Ticket Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Subject *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description of the issue"
                            {...field}
                            data-testid="input-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hardware">Hardware</SelectItem>
                              <SelectItem value="software">Software</SelectItem>
                              <SelectItem value="network">Network</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="access">Access & Security</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-department">
                              <SelectValue placeholder="Select Department (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_specified">Not specified</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
                              <SelectItem value="HR">Human Resources</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="Operations">Operations</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide detailed information about the issue, including steps to reproduce, error messages, and any other relevant details..."
                          className="min-h-32 resize-none"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">📝 Tips for a Better Ticket</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Be specific about the problem you're experiencing</li>
                    <li>• Include error messages or screenshots if applicable</li>
                    <li>• Mention when the issue started occurring</li>
                    <li>• List any troubleshooting steps you've already tried</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    data-testid="button-create-ticket"
                  >
                    {createTicketMutation.isPending ? (
                      <>
                        <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <TicketIcon className="h-4 w-4 mr-2" />
                        Create Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
