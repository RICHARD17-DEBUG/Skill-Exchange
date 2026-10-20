# Skill Exchange Platform — Credits-Only Learning System

A functional, modern full-stack web application designed for a **strictly non-monetary, credits-only skill exchange economy**. Users earn skill credits by teaching peer learners and spend credits to book 1-on-1 sessions with expert providers.

---

## 🌟 Core System Highlights

* **Zero Currency Policy:** Strictly no fiat currency, rupees, dollars, payment gateways, or monetary pricing. All balances and transactions operate entirely using **Skill Credits**.
* **100 Welcome Credits:** Every newly registered user automatically receives 100 skill credits to immediately start learning.
* **Atomic Credit Engine:** Validates balances, prevents negative balances, enforces single credit deduction on booking confirmation, issues automatic refunds on eligible cancellations, and awards teaching credits upon completion.
* **Three Dedicated Dashboards:**
  * **Skill Seeker (Learner):** Browse catalog, filter by credits/ratings, schedule sessions, view balance & ledger, join live video rooms, submit feedback.
  * **Skill Provider:** Publish skill offerings (5–200 credits), configure availability schedule, approve/reject bookings, mark sessions completed to earn credits.
  * **Administrator:** Live stats on credit circulation, user management, account suspension/reactivation, provider verification, review moderation, and full transaction audit ledger.
* **Interactive 1-Click Demo Logins:** Instant evaluator buttons for Learner, Provider, and Administrator accounts.
* **Dual Execution Mode:** Runs out-of-the-box using built-in in-memory MongoDB fallback or standard local/remote MongoDB.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** (v18+)
* **pnpm** or **npm**

### Installation
Run the following in the project root:

```bash
# 1. Install all backend and frontend dependencies
pnpm --prefix server install
pnpm --prefix client install
```

### Running the Application

```bash
# Start both Backend API (Port 5000) and Frontend (Port 5173) concurrently:
npm run dev
```

* **Frontend URL:** [http://localhost:5173](http://localhost:5173)
* **Backend API URL:** [http://localhost:5000](http://localhost:5000)
* **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Default Demonstration Accounts

You can click any of the **Quick Demo Account** buttons on the Login page, or use these credentials:

| Role | Email | Password | Starting Credits |
|---|---|---|---|
| **Administrator** | `admin@skillexchange.org` | `Password123!` | 500 Credits |
| **Skill Provider (React/Python)** | `david.provider@example.com` | `Password123!` | 240 Credits |
| **Skill Provider (UI/UX Figma)** | `sarah.provider@example.com` | `Password123!` | 195 Credits |
| **Skill Provider (Video Editing)** | `marcus.provider@example.com` | `Password123!` | 160 Credits |
| **Skill Seeker (Learner 1)** | `alex.learner@example.com` | `Password123!` | 85 Credits |
| **Skill Seeker (Learner 2)** | `maya.learner@example.com` | `Password123!` | 120 Credits |

---

## 🧪 Automated Business Rule Tests

Run the test suite:

```bash
pnpm --prefix server test
```

### Test Coverage Highlights:
1. `User Registration & 100 Welcome Credits Ledger Grant`
2. `Rejection of Booking When Balance Is Insufficient`
3. `Single Credit Deduction & Duplicate Deduction Prevention`
4. `Credit Restoration Upon Cancellation with Refund Ledger Record`
5. `Awarding Teaching Credits & Duplicate Reward Prevention`
6. `Single Review Eligibility Only After Completed Sessions`
7. `Overlapping Booking Conflict Prevention`

---

## 📐 Object-Oriented Analysis & Design (OOAD) Deliverables

Located in the [`docs/uml/`](docs/uml/) directory:
* [`use_case_diagram.puml`](docs/uml/use_case_diagram.puml) — Complete Use Case Diagram for Learner, Provider, and Administrator.
* [`class_diagram.puml`](docs/uml/class_diagram.puml) — Class Diagram with attributes, operations, and relationships.
* [`sequence_diagram.puml`](docs/uml/sequence_diagram.puml) — Sequence Diagram tracing booking request, credit deduction, and completion reward.
* [`activity_diagram.puml`](docs/uml/activity_diagram.puml) — End-to-end Activity Diagram of the skill exchange lifecycle.
* [`state_diagram.puml`](docs/uml/state_diagram.puml) — State Diagram of the booking lifecycle (`Pending`, `Confirmed`, `Completed`, `Cancelled`, `Rejected`).
* [`component_diagram.puml`](docs/uml/component_diagram.puml) — Component Diagram of client modules, server controllers, CreditEngine, and MongoDB.
* [`deployment_diagram.puml`](docs/uml/deployment_diagram.puml) — Deployment Diagram depicting browser, Node server runtime, and database.

Comprehensive documentation is provided in [`docs/system_architecture_and_ooad.md`](docs/system_architecture_and_ooad.md).

---

## 📁 Project Directory Structure

```
skill-exchange/
├── client/                      # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/                 # Axios client with interceptors
│   │   ├── context/             # AuthContext (JWT, active roles, balance refresh)
│   │   ├── components/          # Navbar, Footer, SkillCard, CreditBadge, Modals
│   │   ├── pages/
│   │   │   ├── learner/         # Dashboard, Bookings, Credit Ledger, Profile
│   │   │   ├── provider/        # Dashboard, Listings, Availability, Sessions
│   │   │   ├── admin/           # Dashboard Stats, Users, Verifications, Ledger
│   │   │   ├── LandingPage.tsx
│   │   │   ├── ExploreSkillsPage.tsx
│   │   │   ├── SkillDetailPage.tsx
│   │   │   ├── ProviderProfilePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   └── types/               # TypeScript interfaces
├── server/                      # Node.js + Express + TypeScript + Mongoose
│   ├── src/
│   │   ├── config/              # MongoDB connection & in-memory fallback
│   │   ├── controllers/         # Auth, Skills, Bookings, Credits, Reviews, Admin
│   │   ├── middleware/          # JWT authentication & role-based authorization
│   │   ├── models/              # Mongoose schemas (User, Booking, Listing, Ledger)
│   │   ├── seed/                # Realistic demo dataset
│   │   ├── tests/               # Automated Jest business rule tests
│   │   ├── utils/               # Atomic CreditEngine
│   │   ├── app.ts               # Express configuration
│   │   └── index.ts             # Server entrypoint
├── docs/                        # Academic OOAD Documentation
│   └── uml/                     # 7 Valid PlantUML diagrams
├── scripts/                     # Cross-platform development runner
├── .env.example                 # Environment configuration template
└── package.json                 # Project orchestrator
```

---

## 📄 License
MIT License. Built for education and skill exchange.