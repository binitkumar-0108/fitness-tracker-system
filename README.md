# Fitness Tracker System

A full-stack fitness and health tracking platform with authentication, real-time tracking, and personalized health insights.

## 🚀 Features

- 🔐 Firebase Authentication (secure login/signup)
- 📊 Health Dashboard with analytics and progress tracking
- 🏋️ Workout & Exercise Tracking system
- 🥗 Smart Diet Planner with AI-powered meal recommendations
- 🍽️ Nutrition tracking with macros (protein, carbs, fats)
- 🧠 Smart Health Insights & Alert System (daily score, warnings, suggestions)
- 🧬 Ayurvedic Health Assessment System (Dosha-based insights)
- ⚡ Real-time data fetching using tRPC
- 🗄️ PostgreSQL (Supabase) with Drizzle ORM
- 🎨 Modern UI with React + Tailwind
- 🚀 CI/CD with GitHub Actions
- 🌐 Deployed on Vercel + Render
---

## 🖼️ Screenshots

### 🏠 Homepage
Modern AI-powered fitness landing page with clean UI and feature highlights.

![Homepage](./screenshots/homepage.png)

---

### 📊 Dashboard
Track health metrics, workouts, and progress in a centralized dashboard.

![Dashboard](./screenshots/dashboard.png)

---

### 🏋️ Workout Tracking
Log exercises and monitor workout performance over time.

![Workout](./screenshots/workout.png)

## 🌐 Live Demo

👉 https://fitness-tracker-system.vercel.app


### Frontend
- React
- Vite
- TailwindCSS
- TanStack Query

### Backend
- Node.js
- Express
- tRPC API layer

### Database
- PostgreSQL (Supabase)
- Drizzle ORM

### Authentication
- Firebase Auth

### DevOps & Infrastructure
- GitHub Actions (CI/CD)
- Vercel (Frontend Deployment)
- Render (Backend Deployment)
- Supabase (Managed Database)


## 🏗️ Architecture

This project follows a full-stack modular architecture using React, Express, and tRPC for type-safe communication.

👉 For detailed system design, see [ARCHITECTURE.md](./ARCHITECTURE.md)

## 📁 Project Structure
fitness-tracker-system
├── client
│   ├── public
│   │   ├── images
│   │   │   └── exercises
│   │   │       ├── bench_press.png
│   │   │       ├── bicep_curls.png
│   │   │       ├── crunches.png
│   │   │       ├── cycling.png
│   │   │       ├── deadlift.png
│   │   │       ├── glute_bridges.png
│   │   │       ├── lateral_raises.png
│   │   │       ├── plank.png
│   │   │       ├── pullups.png
│   │   │       ├── pushup.png
│   │   │       ├── running.png
│   │   │       ├── shoulder_press.png
│   │   │       ├── squat.png
│   │   │       ├── tricep_dips.png
│   │   │       ├── weightlifting.png
│   │   │       ├── wrist_curls.png
│   │   │       └── yoga.png
│   │   ├── meals
│   │   │   ├── avocado_toast.png
│   │   │   ├── baked_salmon.png
│   │   │   ├── berry_oat_bowl.jpg
│   │   │   ├── chia_pudding.png
│   │   │   ├── chickpea_salad_user.png
│   │   │   ├── egg_white_omelette.png
│   │   │   ├── falafel_plate.png
│   │   │   ├── lean_turkey_chilli.jpg
│   │   │   ├── lentil_soup.png
│   │   │   ├── oats_fruits.png
│   │   │   ├── ratatouille.png
│   │   │   ├── smoothie_bowl.png
│   │   │   └── veggie_korma_user.png
│   │   └── neon-bg.png
│   ├── src
│   │   ├── _core
│   │   │   └── hooks
│   │   │       └── useAuth.ts
│   │   ├── components
│   │   │   ├── ui
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── alert-dialog.tsx
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── aspect-ratio.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── breadcrumb.tsx
│   │   │   │   ├── button-group.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── carousel.tsx
│   │   │   │   ├── chart.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── collapsible.tsx
│   │   │   │   ├── command.tsx
│   │   │   │   ├── context-menu.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── drawer.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── empty.tsx
│   │   │   │   ├── field.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── hover-card.tsx
│   │   │   │   ├── input-group.tsx
│   │   │   │   ├── input-otp.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── item.tsx
│   │   │   │   ├── kbd.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── menubar.tsx
│   │   │   │   ├── navigation-menu.tsx
│   │   │   │   ├── pagination.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── radio-group.tsx
│   │   │   │   ├── resizable.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── slider.tsx
│   │   │   │   ├── sonner.tsx
│   │   │   │   ├── spinner.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── toggle-group.tsx
│   │   │   │   ├── toggle.tsx
│   │   │   │   └── tooltip.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── DashboardLayoutSkeleton.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ManusDialog.tsx
│   │   │   ├── Map.tsx
│   │   │   └── Markdown.tsx
│   │   ├── contexts
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks
│   │   │   ├── useComposition.ts
│   │   │   ├── useFileUpload.ts
│   │   │   ├── useMobile.tsx
│   │   │   └── usePersistFn.ts
│   │   ├── lib
│   │   │   ├── auth.ts
│   │   │   ├── firebase.ts
│   │   │   ├── trpc.ts
│   │   │   └── utils.ts
│   │   ├── pages
│   │   │   ├── AyurvedicAssessment.tsx
│   │   │   ├── ComponentShowcase.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DietPlanner.tsx
│   │   │   ├── ExerciseTracker.tsx
│   │   │   ├── HealthAlerts.tsx
│   │   │   ├── HealthQuestionnaire.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── NotFound.tsx
│   │   │   └── Profile.tsx
│   │   ├── App.tsx
│   │   ├── const.ts
│   │   ├── index.css
│   │   └── main.tsx
│   └── index.html
├── dist
│   ├── public
│   │   ├── assets
│   │   │   ├── index-BPpqu48F.js
│   │   │   └── index-zEXlfA_1.css
│   │   ├── images
│   │   │   └── exercises
│   │   │       ├── bench_press.png
│   │   │       ├── bicep_curls.png
│   │   │       ├── crunches.png
│   │   │       ├── cycling.png
│   │   │       ├── deadlift.png
│   │   │       ├── glute_bridges.png
│   │   │       ├── lateral_raises.png
│   │   │       ├── plank.png
│   │   │       ├── pullups.png
│   │   │       ├── pushup.png
│   │   │       ├── running.png
│   │   │       ├── shoulder_press.png
│   │   │       ├── squat.png
│   │   │       ├── tricep_dips.png
│   │   │       ├── weightlifting.png
│   │   │       ├── wrist_curls.png
│   │   │       └── yoga.png
│   │   ├── meals
│   │   │   ├── avocado_toast.png
│   │   │   ├── baked_salmon.png
│   │   │   ├── berry_oat_bowl.jpg
│   │   │   ├── chia_pudding.png
│   │   │   ├── chickpea_salad_user.png
│   │   │   ├── egg_white_omelette.png
│   │   │   ├── falafel_plate.png
│   │   │   ├── lean_turkey_chilli.jpg
│   │   │   ├── lentil_soup.png
│   │   │   ├── oats_fruits.png
│   │   │   ├── ratatouille.png
│   │   │   ├── smoothie_bowl.png
│   │   │   └── veggie_korma_user.png
│   │   ├── index.html
│   │   └── neon-bg.png
│   └── index.js
├── drizzle
│   ├── meta
│   │   ├── _journal.json
│   │   └── 0000_snapshot.json
│   ├── migrations
│   ├── 0000_aspiring_loners.sql
│   ├── relations.ts
│   └── schema.ts
├── patches
│   └── wouter@3.7.1.patch
├── screenshots
│   ├── dashboard.png
│   ├── homepage.png
│   └── workout.png
├── scripts
│   └── list_tables.js
├── server
│   ├── _core
│   │   ├── project
│   │   ├── types
│   │   │   ├── cookie.d.ts
│   │   │   └── manusTypes.ts
│   │   ├── chat.ts
│   │   ├── context.ts
│   │   ├── dataApi.ts
│   │   ├── env.ts
│   │   ├── firebaseAdmin.ts
│   │   ├── imageGeneration.ts
│   │   ├── index.ts
│   │   ├── map.ts
│   │   ├── notification.ts
│   │   ├── patchedFetch.ts
│   │   ├── systemRouter.ts
│   │   ├── trpc.ts
│   │   ├── vite.ts
│   │   └── voiceTranscription.ts
│   ├── services
│   │   ├── insightEngine.ts
│   │   └── metricService.ts
│   ├── auth.logout.test.ts
│   ├── critical_features.test.ts
│   ├── db.ts
│   ├── health.test.ts
│   ├── routers.ts
│   └── storage.ts
├── shared
│   ├── _core
│   │   └── errors.ts
│   ├── const.ts
│   └── types.ts
├── ARCHITECTURE.md
├── check-firebase.js
├── check-users.js
├── components.json
├── drizzle.config.ts
├── LICENSE
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── README.md
├── tsc_output.txt
├── tsconfig.json
├── vercel.json
├── vite.config.ts
└── vitest.config.ts
```
