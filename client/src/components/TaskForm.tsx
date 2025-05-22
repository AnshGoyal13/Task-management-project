import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Task } from "@shared/schema";
import { format, addDays } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, CalendarCheck, X, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task;
}

// Extend the form schema to include validation
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().optional(),
  dueDate: z.coerce.date({
    required_error: "Due date is required",
    invalid_type_error: "Due date must be a valid date",
  }),
  status: z.string().min(1, "Status is required"),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Please select a task priority",
  }).default("medium"),
  remarks: z.string().optional(),
  // We'll add these from the client side
  createdByName: z.string().optional(),
  lastUpdatedByName: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function TaskForm({ isOpen, onClose, taskToEdit }: TaskFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditMode = !!taskToEdit;

  // Helper function to get task priority from task data
  const getTaskPriority = (task?: Task): "low" | "medium" | "high" => {
    // In a real application, this would come from the task data
    // For now, we'll use a simple logic based on due date proximity
    if (!task) return "medium";
    
    // Since we don't have a priority field in the current Task type
    // We'll derive it from the due date as a placeholder
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "high"; // Overdue
    if (diffDays < 3) return "high"; // Due soon
    if (diffDays < 7) return "medium"; // Due this week
    return "low"; // Due later
  };

  // Set default values for the form
  const defaultValues: TaskFormValues = {
    title: taskToEdit?.title || "",
    description: taskToEdit?.description || "",
    dueDate: taskToEdit ? new Date(taskToEdit.dueDate) : new Date(),
    status: taskToEdit?.status || "not-started",
    priority: getTaskPriority(taskToEdit),
    remarks: taskToEdit?.remarks || "",
    createdByName: "John Doe", // Default user, in a real app this would come from auth context
    lastUpdatedByName: "John Doe", // Default user
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormValues) => {
      // Format the date as an ISO string for the server
      const dueDateObj = new Date(data.dueDate);
      return apiRequest('POST', '/api/tasks', {
        ...data,
        dueDate: dueDateObj,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task created",
        description: "Task has been successfully created.",
      });
      form.reset(defaultValues);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: TaskFormValues) => {
      // Format the date as an ISO string for the server
      const dueDateObj = new Date(data.dueDate);
      return apiRequest('PATCH', `/api/tasks/${taskToEdit?.id}`, {
        ...data,
        dueDate: dueDateObj,
        lastUpdatedByName: "John Doe", // Default user
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task updated",
        description: "Task has been successfully updated.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    if (isEditMode && taskToEdit) {
      updateTaskMutation.mutate(data);
    } else {
      createTaskMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "Create New Task"}</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter task title" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter task description" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "MMMM d, yyyy")
                            ) : (
                              <span>Select a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                          <div className="p-3 border-t border-border flex justify-between">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => field.onChange(new Date())}
                            >
                              Today
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => field.onChange(addDays(new Date(), 1))}
                            >
                              Tomorrow
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => field.onChange(addDays(new Date(), 7))}
                            >
                              Next week
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes" 
                      rows={2} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              >
                {(createTaskMutation.isPending || updateTaskMutation.isPending) 
                  ? "Saving..." 
                  : "Save Task"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
