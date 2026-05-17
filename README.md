# 🏋️ FlexFit — AI-Powered Fitness Platform

A full-stack MERN fitness ecosystem connecting clients, trainers, and vendors with intelligent features including gamification, nutrition sync, diet planning, live sessions, and a marketplace.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## Overview

FlexFit is a multi-role fitness platform with four user types:

| Role | What they do |
|------|-------------|
| **Client** | Enrol in programs, log workouts, track progress, shop from marketplace, earn FlexPoints |
| **Trainer** | Create programs, assign diet plans, run live sessions, view client proofs, recommend products |
| **Vendor** | List fitness products and meals, manage orders, get verified by admin |
| **Admin** | Approve/reject trainers and vendors, view certificates |

---

## Tech Stack

### Backend
- **Node.js** + **Express.js** — REST API
- **MongoDB** + **Mongoose** — Database
- **Socket.IO** — Real-time messaging and group chat
- **Razorpay** — Payment gateway
- **Cloudinary** + **Multer** — File and image uploads
- **JWT** — Authentication
- **bcryptjs** — Password hashing
- **Web Push (VAPID)** — Push notifications

### Frontend
- **React 18** + **Vite**
- **React Router v6** — Client-side routing
- **Axios** — HTTP client
- **Socket.IO Client** — Real-time features

### DevOps
- **Render** — Backend hosting
- **Vercel** — Frontend hosting
- **MongoDB Atlas** — Cloud database

---

## Features

### 👤 Authentication & Roles
- Register as Client, Trainer, or Vendor
- JWT-based auth with 7-day tokens
- Role-based route protection

### 🏋️ Client Features
- **Dashboard** — Hero banner, streak ring, quick actions, today's diet preview
- **My Programs** — Enrol in trainer programs, view assigned workouts day by day
- **Workout Session** — Start → Exercise Timer → Rest Timer → Complete flow with per-exercise set tracking
- **Workout Logger** — Free-form daily log with workout type selector
- **Progress Tracker** — Weight history, completion stats
- **Diet Plan Viewer** — Trainer-assigned weekly meal plan with calorie rings and macro breakdown
- **Proof of Work** — Upload workout/meal photos, build streak, trainers see submissions
- **Marketplace** — Browse products from verified vendors, Razorpay checkout, order tracking, cancel with reason
- **FlexPoints & Rewards** — Earn points on workouts (+10) and orders (+1/₹10), milestone coupons at 10/25/50/100 workouts
- **Leaderboard** — Compare points with other clients
- **Group Chat** — Program-specific group messaging
- **Messages** — Direct inbox with trainers
- **My Diet Plan** — Full diet plan with day tabs, weekly calorie bar chart, meal slot cards

### 💪 Trainer Features
- **Overview** — Stats (clients, revenue, rating), program list, monthly activity
- **Program Builder** — Multi-day workout programs with exercises, sets, reps, rest, YouTube video links
- **Daily Workout Assigner** — Assign specific workouts to specific dates for enrolled clients
- **Diet Plan Builder** — 7-day meal plan with breakfast/lunch/dinner/snacks, calorie targets, macros, linked vendor products
- **Client Proofs Feed** — View clients' workout and meal photo submissions grouped by date
- **Recommend Products** — Tag marketplace products for specific programs
- **Live Sessions** — Schedule and share meeting links
- **Verification** — Upload certificate for admin review

### 🏪 Vendor Features
- **Vendor Dashboard** — Overview with revenue, order stats, inventory alerts
- **Product Management** — Add/edit/delete products with image URL, nutrition info, group buy settings
- **Order Management** — View and advance order status (confirmed → preparing → shipped → delivered), see cancellation reasons
- **Verification** — Upload FSSAI/business license for admin approval
- **Auto-refresh** — Orders poll every 30 seconds

### 🛡️ Admin Features
- **Trainer Review** — Approve/reject trainer applications with certificate viewing
- **Vendor Review** — Approve/reject vendors, view license certificates, provide rejection reasons

### 🧠 Smart Features
- **Nutrition Sync** — After logging a workout, get 2-3 product recommendations matched to workout type (Strength → high-protein, Cardio → electrolytes, etc.)
- **Streak Discounts** — 7-day streak: 7% off, 14-day: 12% off, 30-day: 20% off marketplace purchases
- **Group Buy** — Products unlock discounts when enough buyers join
- **Milestone Coupons** — Auto-generated discount codes at workout milestones

---

## Project Structure

```
flexfit/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── clientController.js
│   │   ├── coachingController.js
│   │   ├── dailyWorkoutController.js
│   │   ├── dietPlanController.js
│   │   ├── groupChatController.js
│   │   ├── marketplaceController.js
│   │   ├── messageController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── proofOfWorkController.js
│   │   ├── programController.js
│   │   ├── rewardsController.js
│   │   ├── trainerController.js
│   │   ├── uploadController.js
│   │   ├── vendorController.js
│   │   └── workoutController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── upload.js          ← Cloudinary via multer-storage-cloudinary
│   ├── models/
│   │   ├── Client.js
│   │   ├── CoachingRelationship.js
│   │   ├── Coupon.js
│   │   ├── DailyWorkout.js
│   │   ├── DietPlan.js
│   │   ├── Enrollment.js
│   │   ├── GroupMessage.js
│   │   ├── LiveSession.js
│   │   ├── Message.js
│   │   ├── Order.js
│   │   ├── Organization.js
│   │   ├── Payment.js
│   │   ├── Product.js
│   │   ├── Program.js
│   │   ├── ProofOfWork.js
│   │   ├── Trainer.js
│   │   ├── TrainerRecommendation.js
│   │   ├── User.js
│   │   ├── Vendor.js
│   │   ├── WorkoutCompletion.js
│   │   ├── WorkoutLog.js
│   │   ├── WorkoutProgram.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── coaching.js
│   │   ├── dailyWorkouts.js
│   │   ├── dietPlans.js
│   │   ├── groupChat.js
│   │   ├── marketplace.js
│   │   ├── messages.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   ├── proofOfWork.js
│   │   ├── programs.js
│   │   ├── rewards.js
│   │   ├── sessions.js
│   │   ├── trainers.js
│   │   ├── uploads.js
│   │   ├── vendors.js
│   │   └── workouts.js
│   ├── services/
│   │   ├── emailService.js
│   │   └── pushNotification.js
│   ├── utils/
│   │   └── milestones.js      ← Auto-coupon generation
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── sw.js              ← Service worker for push notifications
    ├── src/
    │   ├── components/
    │   │   ├── admin/
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   └── VerificationReview.jsx
    │   │   ├── auth/
    │   │   │   ├── Login.jsx
    │   │   │   ├── Register.jsx
    │   │   │   └── RoleSelection.jsx
    │   │   ├── client/
    │   │   │   ├── ClientDietLog.jsx
    │   │   │   ├── ClientOverview.jsx
    │   │   │   ├── ClientProfile.jsx
    │   │   │   ├── DietLog.jsx
    │   │   │   ├── Marketplace.jsx
    │   │   │   ├── MyRegisteredPrograms.jsx
    │   │   │   ├── MyRewards.jsx
    │   │   │   ├── ProofOfWork.jsx
    │   │   │   ├── ProgressTracker.jsx
    │   │   │   ├── ProgramMarketplace.jsx
    │   │   │   ├── TrainerBrowse.jsx
    │   │   │   └── WorkoutLogger.jsx
    │   │   ├── common/
    │   │   │   ├── Footer.jsx
    │   │   │   ├── GroupChat.jsx
    │   │   │   ├── GroupChatList.jsx
    │   │   │   ├── Inbox.jsx
    │   │   │   ├── Leaderboard.jsx
    │   │   │   ├── Navbar.jsx
    │   │   │   └── ProtectedRoute.jsx
    │   │   ├── trainer/
    │   │   │   ├── ClientList.jsx
    │   │   │   ├── ClientProofFeed.jsx
    │   │   │   ├── LiveSessionManager.jsx
    │   │   │   ├── TrainerDietPlanBuilder.jsx
    │   │   │   ├── TrainerOverview.jsx
    │   │   │   ├── TrainerProfileView.jsx
    │   │   │   ├── TrainerProgramBuilder.jsx
    │   │   │   ├── TrainerProgramManager.jsx
    │   │   │   ├── TrainerRecommendProducts.jsx
    │   │   │   └── VerificationStatus.jsx
    │   │   └── Vendor/
    │   │       └── VendorDashboard.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── hooks/
    │   │   ├── useApi.js
    │   │   └── useAuth.js
    │   ├── pages/
    │   │   ├── About.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Home.jsx
    │   │   ├── MarketplacePage.jsx
    │   │   ├── Pricing.jsx
    │   │   └── Profile.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── paymentService.js
    │   │   └── pushNotificationService.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account (free tier)
- Razorpay account (test mode)

### 1. Clone the repository

```bash
git clone https://github.com/Srijith2006/FLEX_FIT.git
cd FLEX_FIT
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
node server.js
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create `backend/.env`:

```env
# Server
PORT=5000

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/flexfit

# Auth
JWT_SECRET=your_jwt_secret_here

# Razorpay (use test keys for development)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Cloudinary (file/image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Web Push Notifications (VAPID)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=admin@yourapp.com

# Frontend URL (for CORS)
CLIENT_URL=https://your-frontend.vercel.app
```

Create `frontend/.env`:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (role: client/trainer/vendor) |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Programs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/programs` | List all published programs |
| POST | `/api/programs` | Create program (trainer) |
| GET | `/api/programs/enrolled` | Client's enrolled programs |
| POST | `/api/programs/:id/enroll` | Enrol in program |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace/products` | List products (with category/search filter) |
| GET | `/api/marketplace/recommend-by-workout/:type` | AI-matched products after workout |
| POST | `/api/orders` | Place order (Razorpay) |
| POST | `/api/orders/verify` | Verify payment |
| POST | `/api/orders/:id/cancel` | Cancel order with reason |

### Vendors
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vendors/register` | Create vendor profile |
| GET | `/api/vendors/me` | Get vendor profile |
| PUT | `/api/vendors/me/certificate` | Upload FSSAI certificate |
| POST | `/api/vendors/products` | Add product |
| PATCH | `/api/vendors/:id/review` | Admin approve/reject vendor |

### Rewards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rewards/points` | Get FlexPoints balance |
| GET | `/api/rewards/coupons` | Get milestone coupons |

### Diet Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/diet-plans` | Create diet plan (trainer) |
| GET | `/api/diet-plans/mine` | Trainer's plans |
| GET | `/api/diet-plans/client-plans` | Plans assigned to client |
| PUT | `/api/diet-plans/:id/day/:dayIndex` | Update a day's meals |

### Proof of Work
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/proof/upload` | Upload workout/meal photo |
| GET | `/api/proof/mine` | Client's proofs + streak |
| GET | `/api/proof/trainer-feed` | All client proofs (trainer) |

---

## Deployment

### Backend → Render
1. Connect GitHub repo to Render
2. Set **Root Directory** to `backend`
3. Set **Build Command** to `npm install`
4. Set **Start Command** to `node server.js`
5. Add all environment variables in Render dashboard

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set **Root Directory** to `frontend`
3. Add `VITE_API_URL` environment variable
4. Deploy

---

## FlexPoints System

| Action | Points |
|--------|--------|
| Log a workout | +10 pts |
| Order delivered (per ₹10 spent) | +1 pt |
| 10 workouts milestone | 10% off coupon |
| 25 workouts milestone | 15% off coupon |
| 50 workouts milestone | 20% off coupon |
| 100 workouts milestone | 25% off coupon |

### Member Tiers
| Tier | Lifetime Points |
|------|----------------|
| 🥉 Bronze | 0 – 499 |
| 🥈 Silver | 500 – 1,499 |
| 🥇 Gold | 1,500 – 3,999 |
| 💎 Platinum | 4,000+ |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built by Srijith S · FlexFit v1.0*
