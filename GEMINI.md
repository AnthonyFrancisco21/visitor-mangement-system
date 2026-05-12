# Visitor Management System - Project Rules & Guidelines

## 🏗️ Architecture Overview

This is a **Turborepo monorepo** with **Next.js** as the primary framework.

- **Backend**: Built into Next.js using `/app/api` routes (NOT a separate backend folder)
- **Frontend**: React components in Next.js `/app` directory
- **Database**: Prisma ORM with schema.prisma
- **Styling**: CSS modules, Tailwind (check globals.css and page.module.css patterns)

## ❌ DO NOT DO THIS

- **DO NOT** create a separate `/backend` or `/server` folder
- **DO NOT** suggest moving API logic out of Next.js
- **DO NOT** create duplicate API layers
- **DO NOT** ignore the Turborepo monorepo structure

## ✅ CORRECT SEPARATION OF CONCERNS (for this codebase)

Instead of physical backend/frontend folders, use logical separation:

### API & Server Logic

- Use `/app/api/*` directory for all API routes
- Database queries & Prisma operations live in API routes or `/lib/db/` utilities
- Authentication logic in `/app/api/auth/*`
- Business logic in `/lib/` utilities (used by both API and frontend)

### Frontend Logic

- React components in `/app/*` (excluding `/app/api`)
- Client-side state, hooks, and utilities
- Keep components modular and reusable

### Shared Utilities

- `/lib/` folder for shared functions (database queries, helpers, types)
- `/prisma/` for schema and migrations
- Type definitions should be shared across API and frontend

## 🔧 Tech Stack & Conventions

- **Framework**: Next.js (App Router)
- **Database ORM**: Prisma
- **Language**: TypeScript (maintain strict types)
- **CSS**: CSS Modules (see page.module.css patterns) + Tailwind for utility
- **API Style**: RESTful via Next.js route handlers
- **Monorepo**: Turborepo - respect workspace structure

## 📁 Folder Structure to Maintain

```
apps/web/
  ├── app/
  │   ├── api/           ← API routes ONLY
  │   ├── components/    ← Reusable React components
  │   ├── (auth)/        ← Route groups for auth pages
  │   ├── layout.tsx     ← Root layout
  │   └── page.tsx       ← Home page
  ├── lib/               ← Shared utilities & types
  ├── public/            ← Static files
  ├── prisma/            ← Database schema
  └── package.json
```

## 💾 Database & Prisma Rules

- All database operations go through Prisma client
- Migrations are handled in `/prisma/migrations`
- Keep schema.prisma organized by domain/feature
- Use Prisma types for type safety (leverage generated types)
- Never bypass Prisma with raw queries unless absolutely necessary

## 🎨 Frontend & Component Rules

- Use Next.js built-in Image component for images
- Keep component props well-typed
- Use CSS modules for component-scoped styles
- Follow the frontend-design skill guidance for UI patterns
- Make components reusable (admin, api, visitor, etc. might share components)

## 🔌 API Route Rules (Next.js)

- API routes in `/app/api/[feature]/route.ts`
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Always validate and sanitize inputs
- Return proper status codes (200, 400, 401, 404, 500)
- Handle errors gracefully with meaningful messages
- Structure: `app/api/[resource]/[id?]/route.ts`

Example pattern:

```
/app/api/visitor/route.ts        ← GET, POST
/app/api/visitor/[id]/route.ts   ← GET, PUT, DELETE
/app/api/auth/login/route.ts
/app/api/auth/register/route.ts
```

## 🔐 Authentication Rules

- Auth logic in `/app/api/auth/*`
- Use existing auth patterns from the `auth` folder
- Keep user sessions secure
- Validate permissions on API routes, not just frontend

## 📝 Code Quality Standards

- Write clean, readable, well-documented code
- Add JSDoc comments for functions and API endpoints
- Use TypeScript strictly (no `any` unless unavoidable)
- Keep files focused on single responsibility
- Name things clearly (no abbreviations unless standard)

## 🚫 Common Mistakes to Avoid

- Don't create `/backend` folder - use `/app/api` and `/lib`
- Don't mix server and client code without "use client" directives
- Don't put business logic in components
- Don't forget Prisma types when working with database
- Don't hardcode values - use environment variables
- Don't ignore existing patterns in the codebase

## 🔄 Complete System Workflow

### System Overview

**Visitor Management System** is a 3-tier system (Kiosk → Receptionist → Admin) that tracks visitor entry/exit from a building using a combination of tablet-based registration, ID scanning, and RFID cards.

**Key Entities:**

- **Visitor**: Person entering the building (name, age, address, contact, ID photo)
- **RFID Card**: Physical reusable card (30+ available, numbered, tapped for time tracking)
- **Destination/Department**: Pre-defined locations in the building with a contact person
- **Registration**: Visitor submitting info on kiosk tablet
- **Time In**: When receptionist taps RFID card (not when visitor submits form)
- **Time Out**: When visitor taps RFID at checkout or admin manually revokes

---

### 🖥️ KIOSK WORKFLOW (Tablet at Reception)

**Purpose**: Visitor self-registration on tablet

**Flow:**

1. **Visitor Navigation**
   - Visitor selects desired destination/department from pre-defined list
   - Visitor selects person/contact they are visiting
   - Visitor states reason for visit

2. **ID Scanning**
   - Visitor points ID at tablet camera (front and back)
   - System extracts: name, age, address
   - **Note**: Extraction may not be 100% accurate
   - Visitor can manually edit extracted fields

3. **Contact Information**
   - Visitor enters phone/contact number
   - Visitor reviews all information
   - Visitor clicks "Proceed" or "Finish"

4. **Submission & Waiting State**
   - Form submits → Registration status = **PENDING**
   - Kiosk displays: `"You are set. Wait for receptionist to give you your visitor ID"`
   - Kiosk shows **real-time timer** as visitor waits
   - Visitor cannot proceed to destination until RFID is tapped

5. **RFID Tap Confirmation** (by receptionist)
   - Once receptionist taps RFID card reader: Time In is recorded
   - Kiosk displays: `"You are good to go. Thank you for your visit"`
   - Visitor takes RFID card and proceeds to destination
   - Receptionist provides verbal confirmation

**Edge Case - Kiosk Not Used**:

- If tablet is broken/unavailable, receptionist uses **Manual Registration** form
- Receptionist asks visitor for all information verbally
- ID photo is NOT taken (if no camera available)
- Rest of workflow continues normally

---

### 👨‍💼 RECEPTIONIST WORKFLOW

**Purpose**: Approve registrations, manage RFID cards, track visitor check-in/out

**Two Main Responsibilities**:

#### A. REGISTRATION & TIME IN

1. **Registration Table**
   - Displays all **PENDING** registrations (visitors waiting on kiosk)
   - Shows: name, destination, person visiting, time submitted
   - Receptionist reviews and clicks row to open **Confirmation Modal**

2. **Confirmation Modal**
   - Shows all extracted/entered visitor information
   - Receptionist can edit any field if needed
   - Receptionist clicks **"Confirm"** to approve

3. **RFID Tap For Registration**
   - Modal changes to: `"Tap visitor card for registration"`
   - Receptionist taps RFID card on reader
   - **IMPORTANT**: This records **Time In** and completes registration
   - Kiosk receives confirmation (visitor sees "You are good to go")
   - RFID is now **linked to this visitor** in database
   - Receptionist hands RFID card to visitor

4. **Live Dashboard**
   - Shows all **currently active visitors** (Time In but not yet Time Out)
   - Updates in real-time as visitors are registered or checked out
   - Receptionist can see who's in the building at any moment

**Manual Registration** (Fallback):

- If kiosk is broken, click **"Manual Registration"** button
- Form appears with all fields: name, age, address, contact, destination, person, reason
- Receptionist manually enters all information
- Proceeds to RFID tap same as above

#### B. VISITOR CHECKOUT & TIME OUT

1. **Checkout Navigation**
   - Receptionist navigates to **"Visitor Checkout"** page
   - Page is ready to listen for RFID card tap
   - Receptionist asks visitor to tap their RFID card on reader

2. **Automatic Time Out** (Normal Case)
   - RFID is tapped
   - System finds visitor record with Time In but no Time Out
   - Automatically records **Time Out** with current timestamp
   - Displays confirmation: `"Visitor checked out successfully"`
   - RFID card is now **freed up** and can be reused for another visitor

3. **Manual Revoke** (Lost Card / Emergency)
   - On **"Visitor Checkout"** page, receptionist can see **all active visitors** (Time In only)
   - Receptionist can click a visitor name
   - Modal shows **"Revoke"** button with reason dropdown:
     - Lost Card
     - Forgot to Check Out
     - Emergency Exit
     - Other
   - Clicking "Revoke" records Time Out immediately
   - RFID card data is preserved in database for records
   - Visitor is marked as checked out

**Real-Time Live Dashboard**:

- Shows all currently **in-building** visitors (Time In + no Time Out)
- Shows **pending registrations** waiting for RFID tap
- Receptionist can monitor status at a glance

---

### 👨‍💻 ADMIN WORKFLOW

**Purpose**: Oversight, reporting, analytics, system management

**Same Receptionist Functions** (Admin can do everything receptionist does):

- Registration approval and RFID tapping
- Checkout and revoke
- Manual registration
- View live dashboard

**Additional Admin Features**:

1. **Reports**
   - Date range selector (start date → end date)
   - Select specific date or date range
   - View all visitors who tapped in during that period
   - Shows: Visitor name, destination, person visited, Time In, Time Out, duration
   - **Print functionality** for physical records
   - Can export/download as needed

2. **Analytics**
   - **Peak Hours**: Graph showing busiest times of day
   - **Most Visited People**: Ranking of most frequently visited contacts/departments
   - **Visitor Frequency**: Recurring visitors, one-time visitors, frequency trends
   - Date range filters for all analytics

3. **System Management** (Future):
   - Manage destinations/departments
   - Manage receptionist accounts
   - System settings and configuration

---

### 📊 DATABASE & RECORDS

**What Gets Recorded**:

- Every visitor registration (even if later revoked)
- Every Time In timestamp with RFID card number
- Every Time Out timestamp with reason (if manual revoke)
- Destination, contact person, reason for visit
- ID photos (when available)
- All manual edits/corrections by receptionist

**Data Persistence**:

- **Permanent**: All records kept forever (for reports, analytics, historical tracking)
- **Live Status**: Real-time marker for "currently in building"
- **RFID Reuse**: Once Time Out is recorded, RFID card number is available for next visitor

---

### 🔗 RFID Card System

**Physical Properties**:

- 30+ physical cards labeled "Visitor Card"
- Each card has a unique ID number
- Cards are reusable and durable

**Database Linking**:

1. **Pending State**: Visitor submits form, RFID not yet linked
2. **Time In**: Receptionist taps RFID → Card is linked to visitor record
3. **Active**: Visitor carries card, RFID linked to record with Time In only
4. **Time Out**: Receptionist scans card again or admin revokes → Time Out recorded
5. **Available**: RFID is now unlinked and ready for next visitor

**Lost Card Protocol**:

- If visitor loses RFID, receptionist goes to **"Visitor Checkout"** page
- Searches for visitor in "Active Visitors" list
- Clicks visitor name
- Clicks **"Revoke"** button, selects reason: "Lost Card"
- Time Out is recorded without RFID scan
- RFID card itself is marked lost (admin can track lost cards in reports)

---

### 🚨 Edge Cases & Important Flows

| Scenario                                     | Solution                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| Tablet breaks during registration            | Receptionist uses "Manual Registration" form                                 |
| Visitor forgets RFID card on checkout        | Receptionist manually revokes in checkout page                               |
| RFID reader breaks                           | Admin can force checkout using admin panel (manual revoke)                   |
| Visitor stays past business hours            | Admin marks as checked out at end of day via reports                         |
| Receptionist forgets to tap RFID             | Kiosk will keep showing "Wait for receptionist" - visitor must wait in lobby |
| Visitor wants to visit multiple destinations | Checkout and re-register (card reused)                                       |
| Recurring visitor                            | System recognizes returning visitor, can pre-fill some info (future)         |

---

### 📱 Real-Time Notifications & UI Updates

**Kiosk Updates**:

- After form submit: `"You are set. Wait for receptionist to give you your visitor ID"` (with timer)
- After RFID tap: `"You are good to go. Thank you for your visit"`

**Receptionist Updates**:

- New pending registration appears in table immediately
- Live dashboard updates when visitor is registered or checked out
- Can view all active visitors in live dashboard and checkout page

**Admin Overview**:

- Can see everything receptionist sees
- Can run reports and analytics on any date range
- Can manually intervene in edge cases

---

### 🔮 Future Features & Improvements

1. **Contact Person Notification**: Notify the person being visited that their guest has arrived
2. **Notification Alerts**: Pop-up or sound alert on receptionist when new pending registration
3. **QR Code Fallback**: If RFID reader fails, use QR code on visitor card
4. **Photo Verification at Checkout**: Quick ID match to prevent card misuse
5. **Time Overdue Alerts**: Flag visitors staying longer than expected
6. **Bulk Checkout**: Admin can force-checkout multiple visitors at end of day
7. **Department/Floor Assignment**: More granular destination tracking
8. **Repeat Visitor Detection**: Highlight if visitor is returning
9. **Audit Trail**: Log all manual actions with user who performed them
10. **Multi-Building Support**: Prepare for hosted version with multiple locations

---

## 📚 Referenced Skills

- **frontend-design**: Use for UI/UX component patterns, styling, and layouts
- **senior-frontend**: Use for React patterns, hooks, and component architecture
- **senior-backend**: Use for API design, database queries, and business logic

Apply these skills within the Next.js + Prisma context. They guide best practices, not literal folder structure.

## 🎯 Decision Priority

1. **Existing code patterns** - if code already exists, match it
2. **Next.js conventions** - follow Next.js app router standards
3. **Skills guidance** - apply for architecture patterns
4. **Project structure** - respect Turborepo monorepo layout

---

**Last Updated**: Current  
**Framework**: Next.js with App Router  
**Database**: Prisma ORM  
**Build Tool**: Turborepo
