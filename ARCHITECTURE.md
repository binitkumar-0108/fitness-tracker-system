# Health & Wellness Platform - System Architecture

## Executive Summary

This document outlines the complete system architecture for the comprehensive Health & Wellness Platform built with React 19, Express 4, tRPC 11, and a custom PostgreSQL database (managed via Drizzle ORM and hosted on Supabase). The platform enables users to track fitness activities, manage nutrition, receive personalized health recommendations, and monitor progress utilizing a local, highly-dynamic deterministic AI Insight Engine.

---

## 1. Project Folder Structure

The repository is organized as a unified monorepo containing client and server components:

```
fitness-tracker-mvp/
├── client/
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── _core/                 # Core utilities
│   │   │   └── hooks/
│   │   │       └── useAuth.ts     # Firebase Authentication hook
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui custom design components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── DashboardLayoutSkeleton.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ManusDialog.tsx    # Chat sandbox modal
│   │   │   ├── Map.tsx            # Gym lookup maps
│   │   │   └── Markdown.tsx       # MD rendering helper
│   │   ├── pages/
│   │   │   ├── Home.tsx                   # Landing / login page
│   │   │   ├── Dashboard.tsx              # Main dashboard hub
│   │   │   ├── HealthQuestionnaire.tsx    # Initial onboarding form
│   │   │   ├── Profile.tsx                # Manage health preferences
│   │   │   ├── ExerciseTracker.tsx        # Activity logging
│   │   │   ├── DietPlanner.tsx            # Nutrition tracking & meal planner
│   │   │   ├── AyurvedicAssessment.tsx    # Dosha quiz and tips
│   │   │   ├── HealthAlerts.tsx           # Health alarms & notifications
│   │   │   ├── ComponentShowcase.tsx      # Standalone UI showcase
│   │   │   └── NotFound.tsx               # 404 fallback page
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx           # Global dark/light theme
│   │   ├── hooks/
│   │   │   ├── useComposition.ts
│   │   │   ├── useFileUpload.ts           # File upload logic
│   │   │   ├── useMobile.tsx
│   │   │   └── usePersistFn.ts
│   │   ├── lib/
│   │   │   ├── auth.ts            # Client-side logout logic
│   │   │   ├── firebase.ts        # Firebase app configuration
│   │   │   ├── trpc.ts            # tRPC react-query provider setup
│   │   │   └── utils.ts           # Class-merging utilities
│   │   ├── App.tsx                # Client router configuration (Wouter)
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Styling system (Tailwind v4)
│   └── index.html
├── server/
│   ├── _core/                     # Platform infrastructure
│   │   ├── chat.ts                # Vercel AI SDK streaming endpoint
│   │   ├── context.ts             # tRPC authorization context resolver
│   │   ├── dataApi.ts             # External data access
│   │   ├── env.ts                 # Backend configuration loader
│   │   ├── firebaseAdmin.ts       # Firebase Admin initialization
│   │   ├── imageGeneration.ts
│   │   ├── index.ts               # Express bootloader and routing
│   │   ├── map.ts                 # Location mapping
│   │   ├── notification.ts
│   │   ├── patchedFetch.ts        # Node-fetch compatibility patch
│   │   ├── systemRouter.ts
│   │   ├── trpc.ts                # tRPC router & procedures builder
│   │   └── vite.ts                # Development HMR server integration
│   ├── services/                  # Business Logic Layer
│   │   ├── insightEngine.ts       # Local Health Score & insight generation
│   │   └── metricService.ts       # Daily data aggregator
│   ├── db.ts                      # Supabase Client & pg Pool interface
│   ├── routers.ts                 # Unified tRPC routers & resolvers
│   ├── storage.ts                 # Forge API proxy storage helpers
│   └── *.test.ts                  # Vitest test suite
├── drizzle/
│   ├── schema.ts                  # Database schema definitions
│   └── migrations/                # SQL migration files
├── shared/
│   ├── const.ts                   # Constants shared across boundaries
│   └── types.ts                   # Re-exported schema types
├── package.json                   # Dependencies & build targets
├── tsconfig.json                  # TypeScript compilation rules
├── vite.config.ts                 # Vite builder config
├── tailwind.config.ts             # Tailwind design rules
└── drizzle.config.ts              # Drizzle generator settings
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 | Standard UI component library |
| | Tailwind CSS 4 | Utility-first styling framework |
| | shadcn/ui | Pre-built accessible components |
| | Recharts | Data visualization (weight and metrics history) |
| | Wouter | Lightweight client-side router |
| **Backend** | Express 4 | HTTP server engine |
| | tRPC 11 | End-to-end type-safe RPC endpoints |
| | Drizzle ORM | Database schema definitions & type inferences |
| **Database** | PostgreSQL (Supabase / `pg`) | Relational database fallback system |
| **Authentication** | Firebase Authentication | Frontend state synced with backend Firebase Admin SDK (token verification) |
| **Insight / Diet Logic** | Advanced Local Algorithms | Local rules engine for scoring and tag-based diet suggestions (No external LLM dependency for daily recommendations) |
| **Testing** | Vitest | Node.js testing library |
| **Build Tools** | Vite / esbuild | Compilation and packaging pipelines |

---

## 3. Database Schema (Drizzle ORM)

The relational schema is configured in `drizzle/schema.ts` targeting PostgreSQL (`pg-core`).

### 3.1 Schema Table Declarations

#### Users Table
Stores authenticating users mapping back to Firebase `uid`.
```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }), // Firebase user.uid
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 32 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_openId_unique").on(table.openId),
]);
```

#### Health Profiles Table
Stores onboarding questions, body configurations, and dietary preferences.
```typescript
export const healthProfiles = pgTable("health_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  age: integer("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  height: decimal("height", { precision: 5, scale: 2 }), // in cm
  gender: varchar("gender", { length: 16 }),
  healthConditions: json("healthConditions"),     // Array: ['diabetes', 'cardiac', 'none']
  activityLevel: varchar("activityLevel", { length: 32 }),
  fitnessGoal: varchar("fitnessGoal", { length: 32 }),
  dietaryRestrictions: json("dietaryRestrictions"), // Array: ['vegetarian', 'vegan', 'gluten_free']
  allergies: json("allergies"),                    // Array: ['peanuts', 'egg', etc]
  dosha: varchar("dosha", { length: 24 }).default("not_assessed"),
  bmi: decimal("bmi", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
```

#### Exercise Logs Table
Logs completed workout activities.
```typescript
export const exerciseLogs = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  exerciseName: varchar("exerciseName", { length: 255 }),
  category: varchar("category", { length: 24 }), // cardio, strength, flexibility, sports, other
  duration: integer("duration"), // in minutes
  intensity: varchar("intensity", { length: 16 }),
  caloriesBurned: integer("caloriesBurned"),
  notes: text("notes"),
  loggedAt: timestamp("loggedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_userId_loggedAt").on(table.userId, table.loggedAt),
]);
```

#### Diet Plans Table
Stores personalized generated diets.
```typescript
export const dietPlans = pgTable("diet_plans", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  planName: varchar("planName", { length: 255 }),
  description: text("description"),
  mealSuggestions: json("mealSuggestions"), // array of custom meals
  proteinTarget: integer("proteinTarget"),
  calorieTarget: integer("calorieTarget"),
  healthCondition: varchar("healthCondition", { length: 100 }),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
```

#### Meal Logs Table
Tracks food entries consumed.
```typescript
export const mealLogs = pgTable("meal_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  mealType: varchar("mealType", { length: 16 }), // breakfast, lunch, dinner, snack
  mealName: varchar("mealName", { length: 255 }),
  caloriesEstimate: integer("caloriesEstimate"),
  protein: integer("protein"), // in grams
  carbs: integer("carbs"),
  fat: integer("fat"),
  loggedAt: timestamp("loggedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_userId_loggedAt_meal").on(table.userId, table.loggedAt),
]);
```

#### Ayurvedic Assessments Table
Stores Dosha questionnaire points and recommendations.
```typescript
export const ayurvedicAssessments = pgTable("ayurvedic_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  dosha: varchar("dosha", { length: 24 }), // vata, pitta, kapha
  doshaScore: json("doshaScore"), // { vata: score, pitta: score, kapha: score }
  recommendations: json("recommendations"),
  dietSuggestions: json("dietSuggestions"),
  herbSuggestions: json("herbSuggestions"),
  routineSuggestions: json("routineSuggestions"),
  assessedAt: timestamp("assessedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
```

#### Health Alerts Table
Configures medication / hydration / workout reminders.
```typescript
export const healthAlerts = pgTable("health_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  alertType: varchar("alertType", { length: 24 }), // medication, hydration, exercise, meal, custom
  title: varchar("title", { length: 255 }),
  description: text("description"),
  frequency: varchar("frequency", { length: 16 }), // daily, weekly, custom
  scheduledTime: time("scheduledTime"),
  isActive: boolean("isActive").default(true),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
```

#### Activity Trackers Table
Daily metrics trackers (steps, distance).
```typescript
export const activityTrackers = pgTable("activity_trackers", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: date("date"),
  steps: integer("steps"),
  estimatedCalories: integer("estimatedCalories"),
  activeMinutes: integer("activeMinutes"),
  distance: decimal("distance", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("idx_userId_date").on(table.userId, table.date),
]);
```

#### Progress Metrics Table
Stores aggregated values used in frontend chart analytics.
```typescript
export const progressMetrics = pgTable("progress_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  metricDate: date("metricDate"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  bmi: decimal("bmi", { precision: 5, scale: 2 }),
  exerciseMinutes: integer("exerciseMinutes"),
  caloriesBurned: integer("caloriesBurned"),
  mealsLogged: integer("mealsLogged"),
  goalAchievement: decimal("goalAchievement", { precision: 3, scale: 1 }), // percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_userId_metricDate").on(table.userId, table.metricDate),
]);
```

#### Daily Metrics Table (Aggregated Layer)
Stores simplified daily totals, optimized to power quick AI Insights calculations:
```typescript
export const dailyMetrics = pgTable("daily_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: date("date").notNull(),
  totalCalories: integer("totalCalories").default(0),
  totalProtein: integer("totalProtein").default(0),
  workoutMinutes: integer("workoutMinutes").default(0),
  steps: integer("steps").default(0),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_user_date_metrics").on(table.userId, table.date),
]);
```

---

## 4. Authentication Flow

The platform relies on Firebase Authentication on the client side combined with verification on the server side:

```
[Client App]                  [tRPC client]              [Server Router]            [Firebase SDK]
     │                              │                           │                          │
     ├─► Sign in with Google / email ─────────────────────────────────────────────────────►│ (Authenticates)
     │   (State change detected)    │                           │                          │
     │                              │                           │                          │
     ├─► Async ID Token Retrieval ─►│                           │                          │
     │   `user.getIdToken()`        │                           │                          │
     │                              ├─► HTTP Fetch Hook ───────►│                          │
     │                              │   Attach Bearer Token     │                          │
     │                              │   in Auth Header          │                          │
     │                              │                           ├─► verifyIdToken ────────►│ (Validates JWT)
     │                              │                           │   (Success)              │
     │                              │                           │                          │
     │                              │                           ├─► Check DB for User      │
     │                              │                           │   (Auto-create if new)   │
     │                              │                           │                          │
     │                              │                           ├─► Inject `ctx.user`      │
     │                              │                           │                          │
     │◄─────────────────────────────┴───────────────────────────┼─► Execute Procedure      │
```

1. **Client Authentication**: The user authenticates against Firebase.
2. **tRPC Request Assembly**: The frontend tRPC client attaches the current Firebase ID Token dynamically to every outbound RPC request as an `Authorization: Bearer <token>` header.
3. **Token Verification**: On the server, `createContext` intercepts the request header, decodes the token with the Firebase Admin SDK (`verifyIdToken`), and queries the database for a matching `openId`.
4. **User Syncing**: If it is the user's first login, their user details are automatically created in the database.
5. **Context Binding**: The user object is injected into the tRPC Context (`ctx.user`).
6. **Authorization Guard**: Procedures marked with `protectedProcedure` verify that `ctx.user` is not null.

---

## 5. API Routes & Data Flow

### 5.1 tRPC Router Schema

The backend endpoints are exposed via `appRouter` (in `server/routers.ts`):

```typescript
appRouter {
  system: {
    health: publicProcedure → Query { ok: boolean }
    seedDemoData: protectedProcedure → Mutation { success: boolean }
  }

  auth: {
    me: publicProcedure → Query User | null
    login: publicProcedure → Mutation { success: boolean }
    logout: publicProcedure → Mutation { success: boolean }
  }

  health: {
    getProfile: protectedProcedure → Query HealthProfile
    updateProfile: protectedProcedure → Mutation HealthProfile
  }

  exercise: {
    logExercise: protectedProcedure → Mutation ExerciseLog
    getExerciseLogs: protectedProcedure → Query ExerciseLog[]
  }

  diet: {
    createPlan: protectedProcedure → Mutation DietPlan
    getPlan: protectedProcedure → Query DietPlan | null
    logMeal: protectedProcedure → Mutation MealLog
    getMealLogs: protectedProcedure → Query MealLog[]
    getSuggestions: protectedProcedure → Query SuggestedMeals[]
  }

  ayurveda: {
    getAssessment: protectedProcedure → Query AyurvedicAssessment | null
    createAssessment: protectedProcedure → Mutation AyurvedicAssessment
  }

  alerts: {
    createAlert: protectedProcedure → Mutation HealthAlert
    getAlerts: protectedProcedure → Query HealthAlert[]
    updateAlert: protectedProcedure → Mutation HealthAlert
    deleteAlert: protectedProcedure → Mutation { success: boolean }
  }

  insights: {
    getInsights: protectedProcedure → Query DailyAnalysis { insights: Insight[], healthScore: number }
  }

  analytics: {
    getProgressMetrics: protectedProcedure → Query ProgressMetric[]
  }
}
```

### 5.2 Log Exercise Flow Example

```
  User logs exercise on client (ExerciseTracker.tsx)
                        ↓
  Triggers trpc.exercise.logExercise.useMutation()
                        ↓
  Server inserts log record into `exercise_logs`
                        ↓
  Server triggers `syncDailyMetrics(userId, today)`
                        ↓
  Vitals updated in `daily_metrics` (workoutMinutes)
                        ↓
  Client refetches queries, updating Dashboard analytics & Health Score
```

---

## 6. Client Layout & Page Routing

### 6.1 Layout Components

* **DashboardLayout**: Sidebar navigations, user profile dropdowns, system triggers, and viewport wrapper.
* **ManusDialog**: Floating AI chat simulator.
* **Map**: Accessible geolocation display to map local health resources/gyms.
* **Markdown**: Formats text content and insights cleanly.

### 6.2 Application Client Pages (Wouter routes)

* **`/` (Home)**: Landing page featuring login forms.
* **`/dashboard` (Dashboard)**: Core analytic panels, progress graphs, activity rings, and AI insights feed.
* **`/health-questionnaire` (HealthQuestionnaire)**: Onboarding questionnaire (BMI setup, dietary constraints, goals selection).
* **`/exercise` (ExerciseTracker)**: Log forms and lists for exercise categories.
* **`/diet` (DietPlanner)**: Log meals, configure plans, and view filtered meal suggestions.
* **`/ayurveda` (AyurvedicAssessment)**: Dosha calculator questionnaire and custom tips.
* **`/alerts` (HealthAlerts)**: Medication / hydration / generic alarm config pages.
* **`/profile` (Profile)**: Displays user details and weight config modifications.
* **`/404` (NotFound)**: Fallback 404 display.

---

## 7. Business Logic & Core Services

### 7.1 Metric Aggregation (`metricService.ts`)
Calculates the current day's totals by querying and combining:
* Food logs from `meal_logs` (calories and protein totals).
* Exercise records from `exercise_logs` (workout minutes).
* Daily tracker data from `activity_trackers` (steps).
* Updates the unified `daily_metrics` row for easy reference.

### 7.2 AI Insights Engine (`insightEngine.ts`)
A highly optimized, deterministic rules engine that generates recommendations and score metrics:
1. **Health Score (0-100)**:
   * **Protein Points (Max 40)**: 40 points if daily protein intake >= 1.2g per kg of body weight; 20 points if >= 0.8g per kg.
   * **Calorie Points (Max 30)**: 30 points if within metabolic range (between 80% and 120% of estimated BMR: `weight * 22`); 10 points if any meal is logged.
   * **Workout Points (Max 30)**: 30 points if workout minutes >= 30 mins; 15 points if > 0 mins.
2. **Personalized Suggestions**:
   * Evaluates user food allergies (such as `egg` or `peanut`) and dietary limitations (such as `vegetarian` or `vegan`) to exclude inappropriate protein recommendations (e.g. recommending tofu/lentils instead of chicken for vegetarians).
   * Generates actionable info, warning, or success insights with customized action links.

### 7.3 Smart Diet Suggestions
Built-in local catalog of 33 pre-defined breakfast, lunch, and dinner recipes. It filters results dynamically using user-profile criteria:
* **Allergies exclusion**: Filters out meals containing ingredients matching specified allergies.
* **Diets (vegan/vegetarian/gluten_free)**: Excludes meals without matching tags.
* **Health conditions**:
  * *Diabetes*: Limits suggestions to low-sugar options or meals < 400 calories.
  * *Cardiac*: Limits suggestions to low-fat options.
* **Fitness goals**:
  * *Weight Loss*: Sorts suggestions by calories (ascending).
  * *Muscle Gain*: Sorts suggestions by protein (descending).

---

## 8. Development & Database Operations

### 8.1 Schema Modification Loop
1. Declare database columns in `drizzle/schema.ts`.
2. Generate migration script:
   ```bash
   pnpm drizzle-kit generate
   ```
3. Apply migration changes to Supabase:
   ```bash
   pnpm drizzle-kit migrate
   ```
4. Query/mutate data inside `server/db.ts` or `server/routers.ts`.

### 8.2 Environment Variable Configurations
Check `.env.example` to ensure local environments contain:
* `DATABASE_URL`: PostgreSQL connection string.
* `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: PostgREST configuration.
* `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`: Credentials for Firebase Admin token validation.

---

## 9. Security & Access Configurations

* **API Authorization**: Restricted procedures use `protectedProcedure` verifying the Firebase Bearer token context.
* **Cross-Origin Resource Sharing (CORS)**: Access restricted to authorized production domains (`fitness-tracker-system.vercel.app`) and local environments (`localhost:3000`, etc.).
* **Relational Safety**: Foreign keys configured with cascading deletions (`ON DELETE CASCADE`) to clean up orphan logs if a user profile is removed.
