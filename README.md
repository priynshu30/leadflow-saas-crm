# 🚀 LeadFlow — Multi-Tenant SaaS CRM & Field Sales Tracking

> **Core Promise**: *"Never miss a follow-up, track field sales with live proof."*  
> A fast, modern sales CRM built for local businesses (Real Estate, Automobile, Insurance, Solar, Loans, etc.) featuring **Live Selfie + GPS Field Attendance**, **Call Recording & Work Proof Uploads**, **Granular Role Permissions**, and a **Dedicated Platform Super Admin Control Plane**.

---

## 🌟 Key Features

### 🏢 1. True Multi-Tenant SaaS Architecture
- **Tenant Data Isolation**: Every model (`Lead`, `User`, `Attendance`, `WorkProof`, `FollowUp`, `LeadActivity`, `Notification`, `EmailMessage`) is strictly scoped by `businessId`.
- **Dynamic 4-Field Generic Schema**: Adapts custom field labels automatically across industries (e.g. *Property Type, Budget, Bedrooms* for Real Estate vs *Car Model, Fuel Type* for Automobile).
- **Tenant Subscription Tiers**: `FREE`, `STARTER`, `PRO`, `ENTERPRISE` support.

---

### 📍 2. Field Attendance & GPS Tracking (`/attendance`)
- **🌅 Start of Day (SOD) Clock-In**:
  - Live Selfie capture via webcam or native phone camera.
  - Automatic GPS coordinate capture with reverse geocoded human-readable address.
  - Built-in client-side image compression (reduces 10MB camera shots to ~40KB lightweight JPEGs in 10ms).
- **🌆 End of Day (EOD) Clock-Out**:
  - Evening selfie + GPS location capture + written daily work summary.
  - Live on-duty shift timer calculation (e.g. `8h 15m on duty`).
- **🗺️ Interactive Google Maps Integration**: Click any attendance or proof record to view the exact location pin on Google Maps.
- **📥 Monthly Attendance Excel Export**: Company Owner can download complete attendance sheets (`.xlsx`) with Employee Name, Date, In-Time, Out-Time, Total Shift Duration, and Summary for instant payroll calculation.

---

### 🎙️ 3. Field Work Proofs & Call Recordings Hub
- **📁 Call Recording Uploads**: Field agents can attach client phone call recordings (`.mp3`, `.m4a`, `.wav`, `.aac`) directly from their device.
- **🎙️ Live Voice Note Recorder**: Record voice notes on the go using the in-app microphone.
- **📷 Site Visit Photos & Proofs**: Capture on-site photos with automatic GPS tags.
- **🔗 Direct Lead Tagging**: Work proofs and call recordings can be linked directly to specific clients.
- **🎧 In-App Audio Player**: Embedded play/pause audio players appear directly on the Attendance dashboard and inside the Lead Activity Timeline.

---

### 👥 4. Team & Granular Permission Management (`/employees`)
- **👑 Company Owner (Admin) Powers**:
  - Exclusively invite and add new team members with login credentials.
  - View all field agents' live attendance, selfies, timings, and daily summaries.
  - **🔑 1-Click Password Reset**: Change or reset any employee's password directly from the dashboard.
- **🔒 Granular Permission Toggles (Real-Time)**:
  - **`View All Leads`**:
    - **ON**: Agent can browse all leads across the entire company.
    - **OFF**: Agent is strictly restricted to only leads assigned to them.
  - **`Add Leads`**:
    - **ON**: Agent can create new leads and import lists.
    - **OFF**: Agent is blocked from adding new leads (must work only on assigned leads).
  - **`Role Switcher`**: Switch any user between `Field Agent` and `Administrator`.

---

### 🎯 5. High-Velocity Lead Management & 1-Click Outreach (`/leads`)
- **One-Click Actions**: Instant **WhatsApp** (`wa.me`), **Phone Dialer** (`tel:`), and **Email Compose**.
- **⚡ Post-Communication Quick Outcome Logger**: 1-tap logging after calling or messaging a client (`✅ Connected`, `⏳ Callback Later`, `❌ Not Picked`).
- **🎯 1-Click Lead Assignment**: Reassign any lead to any agent from the Lead Detail page dropdown.
- **Real-Time Duplicate Detection**: Warns agents before creating duplicate leads based on phone number matches.
- **Global Quick Add Modal**: Press `+ Quick Add` anytime from header or mobile tab bar.

---

### ⏰ 6. Bucketed Follow-Up Engine (`/follow-ups`)
- Automatic smart date bucketing:
  - 🔴 **Overdue** (Action needed immediately)
  - 🟡 **Today**
  - 🔵 **Tomorrow**
  - ⚪ **Upcoming**
  - 🟢 **Completed**
- Follow-up completion modal with automated activity timeline logging and next-schedule creation.

---

### 📊 7. Visual Analytics & Reports (`/reports` & `/dashboard`)
- **14-Day Lead Velocity & Conversion Trends**: Smooth gradient area chart showing incoming leads vs won deals.
- **Deal Pipeline Funnel**: Visual drop-off progression across stages (*New → Contacted → Interested → Site Visit → Converted*).
- **Lead Acquisition Channel Donut Chart**: Source breakdown (*Direct, WhatsApp, Portals, Ads, Referrals*).
- **7-Day Sales Outreach Bar Chart**: Daily team volume of Calls, WhatsApp messages, and Notes.

---

### 🛡️ 8. Platform Super Admin Control Plane (`/admin`)
- **Completely Isolated Security Layer**: Separate `admin_session` cookie & JWT token (never shared with tenant sessions).
- **Master Telemetry Dashboard**: Total Businesses, Total CRM Users, Signups This Week, Active Users in last 24h, and Plan distribution.
- **Tenant Management & 1-Click Suspension**: Instantly suspend or reactivate accounts; suspended accounts are blocked at login.
- **Raw Live Login Telemetry Stream**: Complete audit trail recording every login attempt (Success / Failure, IP address, Client browser, and Timestamp).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14 (App Router)](https://nextjs.org/) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | MySQL / TiDB Serverless |
| **ORM** | [Prisma ORM 5](https://www.prisma.io/) |
| **Authentication** | Custom JWT Session Engine (`jose` + `bcryptjs` + HTTP-only cookies) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Spreadsheet Engine** | [SheetJS (xlsx)](https://docs.sheetjs.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🔑 Default Credentials

### 🛡️ 1. Platform Super Admin (Platform Owner Only)
- **URL**: `/admin/login`
- **Email**: `admin@leadflow.in`
- **Password**: `SuperAdmin@123`

### 🏢 2. Company Owner & Team Accounts (Demo)
- **Tenant Login URL**: `/login`
- **Company Owner**: `priyanshukumarr444@gmail.com` (Full Access)

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/priynshu30/leadflow-saas-crm.git
cd "multi-tenant SaaS CRM"
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Database connection string
DATABASE_URL="mysql://username:password@localhost:3306/leadflow"

# Tenant Auth Secret
JWT_SECRET="leadflow_super_secret_jwt_key_2026_production"

# Platform Super Admin Auth Secret (Isolated)
ADMIN_JWT_SECRET="leadflow_super_admin_secret_key_2026_separate_auth"

# App Environment
NODE_ENV="development"
```

### 3. Setup Database Schema
```bash
# Push schema to MySQL / TiDB
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 4. Seed Super Admin
```bash
npx tsx prisma/seed-admin.ts
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
│   ├── schema.prisma          # Database schema (Multi-tenant, Attendance, WorkProof, Leads)
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
│   │   │   └── logins/        # Raw LoginLog audit trail feed
│   │   ├── attendance/        # 📍 FIELD ATTENDANCE & WORK PROOFS (SOD/EOD Selfie+GPS)
│   │   ├── employees/         # 👥 TEAM & PERMISSION MANAGEMENT (Role/Lead switches/Password reset)
│   │   ├── dashboard/         # Tenant sales dashboard & trends
│   │   ├── leads/             # Lead management, pipeline & Excel import
│   │   │   └── [id]/          # Lead profile, timeline, assignee selector & call recordings
│   │   ├── follow-ups/        # Bucketed follow-up engine
│   │   ├── inbox/             # Customer email messages hub
│   │   ├── reports/           # 4-Chart analytics & conversion funnels
│   │   ├── settings/          # Custom fields & user profile
│   │   └── api/               # Next.js App Router REST API endpoints
│   │       ├── attendance/    # SOD/EOD Clock-in/out endpoints
│   │       ├── work-proof/    # Photo, call recording & task evidence endpoints
│   │       ├── employees/     # Team management, permissions & password reset
│   │       ├── leads/         # Lead CRUD, duplicate-check & import
│   │       └── admin/         # Super Admin telemetry & businesses
│   ├── components/
│   │   ├── attendance/        # SelfieLocationCapture, WorkProofModal
│   │   ├── employees/         # InviteEmployeeModal
│   │   ├── leads/             # ExcelImportModal, SendEmailModal, ActivityTimeline
│   │   ├── followups/         # CompleteFollowUpModal
│   │   ├── layout/            # Sidebar, Header, MobileTabBar, AppShell
│   │   └── ui/                # Button, Card, Badge, Input, Modal, Toast
│   ├── lib/
│   │   ├── auth.ts            # Tenant session management (leadflow_session)
│   │   ├── admin-auth.ts      # Super Admin session management (admin_session)
│   │   ├── db.ts              # Prisma singleton client
│   │   ├── imageUtils.ts      # Client-side automatic image compressor
│   │   └── utils.ts           # Formatting helpers & WhatsApp/Phone URL builders
│   ├── types/                 # Shared TypeScript interfaces
│   └── middleware.ts          # Security middleware protecting admin & tenant routes
└── package.json
```

---

## 📡 REST API Reference

### 📍 Attendance & Field Sales Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/attendance` | Get today's attendance status (and full team attendance for Admins) |
| `POST` | `/api/attendance` | Start of Day (SOD) Clock-In with live selfie and GPS location |
| `PATCH` | `/api/attendance` | End of Day (EOD) Clock-Out with selfie, GPS & work summary |
| `GET` | `/api/work-proof` | List field work proofs and attached call recordings |
| `POST` | `/api/work-proof` | Log new work proof (photo, audio file/mic, GPS, optional lead tag) |

### 👥 Team & Permission Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees` | List all employees in current business (Admin only) |
| `POST` | `/api/employees/invite` | Create and invite new field agent |
| `PATCH` | `/api/employees` | Update employee role, `canViewAllLeads`, `canAddLeads`, or reset password |
| `DELETE` | `/api/employees` | Remove employee from company team |

### 🏢 Tenant CRM Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Tenant login (records telemetry to `LoginLog`) |
| `POST` | `/api/auth/register` | New business signup |
| `GET` | `/api/leads` | Paginated lead list (filtered by `canViewAllLeads` permission) |
| `POST` | `/api/leads` | Create new lead (enforces `canAddLeads` permission) |
| `GET` | `/api/leads/:id` | Lead details, activities, follow-ups & attached audio proofs |
| `PATCH` | `/api/leads/:id` | Update lead status, details, or re-assign to agent |
| `POST` | `/api/leads/import` | Batch Excel / CSV lead import |
| `GET` | `/api/follow-ups` | Bucketed follow-ups (`overdue`, `today`, `upcoming`, etc.) |
| `GET` | `/api/reports` | Visual analytics & conversion funnel data |

---

## 🔒 Security Architecture
- **Password Hashing**: Industry-standard `bcryptjs` with salt rounds = 10.
- **Isolated JWT Secret Keys**: Tenant sessions and Super Admin sessions utilize completely separate secrets, payload types, and HTTP-only cookies.
- **Role & Permission Isolation**:
  - Non-admin users are blocked from team management, reports, other agents' attendance, and bulk company settings.
  - Sub-agent visibility restricted dynamically via database queries scoped to `{ assignedUserId: session.userId }` when `canViewAllLeads` is false.
- **SQL Injection Prevention**: Parameterized queries via Prisma ORM.
- **Payload Protection**: Client-side image compression keeps image payloads under 70KB, preventing server memory strain and HTTP 413 limits.

---

## 📄 License
This project is proprietary software built for **LeadFlow SaaS CRM**. All rights reserved.
