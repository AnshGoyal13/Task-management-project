import { useState } from 'react';
import { Task } from '@shared/schema';
import { format } from 'date-fns';
import { Edit, Trash2 } from 'lucide-react';
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

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const formattedDueDate = () => {
    return format(new Date(task.dueDate), 'MMM dd, yyyy');
  };
  
  const formattedCreatedDate = () => {
    return format(new Date(task.createdOn), 'MMMM dd, yyyy');
  };

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

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden fade-in">
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
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
          <div className={`flex items-center text-sm ${isOverdue() ? 'text-destructive' : 'text-gray-500'}`}>
            <span className="material-icons text-sm mr-1">event</span>
            <span>{formattedDueDate()}</span>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <div>Created by {task.createdByName}</div>
            <div>{formattedCreatedDate()}</div>
          </div>
          <div className="flex space-x-1">
            <button 
              className="p-1 hover:bg-gray-200 rounded" 
              onClick={() => onEdit(task)}
              title="Edit Task"
            >
              <Edit className="text-gray-600 h-5 w-5" />
            </button>
            <button 
              className="p-1 hover:bg-gray-200 rounded" 
              onClick={() => setIsDeleteDialogOpen(true)}
              title="Delete Task"
            >
              <Trash2 className="text-gray-600 h-5 w-5" />
            </button>
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
