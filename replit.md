# P&E Premium Flooring Website

## Overview

P&E Premium Flooring is a single-page marketing website designed to establish credibility and generate leads for a Milwaukee Metro-based flooring installation company. The site showcases services including LVP, tile, hardwood flooring, and countertop installation, with a primary focus on converting visitors into phone calls and contact form submissions. The application emphasizes mobile responsiveness, visual appeal through a gallery of completed work, and clear calls-to-action throughout the user journey.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for client-side routing (lightweight alternative to React Router). The application currently implements a single-page design with smooth scrolling between sections.

**UI Component System**: Shadcn/ui components built on Radix UI primitives. This provides accessible, customizable components that follow a consistent design system. Components are located in `client/src/components/ui/` and include forms, buttons, cards, dialogs, and navigation elements.

**Styling**: Tailwind CSS with custom design tokens defined in CSS variables. The design follows a "New York" style variant from Shadcn with custom color palette including:
- Deep Navy Blue (primary brand color)
- Warm Gray (secondary)
- Amber/Gold accents
- Design guidelines reference professional home services sites like Houzz and Angi

**Typography**: Google Fonts integration using Montserrat for headings and Open Sans for body text, loaded via CDN in the HTML head.

**State Management**: TanStack Query (React Query) for server state management. Local component state managed with React hooks.

**Form Handling**: React Hook Form with Zod validation for type-safe form submissions. The contact form validates all fields client-side before submission.

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript support via tsx in development.

**API Design**: RESTful API endpoints under `/api` prefix:
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Retrieve contact submissions (for admin purposes)

**Validation**: Zod schemas shared between client and server via the `shared/` directory, ensuring type safety across the full stack.

**Development Server**: Custom Vite middleware integration for HMR (Hot Module Replacement) in development. Production serves pre-built static assets from `dist/public`.

**Build Process**: 
- Frontend: Vite builds React application to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js` as ESM

### Data Storage

**Current Implementation**: In-memory storage using a Map-based implementation (`MemStorage` class). Contact submissions are stored temporarily in application memory.

**Database Schema**: Drizzle ORM schema defined for PostgreSQL in `shared/schema.ts` with a `contact_submissions` table containing:
- id (UUID primary key)
- name, phone, email, projectType, location (text fields)
- createdAt (timestamp)

**Migration Path**: The application is architected to swap the `MemStorage` implementation for a PostgreSQL-backed implementation using Drizzle ORM. The interface (`IStorage`) is already defined to support this transition.

**Database Configuration**: Drizzle Kit configured to use PostgreSQL dialect with migrations output to `./migrations` directory. Expects `DATABASE_URL` environment variable for connection.

### Design System & Theming

**CSS Architecture**: CSS custom properties for theme values with support for light/dark modes. Uses HSL color values with alpha channel support for dynamic opacity.

**Responsive Design**: Mobile-first approach with breakpoints:
- Mobile: < 768px
- Tablet/Desktop: ≥ 768px (md breakpoint)
- Large screens: ≥ 1024px (lg breakpoint)

**Interactive Elements**: 
- Hover/active states using elevation classes (`hover-elevate`, `active-elevate-2`)
- Smooth scrolling navigation between sections
- Sticky header with background blur on scroll
- Fixed mobile call button for quick access

## External Dependencies

### Third-Party Services

**Neon Database**: PostgreSQL-compatible serverless database provider. The application uses `@neondatabase/serverless` driver for database connectivity. Connection configured via `DATABASE_URL` environment variable.

**Facebook Integration**: Gallery images and social proof sourced from the business's Facebook page. The site includes links to the Facebook page for social engagement but doesn't implement Facebook SDK or API integration - it's reference-only.

### UI Component Libraries

**Radix UI**: Comprehensive set of accessible, unstyled React components serving as primitives for the custom UI system. Includes components for dialogs, dropdowns, popovers, tooltips, forms, and more.

**Shadcn/ui**: Component architecture pattern using Radix UI as foundation with Tailwind CSS styling. Components are copied into the project rather than imported as dependencies, allowing full customization.

### Form & Validation

**React Hook Form**: Form state management and validation orchestration with minimal re-renders.

**Zod**: TypeScript-first schema validation library. Schemas in `shared/schema.ts` are used for:
- Runtime validation of API inputs
- TypeScript type inference
- Client-side form validation via `@hookform/resolvers/zod`

**Drizzle-Zod**: Integration between Drizzle ORM and Zod, automatically generating Zod schemas from database table definitions.

### Utility Libraries

**clsx & tailwind-merge**: Class name composition utilities combined in the `cn()` helper function for conditional Tailwind classes.

**date-fns**: Date manipulation and formatting library.

**class-variance-authority**: Type-safe component variant API for creating component variations with Tailwind classes.

### Build & Development Tools

**Vite**: Fast frontend build tool and dev server with HMR support.

**esbuild**: Fast JavaScript bundler used for server-side code compilation.

**TypeScript**: Type safety across frontend, backend, and shared code.

**tsx**: TypeScript execution engine for running server code in development without pre-compilation.

### Development-Only Dependencies

**@replit/vite-plugin-runtime-error-modal**: Shows runtime errors in an overlay during development.

**@replit/vite-plugin-cartographer**: Replit-specific development tooling.

**@replit/vite-plugin-dev-banner**: Development environment banner.

### Assets Management

**Static Images**: Stock photography for gallery stored in `attached_assets/stock_images/` directory. Images are imported directly in components using Vite's asset handling.

### Session Management

**connect-pg-simple**: PostgreSQL session store for Express sessions (configured but may not be actively used in current implementation given the stateless API design).