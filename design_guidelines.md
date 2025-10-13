# P&E Premium Flooring - Design Guidelines

## Design Approach: Reference-Based (Home Services Industry)

**Primary References**: Houzz, Angi, professional contractor portfolios
**Design Philosophy**: Build trust through professional polish, showcase craftsmanship through visuals, make conversion paths obvious and friction-free

**Core Principles**:
- Credibility through visual quality and professional presentation
- Clear hierarchy guiding users to call or contact actions
- Milwaukee-local feel with professional contractor aesthetic
- Mobile-first for on-the-go homeowners and contractors

---

## Color Palette

### Primary Colors
- **Deep Navy Blue**: 220 45% 25% - Primary brand color for headers, CTAs, conveying trust and professionalism
- **Warm Gray**: 30 8% 35% - Secondary text, borders, subtle backgrounds
- **White/Off-White**: 0 0% 100% / 40 10% 98% - Clean backgrounds, breathing room

### Accent Colors
- **Amber/Gold**: 35 85% 50% - Sparingly for premium highlights, awards, certifications
- **Success Green**: 145 65% 45% - Call-to-action confirmation states

### Background Treatments
- Light sections: Off-white (40 10% 98%)
- Dark sections: Deep Navy (220 45% 25%) with white text for contrast
- Alternating section backgrounds for visual rhythm

---

## Typography

**Font Families** (Google Fonts):
- **Headings**: 'Montserrat' - Bold (700), SemiBold (600) - Modern, confident, professional
- **Body**: 'Open Sans' - Regular (400), Medium (500) - Highly readable, friendly
- **Accent/Numbers**: 'Montserrat' - For stats, phone numbers

**Type Scale**:
- Hero Headline: text-5xl lg:text-7xl, font-bold, leading-tight
- Section Headlines: text-3xl lg:text-5xl, font-semibold
- Subheadings: text-xl lg:text-2xl, font-medium
- Body Text: text-base lg:text-lg, leading-relaxed
- Small/Caption: text-sm, for disclaimers, footer

---

## Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-12
- Section spacing: py-16 to py-24 (desktop), py-12 to py-16 (mobile)
- Element gaps: gap-4, gap-6, gap-8

**Container Strategy**:
- Max-width wrapper: max-w-7xl mx-auto px-6 lg:px-8
- Content sections: Full-width with inner constraints
- Text content: max-w-3xl for readability

**Grid System**:
- Services grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Gallery: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Contact form: Single column, centered max-w-2xl

---

## Component Library

### Header/Navigation
- Sticky header with logo left, phone number center-right, CTA button far right
- Mobile: Hamburger menu, prominent phone button
- Background: white with subtle shadow on scroll
- Height: h-20

### Hero Section
- Full-width background image (flooring installation shot with shallow depth of field)
- Dark overlay (bg-black/50) for text contrast
- Centered content: Headline + subtext + dual CTAs (Call + Contact Form)
- Height: 85vh on desktop, 70vh on mobile
- Text: white with strong contrast

### About Section
- Two-column layout: Text left, stats/highlights right (or image)
- Background: Off-white
- Stats displayed as large numbers with Montserrat
- List items with checkmark icons

### Services Grid
- Card-based design with subtle hover lift effect
- Icon (from Heroicons) at top, service name, brief description
- 3 columns desktop, 2 tablet, 1 mobile
- Background: white cards on light gray section

### Gallery Section
- Masonry-style grid showcasing recent projects
- Image hover: Overlay with project type label
- Background: Deep navy with white heading
- Click to view larger (lightbox effect)

### Contact Section
- Split layout: Form left (max-w-xl), contact details + map placeholder right
- Form inputs: Rounded, border, focus:ring-2 ring-amber
- CTA button: Full-width primary button
- Background: white

### Footer
- Three-column: Company info, Quick links, Social + Contact
- Background: Deep navy (220 45% 25%)
- Text: white/gray-300
- Minimal height with copyright at bottom

---

## Button Styles

**Primary CTA** (Call buttons):
- Background: amber gradient (35 85% 50% to 30 80% 45%)
- Text: white, font-semibold
- Size: px-8 py-4, text-lg
- Rounded: rounded-lg
- Shadow: shadow-lg hover:shadow-xl

**Secondary CTA** (Contact Form):
- Background: white
- Text: Deep navy
- Border: 2px border-navy
- Size: px-8 py-4
- Rounded: rounded-lg

**Outline on Image** (Hero CTAs):
- Background: white/10 backdrop-blur-md
- Border: 2px border-white/30
- Text: white
- No hover interactions needed (built-in states)

---

## Images

### Hero Image
**Type**: Full-width background image  
**Subject**: Professional flooring installation in progress or completed luxury vinyl plank/tile floor with natural light  
**Treatment**: Dark overlay (50% opacity) for text readability  
**Position**: Cover, center  

### Gallery Images (12+ images)
**Placement**: Gallery section grid  
**Subjects**: 
- LVP installations in living rooms
- Tile work in bathrooms and kitchens
- Hardwood flooring in bedrooms
- Countertop installations
- Before/after comparisons
**Aspect Ratio**: 4:3 or square, consistent across grid  

### About Section Image (Optional but Recommended)
**Type**: Team photo or owner portrait  
**Treatment**: Rounded corners, subtle shadow  
**Position**: Right side of about text

---

## Animations & Interactions

**Minimal, purposeful animations**:
- Scroll-triggered fade-in for sections (subtle, once)
- Gallery image hover: Scale 1.05 transition
- Button hover: Slight lift (translateY -2px)
- Form focus: Ring animation on inputs

**No distracting effects**: Avoid parallax, complex scroll animations, or excessive motion

---

## Mobile Considerations

- Sticky "Call Now" button at bottom of viewport (z-50)
- Click-to-call: tel: links on all phone numbers
- Click-to-email: mailto: links
- Tap-friendly button sizes (minimum 44px height)
- Collapsible navigation with mobile menu
- Gallery: 2-column grid on mobile for faster loading
- Forms: Full-width inputs with ample touch targets

---

## Trust Signals

- Years of experience badge (10+ Years) in hero
- Service area callout (Milwaukee Metro)
- Facebook follow CTA with icon
- Phone number prominently displayed in header
- Professional project photos establishing credibility
- Clear contact information in multiple locations