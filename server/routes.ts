import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { insertTaskSchema, updateTaskSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Tasks CRUD endpoints
  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const result = await storage.createTask(taskData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      let tasks;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';
      const status = req.query.status as string;
      const filter = req.query.filter as string;
      const search = req.query.search as string;

      // First get the base set of tasks
      if (status) {
        // If status filter is applied, start with status-filtered tasks
        console.log(`Filtering tasks by status: ${status}`);
        tasks = await storage.getTasksByStatus(status);
      } else if (filter) {
        // If date filter is applied, start with date-filtered tasks
        switch (filter) {
          case 'today':
            tasks = await storage.getTasksDueToday();
            break;
          case 'upcoming':
            tasks = await storage.getUpcomingTasks();
            break;
          case 'overdue':
            tasks = await storage.getOverdueTasks();
            break;
          default:
            tasks = await storage.getAllTasks();
        }
      } else {
        // Otherwise get all tasks
        tasks = await storage.getAllTasks();
      }
      
      // Then apply search filter if present
      if (search && tasks.length > 0) {
        const searchTasks = await storage.searchTasks(search);
        // Intersection of tasks and searchTasks
        tasks = tasks.filter(task => 
          searchTasks.some(searchTask => searchTask.id === task.id)
        );
      }

      // Finally, apply sorting if requested
      if (sortBy) {
        // Apply a local sort if we already have filtered data
        const sortField = sortBy === 'due-date' ? 'dueDate' : 
                         sortBy === 'created-date' ? 'createdOn' : 
                         sortBy === 'title' ? 'title' : 'status';
        
        tasks.sort((a: any, b: any) => {
          if (sortOrder === 'asc') {
            return a[sortField] > b[sortField] ? 1 : -1;
          } else {
            return a[sortField] < b[sortField] ? 1 : -1;
          }
        });
      }
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const taskData = updateTaskSchema.parse(req.body);
      const updatedTask = await storage.updateTask(id, taskData);

      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(updatedTask);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
