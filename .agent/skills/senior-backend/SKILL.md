---
name: senior-backend
description: Comprehensive backend development skill for building scalable, secure backend systems using Node.js, Next.js API routes, and PostgreSQL (via Prisma). Use when designing APIs, optimizing database queries, implementing business logic, handling authentication, or reviewing backend code.
---

# Senior Backend Toolkit

## Tech Stack Focus

**Core:** TypeScript, Node.js
**Framework:** Next.js (API Routes / Server Actions)
**Database:** PostgreSQL, Prisma ORM, NeonDB

## Best Practices Summary

### Code Quality & Architecture

- Follow modular and cleanly separated REST/Server Action patterns.
- Write strict TypeScript. Avoid `any`. Define clear interfaces for all requests and responses.
- Centralize error handling and always return consistent HTTP status codes.

### Database Optimization (Prisma/Postgres)

- Never use `SELECT *` (or Prisma's equivalent of pulling all fields unecessarily). Use `select` to only fetch required columns.
- Ensure proper indexing on frequently queried columns or foreign keys.
- Handle database connections efficiently, keeping serverless cold starts and connection limits in mind.

### Security

- Validate all incoming API inputs using standard parsing libraries (like Zod) before processing.
- Ensure proper authentication and role-based authorization at the route level.
- Never expose sensitive database IDs or internal error messages to the client.

### Maintainability

- Keep API routes and server actions focused on a single responsibility.
- Extract complex business logic into separate utility functions or service layers.
- Write self-documenting code with clear variable and function names.
