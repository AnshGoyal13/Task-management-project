import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("not-started"),
  remarks: text("remarks"),
  createdOn: timestamp("created_on").notNull().defaultNow(),
  lastUpdatedOn: timestamp("last_updated_on").notNull().defaultNow(),
  createdById: integer("created_by_id"),
  createdByName: varchar("created_by_name", { length: 255 }).default("System User"),
  lastUpdatedById: integer("last_updated_by_id"),
  lastUpdatedByName: varchar("last_updated_by_name", { length: 255 }).default("System User"),
});

// Create and modify the insert schema to handle date validation better
export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ 
    id: true,
    createdOn: true, 
    lastUpdatedOn: true,
  })
  .extend({
    // Override the dueDate validation to handle both Date objects and ISO strings
    dueDate: z.union([
      z.date(),
      z.string().refine(val => !isNaN(new Date(val).getTime()), {
        message: "Invalid date format"
      }).transform(val => new Date(val))
    ])
  });

export const updateTaskSchema = createInsertSchema(tasks)
  .omit({ 
    id: true,
    createdOn: true,
    createdById: true,
    createdByName: true,
  })
  .extend({
    // Override the dueDate validation to handle both Date objects and ISO strings
    dueDate: z.union([
      z.date(),
      z.string().refine(val => !isNaN(new Date(val).getTime()), {
        message: "Invalid date format"
      }).transform(val => new Date(val))
    ])
  });
  
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;
