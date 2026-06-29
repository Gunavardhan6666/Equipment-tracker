# Equipment Tracking System

A full-stack web application designed to manage equipment inventory, track item availability, and streamline user reservations. The system simplifies the allocation of individual items and pre-configured kits by providing dedicated interfaces for administrators and students.

## 📸 Demo
[Live Demo](https://equipment-tracker-chi.vercel.app/login)

## 🚀 Key Features

* **Role-Based Access Control:** Distinct user views (Admin/Student) to separate inventory management tasks from equipment reservation requests.
* **Inventory & Kit Management:** Organized tracking of both individual pieces of equipment and logical groupings (kits) for simplified borrowing.
* **Automated Reservation Flow:** Streamlined booking process that updates inventory availability and manages checkout states.
* **Secure Authentication:** Implementation of JSON Web Tokens (JWT) for secure user login, session management, and protected API endpoints.

## 🛠 Tech Stack

* **Frontend:** React, Tailwind CSS
* **Backend:** Node.js, Express
* **Database:** PostgreSQL (Neon)

## 💡 Challenges & Learnings

* **Challenge:** Implementing secure and synchronized state management between the frontend client and the backend server, particularly around managing JWT authentication state, protecting backend API routes with middleware, and preventing unauthorized access to administrative features.
* **Learning:** Gained a practical understanding of secure route protection, the importance of robust API middleware, and how to effectively integrate backend authentication strategies with frontend component rendering logic.

## ⚙️ How to run locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Gunavardhan6666/Equipment-tracker
   ```
2. Install dependencies (you may need to do this in both the frontend and backend directories):
   ```bash
   npm install
   ```
3. Set up environment variables:
   Add your `.env` file to the backend directory (ensure you include database credentials and JWT secret).
4. Start the development servers:
   ```bash
   # Start your server (for the backend)
   npm run dev
   
   # Run the frontend
   npm run dev
   ```
