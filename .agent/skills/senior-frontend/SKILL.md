---
name: senior-frontend
description: Expert frontend development skill for building high-performance web applications using React, Next.js (App Router), TypeScript, and Tailwind CSS. Use when creating UI components, optimizing page speed, implementing responsive designs, or managing client-side state.
---

# Senior Frontend Toolkit

## Core Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (Strict Type Safety)
- **Styling:** Tailwind CSS & daisyUI
- **State/Data:** React Hooks & Server Actions

## UI & Component Standards

### 1. Component Architecture

- **Server First:** Default to React Server Components (RSC) to minimize client-side JavaScript.
- **Client Components:** Use `'use client'` only when interaction (state, effects) is strictly required.
- **Atomic Design:** Keep components small, reusable, and focused on a single responsibility.

### 2. Styling & Layout

- Use **Tailwind CSS** utility classes for all styling.
- Prioritize **Flexbox and CSS Grid** for layouts.
- Ensure all designs are mobile-first and fully responsive.
- Use **daisyUI** components for consistent, accessible UI elements.

### 3. Performance & Optimization

- **Image Optimization:** Always use the Next.js `<Image />` component for automatic resizing and lazy loading.
- **Fonts:** Use `next/font` to optimize Google Fonts and prevent Layout Shift (CLS).
- **Bundle Size:** Avoid importing large libraries if a lightweight alternative or native browser API exists.

## Development Workflow

### Best Practices Summary

- **Type Safety:** Define strict interfaces for all component props and API responses. No `any`.
- **Clean Code:** Use descriptive naming for variables and functions (e.g., `isVisitorAuthorized` instead of `check`).
- **Accessibility (A11y):** Use semantic HTML tags (`<header>`, `<main>`, `<button>`) and ensure proper ARIA labels where needed.
- **Maintainability:** Keep business logic outside of the JSX. Use custom hooks for complex logic.

## Common Next.js Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting checks
npm run lint

# Check TypeScript types
npx tsc --noEmit
```
