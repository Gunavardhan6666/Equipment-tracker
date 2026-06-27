<div align="center">
  <img src="https://via.placeholder.com/150x150/111827/6366f1?text=ET" alt="Equipment Tracker Logo" width="120" />
  <h1>Equipment Tracker</h1>
  <p><strong>A Full-Stack Hardware Inventory & Reservation Engine</strong></p>
</div>

<br />

Welcome to **Equipment Tracker** — a highly scalable, full-stack web application designed for university departments, media studios, and enterprise IT teams to seamlessly manage hardware inventory, coordinate user reservations, and automate equipment lifecycle states.

Engineered with a focus on modern web standards, strict security practices, and a world-class user experience, this platform replaces chaotic spreadsheets with a beautiful, dynamic, and automated scheduling engine.

---

## ✨ Key Features

This application goes beyond basic CRUD operations by implementing sophisticated state-management and scheduling logic:

*   **⏱️ Smart Overdue Engine**: An automated background job that seamlessly detects expired reservations and flags them as `overdue` without relying on resource-heavy cron intervals, ensuring free-tier cloud safety.
*   **⏳ Dynamic Turnaround Buffers**: Enforces mathematical cooling-off periods (e.g., 3 hours for camera sensor cleaning) between bookings to prevent back-to-back overlaps and ensure equipment maintenance.
*   **🗓️ Interactive Availability Calendar**: Employs a custom line-sweep algorithm to calculate continuous available time slots on the fly, allowing users to pick times safely without guessing when an item is free.
*   **🛠️ Automated Maintenance State**: Items flagged for repair (`in_maintenance`) automatically re-enter the general availability pool after a set period, completely removing administrative overhead.
*   **🎒 Kit Booking Engine**: Users can reserve bundled "kits." The backend mathematically intersects the availability of all interchangeable items within the kit's category to guarantee sufficient inventory for the exact time window.
*   **📧 Native DNS Email Validation**: Ensures only legitimate institution emails (via MX record verification) can register, stopping spam at the gateway.
*   **🔐 Role-Based Access Control (RBAC)**: Securely separates privileges across Students, Professors, and Admins using JWT authentication.

---

## 🛠️ Tech Stack

Built entirely with a modern JavaScript ecosystem for maximum performance and developer velocity.

### Frontend
*   **React (Vite)**: Lightning-fast development and optimized production builds.
*   **Tailwind CSS**: Custom, beautiful UI system built with utility classes, featuring deep dark-mode integration and glassmorphism components.
*   **React Router**: Client-side routing with secure, role-protected routes.

### Backend
*   **Node.js & Express**: High-performance RESTful API architecture.
*   **PostgreSQL**: Relational database for absolute data integrity, managed via native `pg` driver (no heavy ORMs).
*   **Express Validator**: Robust middleware for payload sanitization.
*   **JSON Web Tokens (JWT)**: Stateless, secure authentication.

---

## 🚀 Getting Started Locally

Follow these instructions to run the project on your local machine.

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [PostgreSQL](https://www.postgresql.org/) (v14+ recommended)

### 2. Clone the Repository
```bash
git clone https://github.com/yourusername/equipment-tracker.git
cd equipment-tracker
```

### 3. Database Setup
Create a new PostgreSQL database (e.g., `equipment_tracker`).
Execute the SQL schema located in `backend/src/db/schema.sql` against your new database to generate the tables.

### 4. Environment Variables
You need two `.env` files — one for the backend, one for the frontend.

**Backend (`backend/.env`):**
Create a `.env` file in the `backend/` directory using this template:
```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
# Format: postgres://username:password@host:port/database
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/equipment_tracker

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_string_here
JWT_EXPIRES_IN=7d

# CORS (Frontend URL)
CLIENT_ORIGIN=http://localhost:5173
```

**Frontend (`frontend/.env`):**
Create a `.env` file in the `frontend/` directory:
```ini
# API URL (Used in production or if running on a different port)
VITE_API_URL=http://localhost:5000/api
```

### 5. Install & Run

**Start the Backend:**
```bash
cd backend
npm install
npm run dev
```

**Start the Frontend:**
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The application will now be running at `http://localhost:5173`.

---

## 🔒 Security Posture

*   **No Hardcoded Secrets**: All sensitive tokens and database URIs are strictly loaded via process environment variables.
*   **CORS Protected**: The Express API explicitly rejects cross-origin requests from unauthorized domains.
*   **Parameter Sanitization**: Every API route leverages strict validation to prevent SQL injection and XSS.
*   **Production SSL**: The PostgreSQL connection pool is configured to enforce SSL for cloud deployments.

---

<div align="center">
  <p>Engineered with 💡 and ☕ for high-performance inventory management.</p>
</div>
