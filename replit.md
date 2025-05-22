# TaskMaster App Guide

## Overview

This repository contains TaskMaster, a task management web application built with a modern tech stack. The application allows users to create, update, track, and filter tasks with a responsive UI that provides a smooth user experience.

Preferred communication style: Simple, everyday language.

## User Preferences

- **Code Structure**: Maintain the separation between client and server code
- **Styling**: Use the existing Tailwind CSS with shadcn/ui components
- **Data Flow**: Follow the established pattern of using React Query for data fetching
- **Error Handling**: Implement proper error handling with toast notifications
- **Code Quality**: Write clean, readable code with proper TypeScript types

## System Architecture

TaskMaster follows a modern full-stack architecture with a clear separation between client and server:

1. **Frontend**: React application using Vite as the build tool
   - Utilizes shadcn/ui components with Tailwind CSS for styling
   - Uses React Query for data fetching and state management
   - Implements client-side routing with Wouter

2. **Backend**: Express.js server
   - RESTful API endpoints for CRUD operations on tasks
   - Middleware for logging API requests
   - Integration with Drizzle ORM for database operations

3. **Database**: PostgreSQL (via Drizzle ORM)
   - Schema defines users and tasks tables
   - Uses Drizzle for type-safe query building and migrations

4. **Build & Deployment**:
   - Development mode combines Vite dev server with Express
   - Production build separates client assets (built with Vite) from server code

## Key Components

### Frontend Components

1. **Page Structure**:
   - `TasksPage`: Main page for task management
   - `Header`: App header with search functionality
   - `Sidebar`: Navigation with filters for task views
   - `TaskList`: Displays tasks in a grid layout
   - `TaskForm`: Modal form for creating/editing tasks
   - `TaskCard`: Individual task display component

2. **UI Components**:
   - Uses shadcn/ui component library
   - Customized with Tailwind CSS for consistent styling
   - Toast notifications for user feedback

3. **Data Management**:
   - React Query for server state management
   - Custom hooks for features like toast notifications and responsive design

### Backend Components

1. **API Routes**:
   - CRUD operations for tasks
   - Health check endpoint
   - Search and filtering capabilities

2. **Database Access Layer**:
   - `storage.ts`: Interface for database operations
   - Drizzle ORM configuration for type-safe queries

3. **Authentication** (partially implemented):
   - User schema defined but authentication flow needs completion

## Data Flow

1. **Task Creation**:
   - User inputs data in TaskForm
   - Form data validated with Zod schema
   - React Query mutation sends POST request to `/api/tasks`
   - Server validates input and creates task in database
   - UI updates with new task and shows success toast

2. **Task Retrieval & Filtering**:
   - UI provides filters for viewing tasks (Today, Upcoming, Overdue)
   - Status filters (Not Started, In Progress, Completed)
   - Search functionality for finding specific tasks
   - Sorting options for organizing task display
   - Filtered requests sent to appropriate API endpoints
   - Results rendered in TaskList component

3. **Task Updates & Deletion**:
   - Edit action opens TaskForm with pre-filled data
   - Delete action shows confirmation dialog
   - Mutations update server state and UI

## Database Schema

The application uses two main database tables:

1. **Users Table**:
   ```
   - id: serial (primary key)
   - username: text (unique)
   - password: text
   ```

2. **Tasks Table**:
   ```
   - id: serial (primary key)
   - title: varchar(255)
   - description: text
   - dueDate: timestamp
   - status: varchar(50) (default 'not-started')
   - remarks: text
   - createdOn: timestamp
   - lastUpdatedOn: timestamp
   - createdById: integer
   - createdByName: varchar(255)
   - lastUpdatedById: integer
   - lastUpdatedByName: varchar(255)
   ```

## External Dependencies

1. **UI & Styling**:
   - Tailwind CSS for utility-based styling
   - shadcn/ui for component library
   - Radix UI for accessible component primitives
   - Lucide React for icons

2. **State Management & Data Fetching**:
   - Tanstack React Query for server state management
   - Zod for validation schemas

3. **Database**:
   - Drizzle ORM for database operations
   - PostgreSQL for data storage
   - Drizzle Zod for schema validation integration

4. **Form Handling**:
   - React Hook Form for form state management
   - Hookform resolvers for validation integration

## Deployment Strategy

The application is configured for deployment on Replit with a clear build process:

1. **Development Mode**:
   - `npm run dev` runs the application in development mode
   - Uses Vite dev server with HMR for frontend
   - Concurrently runs Express server for API endpoints

2. **Production Build**:
   - `npm run build` creates optimized production assets
   - Vite builds the frontend into static assets
   - esbuild bundles the server code

3. **Production Runtime**:
   - `npm run start` runs the production build
   - Serves static assets and API endpoints
   - Environment variables differentiate between dev and prod

4. **Database Management**:
   - `npm run db:push` syncs the database schema with Drizzle models
   - Database provisioned through Replit's PostgreSQL integration

## Implementation Notes

1. **Authentication**: The system has user schema defined but needs full implementation of login/registration flow

2. **Error Handling**: The app uses toast notifications for user feedback and try/catch blocks for API errors

3. **Responsive Design**: UI adapts to mobile and desktop views with conditional rendering

4. **Accessibility**: Using Radix UI primitives provides good accessibility foundation

5. **Future Enhancements**:
   - Complete user authentication system
   - Add task assignment capabilities
   - Implement notifications for due tasks
   - Add data visualization for task completion statistics