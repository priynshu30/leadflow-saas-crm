# 🚀 LeadFlow — Multi-Tenant SaaS CRM for Local Businesses

> **Core Promise**: *"Never miss a follow-up."*  
> A fast, lightweight, and modern sales CRM designed for local businesses (Real Estate, Automobile, Insurance, Solar, Loans, etc.) with a **dedicated Platform Super Admin Control Plane**.

---

## 🌟 Key Features

### 🏢 1. True Multi-Tenant SaaS Architecture
- **Tenant Data Isolation**: Every model (`Lead`, `User`, `FollowUp`, `LeadActivity`, `Notification`, `EmailMessage`) is strictly scoped by `businessId`.
- **Dynamic 4-Field Generic Schema**: Adapts field labels automatically to different business verticals (e.g. *Property Type, Budget, Bedrooms* for Real Estate vs *Car Model, Fuel Type* for Automobile).
- **Tenant Subscription Tiers**: `FREE`, `STARTER`, `PRO`, `ENTERPRISE` support.

### 🛡️ 2. Platform Super Admin Control Plane (`/admin`)
- **Completely Isolated Security Layer**: Separate `admin_session` cookie & JWT token (never shared with tenant sessions).
- **Master Telemetry Dashboard**: Total Businesses, Total CRM Users, Signups This Week, Active Users in last 24h, and Plan distribution.
- **Tenant Management & 1-Click Suspension**: Instantly suspend or reactivate accounts; suspended accounts are blocked at login.
- **Flat Platform Users Directory**: View all agents across all tenants, their total login count, and last active timestamp.
- **Raw Live Login Telemetry Stream**: Complete audit trail recording every login attempt (Success / Failure, IP address, Client browser, and Timestamp).

### 📞 3. High-Velocity Lead Management & 1-Click Outreach
- **One-Click Actions**: Instant **WhatsApp** (`https://wa.me/91...`), **Phone Call** (`tel:+91...`), and **Email Compose**.
- **Real-Time Duplicate Detection**: Warns agents before creating duplicate leads based on a 10-digit phone number match within the tenant.
- **Global Quick Add Modal**: Press `+ Quick Add` anytime from header or bottom mobile navigation.

### ⏰ 4. Bucketed Follow-Up Engine
- Automatic date bucketing:
  - 🔴 **Overdue** (Action needed immediately)
  - 🟡 **Today**
  - 🔵 **Tomorrow**
  - ⚪ **Upcoming**
  - 🟢 **Completed**
- Follow-up completion modal with automated activity timeline logging and optional next-schedule creation.

### 📊 5. Visual Analytics & Interactive Data Trends (`/reports` & `/dashboard`)
- **14-Day Lead Velocity & Conversion Trends**: Smooth gradient area chart showing incoming leads vs won deals.
- **Deal Pipeline Funnel**: Visual drop-off progression across stages (*New → Contacted → Interested → Site Visit → Converted*).
- **Lead Acquisition Channel Donut Chart**: Source breakdown (*Direct, WhatsApp, 99acres, Facebook Ads, Google Ads, Referral*).
- **7-Day Sales Outreach Bar Chart**: Daily team volume of Calls, WhatsApp messages, and Notes.

### 📁 6. Excel & CSV Bulk Import (`/leads`)
- **Drag-and-Drop Parser**: Powered by SheetJS (`xlsx`).
- **Sample Excel Template Generator**: Automatically creates downloadable `.xlsx` with the tenant's dynamic field labels.
- **Live Preview & Validation**: Table preview with duplicate checking before batch insertion into database.

### 🔔 7. Notifications & Communication Hub (`/inbox`)
- **Live In-App Notification Bell**: Real-time badge counter for overdue follow-ups, today's schedule, and incoming customer emails.
- **Customer Email Inbox (`/inbox`)**: View inbound client emails linked to leads, read threads, compose responses, and log to timeline.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14 (App Router)](https://nextjs.org/) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | MySQL |
| **ORM** | [Prisma ORM 5](https://www.prisma.io/) |
| **Authentication** | Custom JWT Session Engine (`jose` + `bcryptjs` + HTTP-only cookies) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Spreadsheet Parser** | [SheetJS (xlsx)](https://docs.sheetjs.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🔑 Login Credentials

### 🛡️ 1. Platform Super Admin (Platform Owner Only)
- **URL**: `http://localhost:3000/admin/login`
- **Email**: `admin@leadflow.in`
- **Password**: `SuperAdmin@123`

### 🏢 2. Demo Tenant Accounts (Pre-Seeded)

| Business Name | Vertical | Email | Password |
|---|---|---|---|
| **Apex Realty Gurgaon** | Real Estate | `amit@apexrealty.in` | `password123` |
| **Prime Auto Hub** | Automobile | `sales@primeautohub.com` | `password123` |
| **CarePlus Insurance** | Insurance | `vikram@careplus.in` | `password123` |

> *Tenant Login URL: `http://localhost:3000/login`*

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd "multi-tenant SaaS CRM"
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Database connection string (URL-encode special characters like @ to %40)
DATABASE_URL="mysql://root:Root%40123@127.0.0.1:3306/leadflow"

# Tenant Auth Secret
JWT_SECRET="leadflow_super_secret_jwt_key_2026_production"

# Platform Super Admin Auth Secret (Isolated)
ADMIN_JWT_SECRET="leadflow_super_admin_secret_key_2026_separate_auth"

# App Environment
NODE_ENV="development"
```

### 3. Setup Database Schema
```bash
# Push schema to MySQL
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 4. Seed Super Admin & Sample Tenants
```bash
# Seed Super Admin account
npx tsx prisma/seed-admin.ts

# (Optional) Seed demo tenant businesses, leads, and follow-ups
npx tsx prisma/seed.ts
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
multi-tenant-saas-crm/
├── prisma/
│   ├── schema.prisma          # Database schema (Multi-tenant, SuperAdmin, LoginLog, Leads)
│   ├── seed.ts                # Demo multi-vertical tenant seed data
│   └── seed-admin.ts          # Super Admin creation script
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         # Tenant CRM login
│   │   │   └── register/      # New business onboarding
│   │   ├── admin/             # 🛡️ SUPER ADMIN CONTROL PLANE
│   │   │   ├── login/         # Isolated admin login
│   │   │   ├── dashboard/     # Platform KPIs & live login telemetry
│   │   │   ├── businesses/    # Tenant management & suspend/reactivate
│   │   │   ├── users/         # Flat platform users directory
│   │   │   ├── logins/        # Raw LoginLog audit trail feed
│   │   │   └── layout.tsx     # Admin sidebar layout
│   │   ├── dashboard/         # Tenant sales dashboard & trends
│   │   ├── leads/             # Lead management, pipeline & Excel import
│   │   ├── follow-ups/        # Bucketed follow-up engine
│   │   ├── inbox/             # Customer email messages hub
│   │   ├── reports/           # 4-Chart analytics & conversion funnels
│   │   ├── settings/          # Custom fields & user profile
│   │   ├── api/               # Next.js App Router REST API endpoints
│   │   │   ├── admin/         # Super Admin API routes
│   │   │   ├── auth/          # Tenant auth endpoints
│   │   │   ├── leads/         # Lead CRUD, duplicate-check & import
│   │   │   ├── follow-ups/    # Follow-up status actions
│   │   │   ├── notifications/ # In-app notification polling & read status
│   │   │   └── inbox/         # Email messages & replies
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── charts/            # Recharts components (Area, Donut, Bar, Funnel)
│   │   ├── leads/             # ExcelImportModal, SendEmailModal, ActivityTimeline
│   │   ├── followups/         # CompleteFollowUpModal
│   │   ├── notifications/     # NotificationBell dropdown
│   │   ├── layout/            # Sidebar, Header, MobileTabBar, AppShell
│   │   └── ui/                # Button, Card, Badge, Input, Modal, Toast
│   ├── lib/
│   │   ├── auth.ts            # Tenant session management (leadflow_session)
│   │   ├── admin-auth.ts      # Super Admin session management (admin_session)
│   │   ├── db.ts              # Prisma singleton client
│   │   ├── utils.ts           # Formatting helpers & WhatsApp/Phone URL builders
│   │   └── validations.ts     # Zod validation schemas
│   ├── server/                # Clean Service-Layer backend business logic
│   │   ├── admin/             # Super Admin telemetry & business management service
│   │   ├── leads/             # Lead CRUD & Excel import service
│   │   ├── followups/         # Follow-up calculation service
│   │   ├── reports/           # Analytics & funnel calculation service
│   │   ├── notifications/     # Alert aggregation service
│   │   └── inbox/             # Inbound/outbound email service
│   ├── types/                 # Shared TypeScript interfaces
│   └── middleware.ts          # Security middleware protecting admin & tenant routes
└── package.json
```

---

## 📡 REST API Reference

### 🛡️ Super Admin Endpoints (Requires `admin_session`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Super Admin authentication |
| `POST` | `/api/admin/auth/logout` | Clear Super Admin session |
| `GET` | `/api/admin/auth/me` | Current Super Admin session status |
| `GET` | `/api/admin/stats` | Platform KPIs, signups & plan breakdown |
| `GET` | `/api/admin/businesses` | List all registered businesses (search/filter) |
| `GET` | `/api/admin/businesses/:id` | Business details with users & lead counts |
| `PATCH` | `/api/admin/businesses/:id` | Suspend / Reactivate business or update plan |
| `GET` | `/api/admin/users` | Flat list of all platform users |
| `GET` | `/api/admin/logins` | Audit log of all login attempts |

### 🏢 Tenant CRM Endpoints (Requires `leadflow_session`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Tenant login (logs to `LoginLog`) |
| `POST` | `/api/auth/register` | New business signup |
| `GET` | `/api/leads` | Paginated lead list with status & search |
| `POST` | `/api/leads` | Create new lead |
| `GET` | `/api/leads/check-duplicate` | Real-time phone number duplicate check |
| `POST` | `/api/leads/import` | Batch Excel / CSV lead import |
| `GET` | `/api/follow-ups` | Bucketed follow-ups (`overdue`, `today`, etc.) |
| `PATCH` | `/api/follow-ups/:id` | Complete follow-up & schedule next |
| `GET` | `/api/reports` | Visual analytics & conversion funnel data |
| `GET` | `/api/notifications` | Unread notifications & overdue alerts |
| `GET` | `/api/inbox` | Customer email messages |
| `POST` | `/api/inbox/:id` | Reply to email message |

---

## 🔒 Security Best Practices
- **Password Hashing**: Industry standard `bcryptjs` with salt rounds = 10.
- **Isolated JWT Secret Keys**: Tenant sessions and Super Admin sessions utilize completely different secrets and cookies.
- **SQL Injection Prevention**: Enforced via Prisma ORM parameterized queries.
- **Cross-Tenant Leakage Prevention**: All backend database queries strictly enforce `{ businessId: session.businessId }`.

---

## 📄 License
This project is proprietary software built for **LeadFlow SaaS CRM**. All rights reserved.
