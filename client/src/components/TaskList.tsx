import { useState, useEffect } from 'react';
import { Task } from '@shared/schema';
import TaskCard from '@/components/TaskCard';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskListProps {
  tasks: Task[] | undefined;
  isLoading: boolean;
  title: string;
  count: number;
  onSortChange: (sortBy: string) => void;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

export default function TaskList({ 
  tasks, 
  isLoading, 
  title, 
  count, 
  onSortChange, 
  onCreateTask,
  onEditTask 
}: TaskListProps) {
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    onSortChange(value);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            <Skeleton className="h-8 w-32" />
          </h2>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-1/3 mt-4" />
              </div>
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                <Skeleton className="h-8 w-1/2" />
                <div className="flex space-x-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render empty state
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-24 h-24 mb-4 flex items-center justify-center rounded-full bg-gray-100">
          <FileText className="text-gray-400 h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
        <p className="text-gray-500 mb-4">Create a new task or change your filters to see results.</p>
        <Button 
          onClick={onCreateTask}
          className="bg-primary hover:bg-primary-dark"
        >
          Create Task
        </Button>
      </div>
    );
  }

  // Render task list
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {title} <span className="text-sm text-gray-500 font-normal">({count})</span>
        </h2>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">Sort by:</div>
          <Select onValueChange={handleSortChange} defaultValue="due-date">
            <SelectTrigger className="text-sm border-gray-300 rounded-md h-8 w-36">
              <SelectValue placeholder="Due Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due-date">Due Date</SelectItem>
              <SelectItem value="created-date">Created Date</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onEdit={onEditTask}
          />
        ))}
      </div>
    </div>
  );
}
