import { users, type User, type InsertUser, tasks, type Task, type InsertTask, type UpdateTask } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, or, desc, asc, sql, lt, gte } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task Operations
  createTask(task: InsertTask): Promise<Task>;
  getAllTasks(): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  updateTask(id: number, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  searchTasks(query: string): Promise<Task[]>;
  getTasksByStatus(status: string): Promise<Task[]>;
  getOverdueTasks(): Promise<Task[]>;
  getTasksDueToday(): Promise<Task[]>;
  getUpcomingTasks(): Promise<Task[]>;
  sortTasks(field: string, order: 'asc' | 'desc'): Promise<Task[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Task methods
  async createTask(task: InsertTask): Promise<Task> {
    // Set the lastUpdatedOn to the same as createdOn for new tasks
    const [createdTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return createdTask;
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdOn));
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async updateTask(id: number, taskUpdate: UpdateTask): Promise<Task | undefined> {
    // Ensure lastUpdatedOn is set to now
    const updateData = {
      ...taskUpdate,
      lastUpdatedOn: new Date(),
    };

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    
    return updatedTask || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });
    
    return result.length > 0;
  }

  async searchTasks(query: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        or(
          ilike(tasks.title, `%${query}%`),
          ilike(tasks.description, `%${query}%`),
          ilike(tasks.remarks, `%${query}%`)
        )
      )
      .orderBy(desc(tasks.createdOn));
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.status, status))
      .orderBy(desc(tasks.createdOn));
  }

  async getOverdueTasks(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await db
      .select()
      .from(tasks)
      .where(
        and(
          lt(tasks.dueDate, today),
          sql`${tasks.status} != 'completed'`
        )
      )
      .orderBy(asc(tasks.dueDate));
  }

  async getTasksDueToday(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(tasks)
      .where(
        and(
          gte(tasks.dueDate, today),
          lt(tasks.dueDate, tomorrow)
        )
      )
      .orderBy(asc(tasks.dueDate));
  }

  async getUpcomingTasks(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return await db
      .select()
      .from(tasks)
      .where(
        and(
          gte(tasks.dueDate, today),
          lt(tasks.dueDate, nextWeek),
          sql`${tasks.status} != 'completed'`
        )
      )
      .orderBy(asc(tasks.dueDate));
  }

  async sortTasks(field: string, order: 'asc' | 'desc'): Promise<Task[]> {
    let orderFn = order === 'asc' ? asc : desc;
    let orderField;

    switch (field) {
      case 'due-date':
        orderField = tasks.dueDate;
        break;
      case 'created-date':
        orderField = tasks.createdOn;
        break;
      case 'status':
        orderField = tasks.status;
        break;
      case 'title':
        orderField = tasks.title;
        break;
      default:
        orderField = tasks.createdOn;
    }

    return await db
      .select()
      .from(tasks)
      .orderBy(orderFn(orderField));
  }
}

export const storage = new DatabaseStorage();
