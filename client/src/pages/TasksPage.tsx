import { useState, useEffect } from 'react';
import { Task } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useMobile } from '@/hooks/use-mobile';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare, Calendar, AlertTriangle } from 'lucide-react';

export default function TasksPage() {
  const { toast } = useToast();
  const isMobile = useMobile();
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('due-date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);

  // Construct query based on filters
  const queryParams = new URLSearchParams();
  
  if (activeFilter !== 'all') {
    queryParams.set('filter', activeFilter);
  }
  
  if (activeStatusFilter) {
    queryParams.set('status', activeStatusFilter);
  }
  
  if (searchQuery) {
    queryParams.set('search', searchQuery);
  }
  
  if (sortBy) {
    queryParams.set('sortBy', sortBy);
    queryParams.set('sortOrder', sortOrder);
  }

  // Fetch tasks with filters applied
  const { data: tasks, isLoading, isError, error } = useQuery<Task[]>({
    queryKey: ['/api/tasks', activeFilter, activeStatusFilter, searchQuery, sortBy, sortOrder],
    queryFn: () => 
      fetch(`/api/tasks?${queryParams.toString()}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch tasks');
          return res.json();
        }),
  });

  // Calculate task counts
  const taskCounts = {
    all: tasks?.length || 0,
    today: tasks?.filter(task => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    }).length || 0,
    upcoming: tasks?.filter(task => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate <= nextWeek && task.status !== 'completed';
    }).length || 0,
    overdue: tasks?.filter(task => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(task.dueDate);
      return dueDate < today && task.status !== 'completed';
    }).length || 0,
    notStarted: tasks?.filter(task => task.status === 'not-started').length || 0,
    inProgress: tasks?.filter(task => task.status === 'in-progress').length || 0,
    completed: tasks?.filter(task => task.status === 'completed').length || 0
  };

  // Filter title based on active filter
  const getFilterTitle = () => {
    switch (activeFilter) {
      case 'today':
        return 'Due Today';
      case 'upcoming':
        return 'Upcoming Tasks';
      case 'overdue':
        return 'Overdue Tasks';
      default:
        return activeStatusFilter ? `${activeStatusFilter.replace('-', ' ')} Tasks` : 'All Tasks';
    }
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setActiveStatusFilter('');
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setActiveStatusFilter(status);
    setActiveFilter('all');
  };

  // Handle sort change
  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      // Toggle order if clicking the same sort option
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle task creation
  const handleCreateTask = () => {
    setTaskToEdit(undefined);
    setIsTaskModalOpen(true);
  };

  // Handle task edit
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  // Show error toast if query fails
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={handleSearch} />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar for desktop */}
        <Sidebar 
          onFilterChange={handleFilterChange}
          onStatusFilterChange={handleStatusFilterChange}
          onCreateTask={handleCreateTask}
          activeFilter={activeFilter}
          activeStatusFilter={activeStatusFilter}
          taskCounts={taskCounts}
          className="hidden md:block"
        />
        
        {/* Main content area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
          {/* Mobile search and create button */}
          <div className="md:hidden mb-4">
            <div className="flex space-x-2">
              <SearchBar onSearch={handleSearch} className="flex-1" />
              <Button 
                onClick={handleCreateTask}
                size="icon"
                className="bg-primary hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mobile filter buttons */}
            <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
              <Button
                variant={activeFilter === 'all' ? 'secondary' : 'outline'} 
                size="sm"
                className="whitespace-nowrap"
                onClick={() => handleFilterChange('all')}
              >
                <CheckSquare className="mr-1 h-4 w-4" />
                All
              </Button>
              <Button
                variant={activeFilter === 'today' ? 'secondary' : 'outline'} 
                size="sm"
                className="whitespace-nowrap"
                onClick={() => handleFilterChange('today')}
              >
                <CheckSquare className="mr-1 h-4 w-4" />
                Today
              </Button>
              <Button
                variant={activeFilter === 'upcoming' ? 'secondary' : 'outline'} 
                size="sm"
                className="whitespace-nowrap"
                onClick={() => handleFilterChange('upcoming')}
              >
                <Calendar className="mr-1 h-4 w-4" />
                Upcoming
              </Button>
              <Button
                variant={activeFilter === 'overdue' ? 'secondary' : 'outline'} 
                size="sm"
                className="whitespace-nowrap"
                onClick={() => handleFilterChange('overdue')}
              >
                <AlertTriangle className="mr-1 h-4 w-4 text-destructive" />
                Overdue
              </Button>
            </div>
          </div>
          
          {/* Task list */}
          <TaskList 
            tasks={tasks}
            isLoading={isLoading}
            title={getFilterTitle()}
            count={tasks?.length || 0}
            onSortChange={handleSortChange}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
          />
        </div>
      </main>
      
      {/* Task form dialog */}
      <TaskForm 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
