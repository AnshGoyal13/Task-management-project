import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import SearchBar from './SearchBar';
import { CheckSquare, Mail, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Task } from '@shared/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onSearch: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch all tasks for export
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    queryFn: () => 
      fetch('/api/tasks')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch tasks');
          return res.json();
        }),
  });
  
  // Function to export tasks as CSV
  const exportTasksAsCSV = () => {
    if (!tasks || tasks.length === 0) {
      toast({
        title: "No tasks to export",
        description: "Create some tasks first before exporting.",
        variant: "destructive",
      });
      return;
    }
    
    // Create CSV header row
    const csvHeader = 'Title,Description,Due Date,Status,Remarks,Created By,Created On\n';
    
    // Convert tasks to CSV rows
    const csvRows = tasks.map((task: Task) => {
      const formattedDate = format(new Date(task.dueDate), 'yyyy-MM-dd');
      const formattedCreatedDate = format(new Date(task.createdOn), 'yyyy-MM-dd');
      
      // Escape any commas in text fields
      const title = `"${task.title?.replace(/"/g, '""') || ''}"`;
      const description = `"${task.description?.replace(/"/g, '""') || ''}"`;
      const remarks = `"${task.remarks?.replace(/"/g, '""') || ''}"`;
      const createdByName = `"${task.createdByName?.replace(/"/g, '""') || ''}"`;
      
      return `${title},${description},${formattedDate},${task.status},${remarks},${createdByName},${formattedCreatedDate}`;
    }).join('\n');
    
    // Combine header and rows
    const csvContent = csvHeader + csvRows;
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set up and trigger download - save to the exports/csv folder
    link.setAttribute('href', url);
    link.setAttribute('download', `exports/csv/taskmaster_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: "Your tasks have been exported to CSV. You can now attach this file to an email.",
    });
  };
  
  // Function to export tasks directly to Gmail
  const exportToGmail = () => {
    if (!tasks || tasks.length === 0) {
      toast({
        title: "No tasks to export",
        description: "Create some tasks first before exporting.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a simple HTML table with the tasks
    let emailBody = '<h2>TaskMaster - Task Export</h2>';
    emailBody += '<table border="1" cellpadding="5" style="border-collapse: collapse;">';
    emailBody += '<tr style="background-color: #f2f2f2;"><th>Title</th><th>Description</th><th>Due Date</th><th>Status</th><th>Remarks</th></tr>';
    
    tasks.forEach((task: Task) => {
      const formattedDate = format(new Date(task.dueDate), 'MMM dd, yyyy');
      const statusClass = task.status === 'completed' ? 'color: green;' :
                        task.status === 'in-progress' ? 'color: orange;' : '';
      
      emailBody += `<tr>
        <td><strong>${task.title || ''}</strong></td>
        <td>${task.description || ''}</td>
        <td>${formattedDate}</td>
        <td style="${statusClass}">${task.status || ''}</td>
        <td>${task.remarks || ''}</td>
      </tr>`;
    });
    
    emailBody += '</table>';
    emailBody += '<p>Exported from TaskMaster on ' + format(new Date(), 'MMMM dd, yyyy') + '</p>';
    
    // Encode for URL
    const subject = encodeURIComponent('TaskMaster - Task Export');
    const body = encodeURIComponent(emailBody);
    
    // Open Gmail compose in new tab with pre-filled content
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}&ui=2&tf=1`, '_blank');
    
    toast({
      title: "Opening Gmail",
      description: "Gmail compose window should open with your tasks. You may need to allow pop-ups.",
    });
  };
  
  return (
    <header className="bg-white shadow">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center">
          <CheckSquare className="text-primary mr-2 h-6 w-6" />
          <h1 className="text-xl font-semibold">TaskMaster</h1>
        </div>
        <div className="flex items-center">
          <div className="hidden md:block relative mr-4">
            <SearchBar onSearch={onSearch} className="w-64" />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="mr-3">
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={exportTasksAsCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Download as CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToGmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Send to Gmail</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2 hidden sm:block">Ansh Goyal</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">AG</div>
          </div>
        </div>
      </div>
    </header>
  );
}
