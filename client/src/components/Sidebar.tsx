import { useState } from 'react';
import { 
  List, 
  CalendarCheck, 
  Calendar, 
  AlertTriangle, 
  Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  onFilterChange: (filter: string) => void;
  onStatusFilterChange: (status: string) => void;
  onCreateTask: () => void;
  activeFilter: string;
  activeStatusFilter: string;
  taskCounts: {
    all: number;
    today: number;
    upcoming: number;
    overdue: number;
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  className?: string;
}

export default function Sidebar({ 
  onFilterChange, 
  onStatusFilterChange, 
  onCreateTask, 
  activeFilter,
  activeStatusFilter,
  taskCounts,
  className = "" 
}: SidebarProps) {
  
  const getFilterButtonClasses = (filter: string) => {
    const baseClasses = "w-full text-left px-3 py-2 rounded-lg flex items-center";
    return filter === activeFilter 
      ? `${baseClasses} bg-primary bg-opacity-10 text-primary font-medium`
      : `${baseClasses} hover:bg-gray-100`;
  };

  const getStatusButtonClasses = (status: string) => {
    const baseClasses = "w-full text-left px-3 py-2 rounded-lg flex items-center";
    return status === activeStatusFilter
      ? `${baseClasses} bg-primary bg-opacity-10 text-primary font-medium`
      : `${baseClasses} hover:bg-gray-100`;
  };

  return (
    <aside className={`w-64 bg-white shadow-sm border-r border-gray-200 ${className}`}>
      <div className="p-4">
        <div className="mb-6">
          <Button onClick={onCreateTask} className="w-full bg-primary hover:bg-primary-dark">
            <Plus className="mr-1 h-4 w-4" />
            Create Task
          </Button>
        </div>

        <div className="mb-6">
          <h3 className="text-xs uppercase font-semibold text-gray-500 mb-2">Filters</h3>
          <div className="space-y-2">
            <button 
              className={getFilterButtonClasses('all')}
              onClick={() => onFilterChange('all')}
            >
              <List className="mr-2 h-4 w-4" />
              All Tasks
              {taskCounts.all > 0 && (
                <span className="ml-auto bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                  {taskCounts.all}
                </span>
              )}
            </button>
            <button 
              className={getFilterButtonClasses('today')}
              onClick={() => onFilterChange('today')}
            >
              <CalendarCheck className="mr-2 h-4 w-4" />
              Due Today
              {taskCounts.today > 0 && (
                <span className="ml-auto bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                  {taskCounts.today}
                </span>
              )}
            </button>
            <button 
              className={getFilterButtonClasses('upcoming')}
              onClick={() => onFilterChange('upcoming')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Upcoming
              {taskCounts.upcoming > 0 && (
                <span className="ml-auto bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                  {taskCounts.upcoming}
                </span>
              )}
            </button>
            <button 
              className={getFilterButtonClasses('overdue')}
              onClick={() => onFilterChange('overdue')}
            >
              <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
              Overdue
              {taskCounts.overdue > 0 && (
                <span className="ml-auto bg-destructive bg-opacity-10 text-destructive text-xs rounded-full px-2 py-0.5">
                  {taskCounts.overdue}
                </span>
              )}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase font-semibold text-gray-500 mb-2">Status</h3>
          <div className="space-y-2">
            <button 
              className={getStatusButtonClasses('not-started')}
              onClick={() => onStatusFilterChange('not-started')}
            >
              <span className="status-indicator status-not-started"></span>
              Not Started
              {taskCounts.notStarted > 0 && (
                <span className="ml-auto bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                  {taskCounts.notStarted}
                </span>
              )}
            </button>
            <button 
              className={getStatusButtonClasses('in-progress')}
              onClick={() => onStatusFilterChange('in-progress')}
            >
              <span className="status-indicator status-in-progress"></span>
              In Progress
              {taskCounts.inProgress > 0 && (
                <span className="ml-auto bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                  {taskCounts.inProgress}
                </span>
              )}
            </button>
            <button 
              className={getStatusButtonClasses('completed')}
              onClick={() => onStatusFilterChange('completed')}
            >
              <span className="status-indicator status-completed"></span>
              Completed
              {taskCounts.completed > 0 && (
                <span className="ml-auto bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                  {taskCounts.completed}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
