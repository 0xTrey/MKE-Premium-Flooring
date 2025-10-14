# P&E Premium Flooring Website

## Overview
A professional single-page website for P&E Premium Flooring, a Milwaukee Metro area flooring contractor specializing in LVP, tile, hardwood, and countertop installation.

## Purpose
- Establish credibility and professional online presence
- Generate leads through calls and contact form submissions
- Showcase 10+ years of experience and recent project work
- Target construction companies and homeowners in Milwaukee Metro

## Current State
Production-ready single-page application with:
- Beautiful hero section with professional imagery
- About section highlighting 10+ years experience and key services
- Services grid with expandable pricing details and service specifications
- Before/After section with 3 interactive image comparison sliders
- Database-driven gallery with 19 real project photos (8 at a time with carousel)
- Working contact form with PostgreSQL persistence
- Mobile-responsive design with floating call button
- SEO-optimized with proper meta tags and Open Graph

## Recent Changes (October 14, 2025)
- **Database Persistence**: Migrated from in-memory to PostgreSQL storage for contact submissions
- **Service Pricing Details**: Added expandable accordion with detailed service information and pricing guides for all 5 services
- **Before/After Sliders**: Implemented interactive image comparison sliders using custom clip-path solution for project showcases
- **Real Project Photos**: Updated bathroom tile installation slider with actual project before/after photos
- **Database-Driven Gallery**: Replaced all stock images with 19 real project photos stored in PostgreSQL
- **Gallery Carousel**: Implemented 8-photo carousel with "See More" button that rotates through all photos
- **Facebook URL**: Updated to actual company profile (https://www.facebook.com/profile.php?id=100092361378518)
- All features tested and architect-approved

## Project Architecture

### Frontend
- **Framework**: React with Vite
- **Routing**: Wouter (single route: "/")
- **Styling**: Tailwind CSS with Shadcn UI components
- **Typography**: Montserrat (headings) and Open Sans (body)
- **Color Palette**: 
  - Deep Navy (220 45% 25%) - Primary brand color
  - Amber/Gold (35 85% 50%) - CTA buttons and accents
  - Warm Gray (30 8% 35%) - Secondary text

### Backend
- **Server**: Express.js
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Storage**: DatabaseStorage implementation
- **Validation**: Zod schemas
- **API Endpoints**:
  - POST /api/contact - Submit contact form (persists to database)
  - GET /api/contact - Retrieve submissions (admin use)
  - GET /api/photos - Fetch all gallery photos ordered by display order

### Data Model
```typescript
ContactSubmission {
  id: string (UUID)
  name: string (min 2 chars)
  phone: string (min 10 chars)
  email: string (valid email)
  projectType: string (min 5 chars)
  location: string (min 3 chars)
  createdAt: Date
}

Photo {
  id: string (UUID)
  filename: string
  category: string
  description: string
  displayOrder: integer
  createdAt: Date
}
```

## Key Features

### Contact Information
- **Phone**: (414) 275-1889 (click-to-call throughout)
- **Email**: Pepremiumflooring@gmail.com (click-to-email)
- **Service Area**: Milwaukee Metro Area
- **Facebook**: Link to company Facebook page

### Services Offered
1. Luxury Vinyl Plank (LVP) installation
2. Tile flooring installation
3. Hardwood flooring installation
4. Countertop installation
5. Bathroom and kitchen tile installation

### User Experience
- Smooth scroll navigation to sections
- Mobile floating call button (< 768px viewports)
- Form validation with helpful error messages
- Success/error toast notifications
- Gallery carousel with 8 photos at a time
- "See More" button rotates through all 19 project photos
- Photo count indicator shows current position (e.g., "Showing 1-8 of 19")
- Gallery hover effects with category labels
- Responsive across all devices

## SEO Keywords
Milwaukee Flooring Contractor, Tile Installation Milwaukee, Hardwood Floor Installation, LVP Flooring Expert, Kitchen Tile Installation, Bathroom Remodeling Milwaukee, Countertop Installation, Affordable Flooring Milwaukee, Professional Floor Installers

## Completed Enhancements
1. ✅ **Database Persistence**: Contact submissions now saved to PostgreSQL
2. ✅ **Service Pricing**: Expandable accordion with detailed pricing guides
3. ✅ **Before/After Sliders**: Interactive image comparison showcases
4. ✅ **Database-Driven Gallery**: 19 real project photos with carousel functionality

## Future Enhancements
1. **Facebook Integration**: Dynamic photo feed from Facebook album (requires API credentials)
2. **Google Reviews**: Embed customer testimonials and ratings (requires Google API setup)
3. **Email Notifications**: Send email alerts on form submissions (requires email service)
4. **CRM Integration**: Connect to customer management system
5. **Analytics**: Track CTA clicks and conversion metrics

## Technical Stack
- **Languages**: TypeScript, HTML, CSS
- **Frontend**: React, Wouter, TanStack Query, React Hook Form
- **Backend**: Express, Drizzle ORM schemas, Zod
- **UI Components**: Shadcn UI, Lucide Icons
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite

## Project Structure
```
client/
  src/
    components/
      Header.tsx - Sticky header with logo, phone, CTA
      Hero.tsx - Full-width hero with background image
      About.tsx - Experience and stats section
      Services.tsx - Service cards with expandable pricing accordions
      BeforeAfter.tsx - Interactive before/after comparison sliders
      Gallery.tsx - 12 project images
      Contact.tsx - Form with validation and database persistence
      Footer.tsx - Links and social media
      MobileCallButton.tsx - Floating mobile CTA
    pages/
      home.tsx - Main single-page layout with all sections
      not-found.tsx - 404 page
server/
  db.ts - PostgreSQL database connection (Neon + Drizzle)
  routes.ts - API endpoints
  storage.ts - DatabaseStorage implementation
shared/
  schema.ts - Drizzle schema, TypeScript types, Zod validation
```

## Running the Application
- **Development**: `npm run dev` (port 5000)
- **Workflow**: "Start application" is configured to run automatically

## Design Guidelines
See `design_guidelines.md` for comprehensive design system documentation including:
- Color palette and usage
- Typography scale and fonts
- Component spacing and layout
- Button and card styling
- Responsive breakpoints
- Trust signals and credibility elements
