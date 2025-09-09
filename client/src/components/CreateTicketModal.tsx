import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertTicketSchema } from "@shared/schema";
import { Loader2Icon, TicketIcon, XIcon, CloudUploadIcon } from "lucide-react";
import { z } from "zod";

const createTicketFormSchema = insertTicketSchema.omit({
  createdBy: true,
});

type CreateTicketFormData = z.infer<typeof createTicketFormSchema>;

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateTicketModal({ open, onOpenChange }: CreateTicketModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      form.reset();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Create New Ticket
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

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
                        data-testid="input-modal-subject"
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
                        <SelectTrigger data-testid="select-modal-priority">
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
                        <SelectTrigger data-testid="select-modal-category">
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
                        <SelectTrigger data-testid="select-modal-department">
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
                      placeholder="Please provide detailed information about the issue..."
                      className="min-h-32 resize-none"
                      {...field}
                      data-testid="textarea-modal-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Attachments</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <CloudUploadIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag files here or{" "}
                  <span className="text-primary cursor-pointer">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Maximum file size: 10MB</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-modal-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTicketMutation.isPending}
                data-testid="button-modal-create-ticket"
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
      </DialogContent>
    </Dialog>
  );
}
