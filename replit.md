# Overview

This is a modern helpdesk ticket management system built as a full-stack web application. The system allows users to create, manage, and track IT support tickets with role-based access control. It features a React frontend with shadcn/ui components, an Express.js backend API, PostgreSQL database with Drizzle ORM, and integrated email notifications. The application supports both employee and admin user roles, with admins having additional capabilities for ticket assignment and team management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side is built with React and TypeScript, utilizing modern development practices:

- **UI Framework**: React with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized production builds

The frontend follows a modular component structure with reusable UI components, custom hooks for authentication and data fetching, and page-based routing. The application is responsive and includes proper loading states and error handling.

## Backend Architecture

The server-side uses Express.js with TypeScript in a RESTful API pattern:

- **Framework**: Express.js with middleware for logging, error handling, and request parsing
- **Authentication**: OpenID Connect (OIDC) integration with Replit Auth using Passport.js
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints for tickets, users, comments, and authentication
- **Email Service**: Nodemailer integration for automated notifications

The backend implements role-based access control, with different permissions for employees and administrators. It includes comprehensive error handling and request validation using Zod schemas.

## Data Storage Architecture

The application uses PostgreSQL as the primary database with Drizzle ORM:

- **Database**: PostgreSQL with Neon serverless integration
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Design**: Normalized tables for users, tickets, comments, and sessions
- **Migrations**: Drizzle Kit for database schema management
- **Connection Pooling**: Neon serverless connection pooling for scalability

The database schema includes proper relationships, indexes, and constraints. It supports ticket lifecycle management with status tracking, priority levels, and category classification.

## Authentication and Authorization

The system implements secure authentication using industry standards:

- **Identity Provider**: Replit OIDC integration for seamless authentication
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session storage
- **Authorization**: Role-based access control (employee/admin roles)
- **Security**: CSRF protection, secure session configuration, and proper error handling

Users are automatically provisioned on first login with default employee role. Admins can manage user roles and access team management features.

# External Dependencies

## Third-Party Services

- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Replit Authentication**: OIDC provider for user authentication and identity management
- **Email Service**: SMTP integration (configurable with Gmail or custom SMTP servers)

## Key Libraries and Frameworks

- **Frontend**: React, Vite, TanStack Query, Wouter, React Hook Form, Zod validation
- **UI Components**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Backend**: Express.js, Passport.js, Drizzle ORM, Nodemailer
- **Database**: PostgreSQL driver (@neondatabase/serverless), connect-pg-simple for sessions
- **Development**: TypeScript, ESBuild for production builds, TSX for development server

## Development and Build Tools

- **Build System**: Vite with React plugin and custom runtime error overlay
- **TypeScript**: Full type safety across frontend, backend, and shared schemas
- **Code Quality**: Consistent import paths and module resolution
- **Development Experience**: Hot module replacement, error boundaries, and comprehensive logging