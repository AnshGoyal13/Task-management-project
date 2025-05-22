import { useState } from 'react';
import { Task } from '@shared/schema';
import { format, differenceInDays } from 'date-fns';
import { Edit, Trash2, CheckCircle, Calendar, Clock, MessageSquare } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'bg-secondary bg-opacity-10 text-secondary';
      case 'in-progress':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'completed':
        return 'bg-success bg-opacity-10 text-success';
      default:
        return 'bg-destructive bg-opacity-10 text-destructive';
    }
  };

  const getStatusIndicatorClass = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'status-indicator status-not-started';
      case 'in-progress':
        return 'status-indicator status-in-progress';
      case 'completed':
        return 'status-indicator status-completed';
      default:
        return 'status-indicator status-overdue';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'Not Started';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Overdue';
    }
  };

  const isOverdue = () => {
    if (task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  };

  const getDueDateInfo = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    const dayDiff = differenceInDays(dueDate, today);
    
    if (dayDiff < 0) {
      return {
        text: `${Math.abs(dayDiff)} days overdue`,
        status: 'overdue'
      };
    } else if (dayDiff === 0) {
      return {
        text: 'Due today',
        status: 'today'
      };
    } else if (dayDiff === 1) {
      return {
        text: 'Due tomorrow',
        status: 'upcoming'
      };
    } else if (dayDiff < 7) {
      return {
        text: `Due in ${dayDiff} days`,
        status: 'upcoming'
      };
    } else {
      return {
        text: format(dueDate, 'MMM dd, yyyy'),
        status: 'normal'
      };
    }
  };

  const formattedDueDate = () => {
    return format(new Date(task.dueDate), 'MMM dd, yyyy');
  };
  
  const formattedCreatedDate = () => {
    return format(new Date(task.createdOn), 'MMMM dd, yyyy');
  };

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => apiRequest('PATCH', `/api/tasks/${task.id}`, {
      status: newStatus
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Status updated",
        description: "Task status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update task status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/tasks/${task.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task deleted",
        description: "Task has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };
  
  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus);
  };

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-md overflow-hidden fade-in hover:shadow-lg transition-all duration-200 ${isOverdue() && task.status !== 'completed' ? 'border-l-4 border-destructive' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{task.title}</h3>
            <div className="flex">
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(task.status)}`}>
                <span className={getStatusIndicatorClass(task.status)}></span>
                {getStatusLabel(task.status)}
              </div>
            </div>
          </div>
          
          <p className={`text-gray-600 text-sm mb-3 ${isExpanded ? '' : 'line-clamp-2'}`}>
            {task.description || "No description provided."}
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            <div className={`flex items-center ${isOverdue() ? 'text-destructive' : 'text-gray-500'}`}>
              <Calendar className="h-4 w-4 mr-1" />
              <span>{getDueDateInfo().text}</span>
            </div>
            
            {isExpanded && task.remarks && (
              <div className="flex items-center text-gray-500">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>{task.remarks}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <div>Created by {task.createdByName}</div>
            <div>{formattedCreatedDate()}</div>
          </div>
          
          <div className="flex space-x-1">
            {/* Quick status change buttons */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className={`p-1 hover:bg-gray-200 rounded ${task.status !== 'completed' ? 'visible' : 'hidden'}`} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange('completed');
                    }}
                  >
                    <CheckCircle className="text-success h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as Completed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-1 hover:bg-gray-200 rounded" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                  >
                    <Edit className="text-gray-600 h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Task</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-1 hover:bg-gray-200 rounded" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="text-gray-600 h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Task</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
