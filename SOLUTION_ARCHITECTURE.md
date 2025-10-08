# Daycare Connect - Solution Architecture Document

**Version:** 1.0
**Date:** October 2025
**Author:** Chimere Onyema
**Status:** Production

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Diagrams](#architecture-diagrams)
4. [Technology Stack](#technology-stack)
5. [System Components](#system-components)
6. [Data Architecture](#data-architecture)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Integration Points](#integration-points)
10. [Scalability & Performance](#scalability--performance)
11. [Disaster Recovery](#disaster-recovery)

---

## 1. Executive Summary

Daycare Connect is a comprehensive childcare management platform that connects parents with daycare providers while offering robust management tools for providers and administrative oversight for system administrators. The platform is built on modern web technologies with a focus on scalability, security, and user experience.

### Key Features
- **Multi-tenant Architecture**: Separate interfaces for Parents, Providers, and Super Admins
- **Real-time Communication**: Messaging system with push notifications
- **Intelligent Waitlist Management**: Priority-based waitlist with automated offer generation
- **Role-Based Access Control (RBAC)**: Four-tier permission system
- **Comprehensive Child Management**: Profiles, attendance, daily reports, medical records
- **Room & Staff Management**: Capacity tracking, staff assignments, compliance monitoring

### Business Objectives
- Simplify daycare discovery and enrollment for parents
- Streamline operations for daycare providers
- Ensure compliance and safety through structured data management
- Enable data-driven decision making through analytics

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Parent     │  │   Provider   │  │ Super Admin  │          │
│  │  Interface   │  │  Interface   │  │  Interface   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER (Next.js 14)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Components & Pages                     │   │
│  │  • DaycareConnectApp  • ProviderDashboard               │   │
│  │  • ParentDashboard    • SuperAdminDashboard              │   │
│  │  • ChildProfiles      • RoomManagement                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   API Routes (38 endpoints)               │   │
│  │  /api/auth          /api/provider      /api/admin        │   │
│  │  /api/children      /api/rooms         /api/waitlist     │   │
│  │  /api/attendance    /api/bookings      /api/messages     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Business Logic Layer                         │   │
│  │  • RBAC System    • Waitlist Engine   • Notifications    │   │
│  │  • Booking Logic  • Compliance Rules  • Analytics        │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER (Prisma ORM)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • User Models      • Daycare Models   • Child Models    │   │
│  │  • Room Models      • Booking Models   • Waitlist Models │   │
│  │  • Message Models   • Attendance Models                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         PostgreSQL (Neon) - Serverless Database          │   │
│  │  • 27 Tables      • Relational Integrity                 │   │
│  │  • Connection Pooling  • Auto-scaling                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 User Interface Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    DAYCARE CONNECT APPLICATION                     │
└───────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
┌───────────────────────┐ ┌──────────────┐ ┌────────────────────┐
│   PARENT INTERFACE    │ │   PROVIDER   │ │   SUPER ADMIN      │
│                       │ │  INTERFACE   │ │   INTERFACE        │
├───────────────────────┤ ├──────────────┤ ├────────────────────┤
│ • Dashboard           │ │ • Dashboard  │ │ • System Stats     │
│ • Find Care (Search)  │ │ • Children   │ │ • User Management  │
│ • My Children         │ │ • Staff      │ │ • Roles/Permissions│
│ • Bookings            │ │ • Rooms      │ │ • Activity Logs    │
│ • Waitlist            │ │ • Attendance │ │ • Daycare Approval │
│ • Messages            │ │ • Waitlist   │ │ • Analytics        │
│ • Daily Reports       │ │ • Analytics  │ │ • System Settings  │
│ • Attendance History  │ │ • Messages   │ │                    │
│ • Documents           │ │ • Bookings   │ │                    │
└───────────────────────┘ └──────────────┘ └────────────────────┘
```

### 2.3 User Flow Diagram

```
                           ┌──────────────┐
                           │   Landing    │
                           │     Page     │
                           └──────┬───────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
                     ▼                         ▼
              ┌────────────┐           ┌────────────┐
              │   Sign Up  │           │  Sign In   │
              └─────┬──────┘           └─────┬──────┘
                    │                        │
                    └────────┬───────────────┘
                             │
                    ┌────────┴────────┐
                    │  Authentication │
                    │   & Role Check  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Parent     │    │   Provider   │    │ Super Admin  │
│  Dashboard   │    │  Dashboard   │    │  Dashboard   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Search       │    │ Manage       │    │ Monitor      │
│ Daycares     │    │ Children     │    │ System       │
│              │    │              │    │              │
│ Join         │    │ Manage       │    │ Manage       │
│ Waitlist     │    │ Staff        │    │ Users        │
│              │    │              │    │              │
│ Book Spots   │    │ Manage       │    │ Approve      │
│              │    │ Rooms        │    │ Daycares     │
│              │    │              │    │              │
│ View Reports │    │ Track        │    │ View Logs    │
│              │    │ Attendance   │    │              │
│              │    │              │    │              │
│ Message      │    │ Process      │    │ Manage Roles │
│ Providers    │    │ Waitlist     │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 3. Architecture Diagrams

### 3.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Client Components (React Server Components + Client Components) │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │   Parent    │  │  Provider   │  │ Super Admin  │            │
│  │ Components  │  │ Components  │  │  Components  │            │
│  ├─────────────┤  ├─────────────┤  ├──────────────┤            │
│  │• Dashboard  │  │• Dashboard  │  │• UserMgmt    │            │
│  │• Search     │  │• Children   │  │• RolesPerm   │            │
│  │• Children   │  │• Staff      │  │• ActivityLog │            │
│  │• Bookings   │  │• Rooms      │  │• SystemStats │            │
│  │• Waitlist   │  │• Attendance │  │• Settings    │            │
│  └─────────────┘  └─────────────┘  └──────────────┘            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Shared Components                            │   │
│  │  • MessageButton  • DocumentUpload  • DailyReports       │   │
│  │  • MessagingSystem • AttendanceHistory • Modals          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (RESTful Endpoints)                          │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │ Authentication │  │    Provider    │  │  Super Admin    │   │
│  ├────────────────┤  ├────────────────┤  ├─────────────────┤   │
│  │ /api/auth/*    │  │ /api/provider/*│  │ /api/admin/*    │   │
│  │ • login        │  │ • children     │  │ • users         │   │
│  │ • register     │  │ • staff        │  │ • daycares      │   │
│  │ • session      │  │ • daycares     │  │ • analytics     │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │   Children     │  │     Rooms      │  │    Waitlist     │   │
│  ├────────────────┤  ├────────────────┤  ├─────────────────┤   │
│  │ /api/children/*│  │ /api/rooms/*   │  │ /api/waitlist/* │   │
│  │ • CRUD         │  │ • CRUD         │  │ • entries       │   │
│  │ • profile      │  │ • staff assign │  │ • offers        │   │
│  │ • medical      │  │ • capacity     │  │ • campaigns     │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │   Attendance   │  │    Bookings    │  │    Messages     │   │
│  ├────────────────┤  ├────────────────┤  ├─────────────────┤   │
│  │ /api/          │  │ /api/bookings/*│  │ /api/messages/* │   │
│  │  attendance/*  │  │ • create       │  │ • send          │   │
│  │ • check-in     │  │ • update       │  │ • read          │   │
│  │ • check-out    │  │ • status       │  │ • conversations │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                RBAC System (lib/rbac/)                    │   │
│  │  • Permissions Enum (63 permissions)                     │   │
│  │  • Role Definitions (USER, STAFF, PROVIDER_ADMIN,        │   │
│  │    SUPER_ADMIN)                                          │   │
│  │  • Permission Checks (hasPermission, requirePermission)  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Waitlist Management Engine                      │   │
│  │  • Priority Calculation (FIFO, Age-based, Custom)        │   │
│  │  • Offer Generation & Expiry                             │   │
│  │  • Campaign Management                                    │   │
│  │  • Audit Logging                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Notification System                            │   │
│  │  • Email Notifications (SMTP)                            │   │
│  │  • Push Notifications (Web Push API)                     │   │
│  │  • In-app Notifications                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Booking & Enrollment Logic                       │   │
│  │  • Status Transitions (PENDING → CONFIRMED → ACTIVE)     │   │
│  │  • Capacity Validation                                    │   │
│  │  • Conflict Detection                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER (Prisma)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Prisma Client                            │   │
│  │  • Type-safe Database Client                             │   │
│  │  • Query Builder                                          │   │
│  │  • Migration Management                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        PostgreSQL (Neon Serverless Database)             │   │
│  │  • Auto-scaling                                          │   │
│  │  • Connection Pooling                                    │   │
│  │  • Branching (Dev/Prod isolation)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              EXAMPLE: Parent Joins Waitlist                      │
└─────────────────────────────────────────────────────────────────┘

1. User Action
   ┌────────────┐
   │   Parent   │ → Clicks "Join Waitlist" on Daycare Profile
   └─────┬──────┘
         │
         ▼
2. Client-Side
   ┌─────────────────────┐
   │  React Component    │ → Validates form data
   │  (SearchView)       │ → Shows loading state
   └─────┬───────────────┘
         │
         │ POST /api/waitlist
         ▼
3. API Layer
   ┌──────────────────────┐
   │  /api/waitlist/route │ → Authenticates user
   │                      │ → Checks permissions
   └─────┬────────────────┘
         │
         ▼
4. Business Logic
   ┌─────────────────────────┐
   │  Waitlist Engine        │ → Validates capacity
   │                         │ → Calculates priority
   │                         │ → Checks duplicates
   └─────┬───────────────────┘
         │
         ▼
5. Data Access
   ┌─────────────────────────┐
   │  Prisma Client          │ → Creates waitlist entry
   │                         │ → Updates daycare stats
   │                         │ → Logs activity
   └─────┬───────────────────┘
         │
         ▼
6. Database
   ┌─────────────────────────┐
   │  PostgreSQL (Neon)      │ → Stores waitlist entry
   │                         │ → Enforces constraints
   │                         │ → Returns created record
   └─────┬───────────────────┘
         │
         ▼
7. Response Flow
   ┌─────────────────────────┐
   │  API Response           │ → Success status
   │                         │ → Waitlist data
   └─────┬───────────────────┘
         │
         ▼
8. Post-Processing
   ┌─────────────────────────┐
   │  Notification System    │ → Sends confirmation email
   │                         │ → Sends push notification
   │                         │ → Notifies provider
   └─────┬───────────────────┘
         │
         ▼
9. UI Update
   ┌─────────────────────────┐
   │  React Component        │ → Shows success message
   │                         │ → Updates UI state
   │                         │ → Refetches data
   └─────────────────────────┘
```

---

## 4. Technology Stack

### 4.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.0.0 | React framework with App Router, SSR, and API routes |
| **React** | 18.2.0 | UI component library |
| **TypeScript** | 5.2.2 | Type-safe JavaScript |
| **Tailwind CSS** | 3.3.5 | Utility-first CSS framework |
| **Lucide React** | 0.263.1 | Icon library |
| **Framer Motion** | 12.23.22 | Animation library |
| **Recharts** | 3.2.0 | Charts and data visualization |
| **React Hook Form** | 7.62.0 | Form state management |
| **Zod** | 4.1.5 | Schema validation |

### 4.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 14.0.0 | RESTful API endpoints |
| **Prisma** | 6.16.1 | ORM and database toolkit |
| **PostgreSQL** | 16.9 | Relational database (via Neon) |
| **NextAuth.js** | 4.24.11 | Authentication framework |
| **bcryptjs** | 3.0.2 | Password hashing |
| **jsonwebtoken** | 9.0.2 | JWT token generation |
| **Nodemailer** | 6.10.1 | Email service |
| **Web Push** | 3.6.7 | Push notifications |

### 4.3 Development & Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Playwright** | 1.55.1 | End-to-end testing |
| **ESLint** | 8.0.0 | Code linting |
| **tsx** | 4.20.5 | TypeScript execution |

### 4.4 Infrastructure

| Service | Provider | Purpose |
|---------|----------|---------|
| **Hosting** | Vercel | Serverless deployment, CDN |
| **Database** | Neon | Serverless PostgreSQL |
| **Email** | Gmail SMTP | Transactional emails |
| **Push Notifications** | VAPID | Web push notifications |

---

## 5. System Components

### 5.1 Authentication & Authorization

**Component:** NextAuth.js Integration
**Location:** `/app/api/auth/[...nextauth]/route.ts`

**Features:**
- Credentials-based authentication
- JWT session management
- Role-based access control
- Secure password hashing (bcrypt)

**Flow:**
```
User Login → NextAuth Handler → Credential Validation →
JWT Token Generation → Session Creation → Role Assignment
```

**RBAC Implementation:**
- **4 Roles:** USER, STAFF, PROVIDER_ADMIN, SUPER_ADMIN
- **63 Permissions** across 11 categories
- **Hierarchical Permissions:** Higher roles inherit lower role permissions

### 5.2 Waitlist Management System

**Component:** Intelligent Waitlist Engine
**Location:** `/app/api/waitlist/*`

**Features:**
- Priority-based queue management
- Automated offer generation
- Offer expiry tracking
- Multi-daycare support
- Campaign management
- Comprehensive audit logging

**Priority Calculation:**
```typescript
Priority = BaseScore + AgeMultiplier + CustomRules
where:
  BaseScore = First-In-First-Out position
  AgeMultiplier = Child age priority weight
  CustomRules = Jurisdiction-specific rules
```

**State Machine:**
```
PENDING → OFFERED → ACCEPTED → ENROLLED
    ↓         ↓          ↓
WITHDRAWN  EXPIRED  DECLINED
```

### 5.3 Room & Capacity Management

**Component:** Room Management System
**Location:** `/app/components/rooms/*`

**Features:**
- Room configuration (capacity, age groups, ratios)
- Staff assignment tracking
- Occupancy monitoring
- Compliance validation
- Schedule management

**Capacity Validation:**
```
Available Capacity = Total Capacity - Current Occupancy
Staff Compliance = Current Staff >= Minimum Required Staff
```

### 5.4 Messaging System

**Component:** Real-time Communication
**Location:** `/app/components/MessagingSystem.tsx`

**Features:**
- One-to-one messaging
- Provider-to-parent communication
- Message threading
- Read/unread status
- Push notifications

### 5.5 Attendance Tracking

**Component:** Attendance Management
**Location:** `/app/api/attendance/*`

**Features:**
- Check-in/check-out functionality
- Historical tracking
- Room-based attendance
- Daily summaries
- Export capabilities

---

## 6. Data Architecture

### 6.1 Database Schema Overview

**Total Tables:** 27
**Database Engine:** PostgreSQL 16.9
**ORM:** Prisma 6.16.1

### 6.2 Core Entities

#### User Management
```
users
├── id (UUID, PK)
├── email (unique)
├── password_hash
├── name
├── role (enum)
├── user_type (enum)
├── is_active
├── is_super_admin
├── daycare_id (FK → daycares)
└── employed_at_id (FK → daycares)
```

#### Daycare Management
```
daycares
├── id (UUID, PK)
├── name
├── description
├── address_*
├── phone
├── email
├── license_number
├── total_capacity
├── current_occupancy
├── operating_hours_*
├── pricing_*
├── features (JSON)
├── is_verified
└── is_active

programs (daycare services)
├── id (UUID, PK)
├── daycare_id (FK)
├── name
├── description
├── age_range_*
├── capacity
├── price_*
└── schedule
```

#### Child Management
```
children
├── id (UUID, PK)
├── user_id (FK → users, parent)
├── daycare_id (FK → daycares)
├── full_name
├── date_of_birth
├── medical_info_*
├── emergency_contacts_*
├── enrollment_start
├── expected_exit
└── is_active
```

#### Room Management
```
rooms
├── id (UUID, PK)
├── daycare_id (FK)
├── name
├── room_type (enum)
├── age_range_*
├── capacity_*
├── staff_child_ratio
├── operating_hours_*
└── is_active

room_staff
├── id (UUID, PK)
├── room_id (FK → rooms)
├── user_id (FK → users, staff)
├── role (enum)
├── assigned_days
└── shift_times

room_children
├── room_id (FK → rooms)
├── child_id (FK → children)
├── assigned_at
└── PRIMARY KEY (room_id, child_id)
```

#### Booking System
```
bookings
├── id (UUID, PK)
├── user_id (FK → users)
├── daycare_id (FK → daycares)
├── program_id (FK → programs)
├── child_name
├── child_age
├── start_date
├── status (enum)
├── notes
└── timestamps
```

#### Waitlist System
```
waitlist_entries
├── id (UUID, PK)
├── user_id (FK → users)
├── daycare_id (FK → daycares)
├── child_info_*
├── priority_score
├── requested_start_date
├── status (enum)
└── timestamps

waitlist_offers
├── id (UUID, PK)
├── waitlist_entry_id (FK)
├── offered_at
├── expires_at
├── status (enum)
└── response_notes

waitlist_audit_logs
├── id (UUID, PK)
├── entry_id (FK)
├── action_type
├── performed_by (FK → users)
├── details (JSON)
└── timestamp
```

#### Attendance System
```
attendance
├── id (UUID, PK)
├── child_id (FK → children)
├── daycare_id (FK → daycares)
├── date
├── check_in_time
├── check_out_time
├── checked_in_by (FK → users)
├── checked_out_by (FK → users)
└── notes

room_attendance
├── id (UUID, PK)
├── room_id (FK → rooms)
├── child_id (FK → children)
├── date
├── check_in_time
├── check_out_time
└── notes
```

#### Communication
```
conversations
├── id (UUID, PK)
├── participant_1_id (FK → users)
├── participant_2_id (FK → users)
├── last_message_at
└── timestamps

messages
├── id (UUID, PK)
├── conversation_id (FK)
├── sender_id (FK → users)
├── content
├── is_read
└── timestamp
```

#### Daily Reports
```
daily_reports
├── id (UUID, PK)
├── child_id (FK → children)
├── daycare_id (FK → daycares)
├── date
├── mood
├── meals_*
├── nap_times_*
├── bathroom_*
├── activities_*
├── notes
└── created_by (FK → users)

daily_report_activities
├── id (UUID, PK)
├── report_id (FK)
├── activity_type
├── description
└── timestamp
```

#### System Administration
```
activity_logs
├── id (UUID, PK)
├── user_id (FK → users)
├── action_type
├── resource_type
├── resource_id
├── details (JSON)
└── timestamp

waitlist_settings
├── id (UUID, PK)
├── daycare_id (FK → daycares)
├── max_capacity
├── auto_offer_enabled
├── offer_expiry_hours
├── priority_rules (JSON)
└── timestamps
```

### 6.3 Entity Relationship Diagram

```
┌─────────┐        ┌──────────┐        ┌─────────┐
│  users  │◄───────│ children │───────►│daycares │
└────┬────┘        └────┬─────┘        └────┬────┘
     │                  │                    │
     │                  │                    │
     │                  ▼                    ▼
     │            ┌──────────┐        ┌──────────┐
     │            │attendance│        │  rooms   │
     │            └──────────┘        └────┬─────┘
     │                                     │
     ▼                                     ▼
┌──────────┐                        ┌─────────────┐
│bookings  │                        │ room_staff  │
└──────────┘                        └─────────────┘
     │
     │                               ┌──────────────┐
     ▼                               │room_children │
┌──────────┐                        └──────────────┘
│waitlist_ │
│entries   │                        ┌──────────────┐
└────┬─────┘                        │daily_reports │
     │                              └──────────────┘
     ▼
┌──────────┐                        ┌──────────────┐
│waitlist_ │                        │conversations │
│offers    │                        └──────┬───────┘
└──────────┘                               │
                                           ▼
┌──────────┐                        ┌──────────────┐
│activity_ │                        │   messages   │
│logs      │                        └──────────────┘
└──────────┘
```

---

## 7. Security Architecture

### 7.1 Authentication Security

**Password Security:**
- bcrypt hashing (10 rounds)
- Minimum password length: 6 characters
- Secure password reset flow

**Session Management:**
- JWT tokens with 30-day expiry
- HTTP-only cookies
- Secure flag enabled in production
- CSRF protection

**API Security:**
- Session validation on all protected routes
- Role-based authorization checks
- Rate limiting (planned)

### 7.2 Authorization Framework

**RBAC Implementation:**

```typescript
// Permission Hierarchy
SUPER_ADMIN (all permissions)
    ├── PROVIDER_ADMIN (provider-level permissions)
    │   ├── STAFF (operational permissions)
    │   │   └── USER (basic permissions)
```

**Permission Categories:**
1. User Management (5 permissions)
2. Daycare Management (5 permissions)
3. Staff Management (4 permissions)
4. Waitlist Management (5 permissions)
5. Booking Management (4 permissions)
6. Review Management (5 permissions)
7. Daily Reports (4 permissions)
8. Attendance (3 permissions)
9. Messages (2 permissions)
10. Analytics (2 permissions)
11. System Settings (3 permissions)

### 7.3 Data Security

**Encryption:**
- HTTPS/TLS in production
- Database connection encryption (SSL)
- Encrypted password storage

**Data Privacy:**
- GDPR-compliant data handling
- Personal data minimization
- Right to be forgotten (user deletion)
- Data export capabilities

**Input Validation:**
- Zod schema validation
- SQL injection prevention (Prisma parameterized queries)
- XSS protection (React escaping)

### 7.4 Infrastructure Security

**Database Security:**
- Connection pooling with authentication
- Separate dev/prod environments
- Regular automated backups
- Point-in-time recovery

**Deployment Security:**
- Environment variable encryption
- Secrets management (Vercel)
- CORS configuration
- Security headers

---

## 8. Deployment Architecture

### 8.1 Production Environment

```
┌────────────────────────────────────────────────────────────┐
│                     VERCEL PLATFORM                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Global CDN Edge Network                  │  │
│  │  • 100+ Edge Locations                               │  │
│  │  • Automatic SSL/TLS                                 │  │
│  │  • DDoS Protection                                   │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                         │
│                   ▼                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Next.js Serverless Functions                │  │
│  │  • Auto-scaling                                      │  │
│  │  • Zero-config deployment                            │  │
│  │  • Instant rollback                                  │  │
│  └────────────────┬─────────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────┐
│                  NEON DATABASE (Production)                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        PostgreSQL 16.9 (Serverless)                  │  │
│  │  • Auto-scaling compute                              │  │
│  │  • Connection pooling (PgBouncer)                    │  │
│  │  • Automated backups                                 │  │
│  │  • Point-in-time recovery                            │  │
│  │  • High availability                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

External Services:
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Gmail SMTP     │  │   Web Push API  │  │  Vercel OIDC    │
│  (Email)        │  │  (Notifications)│  │  (Auth Tokens)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 8.2 Development Environment

```
┌────────────────────────────────────────────────────────────┐
│                   LOCAL DEVELOPMENT                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Next.js Development Server                   │  │
│  │  • Hot Module Replacement                            │  │
│  │  • Fast Refresh                                      │  │
│  │  • localhost:3000                                    │  │
│  └────────────────┬─────────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────┐
│              NEON DATABASE (Dev Branch)                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        PostgreSQL 16.9 (Development)                 │  │
│  │  • Isolated from production                          │  │
│  │  • Branch-based databases                            │  │
│  │  • Safe for testing                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 8.3 CI/CD Pipeline

```
┌──────────────┐
│ Git Push to  │
│   GitHub     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│  Vercel Automatic Deployment │
│  1. Install dependencies      │
│  2. Run Prisma generate       │
│  3. Build Next.js app         │
│  4. Run tests (optional)      │
│  5. Deploy to serverless      │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│   Production Deployment       │
│   • Zero-downtime             │
│   • Instant rollback          │
│   • Preview deployments       │
└───────────────────────────────┘
```

---

## 9. Integration Points

### 9.1 External Services

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| **Gmail SMTP** | Email delivery | Transactional emails (waitlist offers, booking confirmations) |
| **Web Push API** | Push notifications | Real-time alerts for parents and providers |
| **Neon Database** | Data persistence | Primary data store |
| **Vercel** | Hosting & CDN | Application deployment and edge network |

### 9.2 API Endpoints Summary

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/session` - Get current session

**Provider Management:**
- `GET /api/provider/daycares` - List provider's daycares
- `GET /api/provider/children` - List enrolled children
- `POST /api/provider/staff` - Create staff member
- `GET /api/provider/analytics` - Provider analytics

**Waitlist:**
- `POST /api/waitlist` - Join waitlist
- `GET /api/waitlist/entries` - List entries
- `POST /api/waitlist/offers` - Create offer
- `PATCH /api/waitlist/offers/:id` - Update offer status

**Rooms:**
- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room
- `PATCH /api/rooms/:id` - Update room
- `POST /api/rooms/staff` - Assign staff to room

**Children:**
- `GET /api/children` - List children
- `GET /api/children/:id` - Get child details
- `PATCH /api/children/:id` - Update child

**Attendance:**
- `POST /api/attendance/check-in` - Check in child
- `POST /api/attendance/check-out` - Check out child
- `GET /api/attendance/history` - Get attendance history

**Super Admin:**
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/analytics` - System-wide analytics

---

## 10. Scalability & Performance

### 10.1 Scalability Strategy

**Application Layer:**
- Serverless architecture (auto-scaling)
- Stateless API design
- Edge caching via Vercel CDN
- Code splitting and lazy loading

**Database Layer:**
- Connection pooling (PgBouncer)
- Auto-scaling compute (Neon)
- Read replicas (future consideration)
- Query optimization with indexes

**Caching Strategy:**
- Static page caching (Next.js)
- API response caching (Vercel Edge)
- Client-side caching (React Query planned)

### 10.2 Performance Optimization

**Frontend:**
- Server-side rendering (Next.js 14)
- Image optimization (next/image)
- Font optimization
- Bundle size optimization
- Progressive Web App (PWA) ready

**Backend:**
- Efficient database queries (Prisma select)
- Pagination for large datasets
- Batch operations where applicable
- Async processing for non-critical tasks

**Monitoring (Planned):**
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Database query monitoring

### 10.3 Current Limitations & Future Scaling

**Current State:**
- Single-region deployment (US East)
- No horizontal scaling (serverless handles this)
- Limited caching implementation

**Future Enhancements:**
- Multi-region deployment
- Redis caching layer
- Background job processing (Bull/BullMQ)
- Microservices for specific features

---

## 11. Disaster Recovery

### 11.1 Backup Strategy

**Database Backups:**
- Automated daily backups (Neon)
- 7-day retention period
- Point-in-time recovery (up to 7 days)
- Manual backup before major changes

**Code Repository:**
- Version control (Git/GitHub)
- Multiple branches (dev, staging, production)
- Tag-based releases

### 11.2 Recovery Procedures

**Database Recovery:**
1. Identify recovery point
2. Use Neon console to restore to specific timestamp
3. Verify data integrity
4. Update application connection string
5. Test critical flows

**Application Recovery:**
1. Identify working commit/tag
2. Rollback via Vercel dashboard (instant)
3. Verify deployment
4. Monitor error rates

**Recovery Time Objectives (RTO):**
- Application: < 5 minutes (instant rollback)
- Database: < 30 minutes (point-in-time restore)

**Recovery Point Objectives (RPO):**
- Database: < 24 hours (daily backups)
- Code: 0 (Git version control)

### 11.3 High Availability

**Application:**
- Multi-zone deployment via Vercel
- Automatic failover
- Zero-downtime deployments

**Database:**
- High availability configuration (Neon)
- Automatic failover
- Connection pooling for resilience

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **RBAC** | Role-Based Access Control - authorization mechanism |
| **ORM** | Object-Relational Mapping - database abstraction layer |
| **SSR** | Server-Side Rendering - rendering pages on the server |
| **PWA** | Progressive Web App - web app with native-like features |
| **CRUD** | Create, Read, Update, Delete - basic data operations |
| **JWT** | JSON Web Token - authentication token format |
| **CDN** | Content Delivery Network - distributed edge servers |
| **SMTP** | Simple Mail Transfer Protocol - email protocol |
| **VAPID** | Voluntary Application Server Identification - push notification protocol |

---

## Appendix B: Database Statistics

**Production Database (as of sync):**
- Total Records: ~100+
- Users: 9
- Daycares: 4
- Rooms: 1
- Staff: 1
- Children: 6
- Bookings: 18
- Waitlist Entries: 7

**Schema Statistics:**
- Total Tables: 27
- Total Indexes: 31
- Foreign Key Constraints: 45
- Unique Constraints: 15

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | October 2025 | Chimere Onyema | Initial architecture documentation |

---

**End of Document**
