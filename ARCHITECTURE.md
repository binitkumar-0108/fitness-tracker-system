# Health & Wellness Platform - System Architecture

## Executive Summary

This document outlines the complete system architecture for a comprehensive health and wellness platform built with React 19, Express 4, tRPC 11, and a custom MySQL database. The platform enables users to track fitness activities, manage nutrition, receive personalized health recommendations, and monitor progress utilizing a custom-built, highly dynamic AI Insight Engine.

---

## 1. Project Folder Structure

```
fitness-tracker-mvp/
├── client/
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── HealthMetricsChart.tsx
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── MealPlanCard.tsx
│   │   │   └── AyurvedicCard.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx                   # Landing/auth page
│   │   │   ├── Dashboard.tsx              # Main dashboard hub
│   │   │   ├── HealthQuestionnaire.tsx    # Initial health onboarding
│   │   │   ├── Profile.tsx                # Manage health preferences
│   │   │   ├── ExerciseTracker.tsx        # Activity logging
│   │   │   ├── DietPlanner.tsx            # Nutrition tracking
│   │   │   ├── AyurvedicAssessment.tsx    # Dosha quiz and tips
│   │   │   ├── HealthAlerts.tsx           # AI health insights
│   │   │   ├── ComponentShowcase.tsx      # UI component library
│   │   │   └── NotFound.tsx               # 404 page
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useHealthData.ts
│   │   ├── lib/
│   │   │   ├── auth.ts            # Firebase Auth & Session logic
│   │   │   ├── firebase.ts        # Firebase configuration
│   │   │   ├── trpc.ts            # tRPC setup
│   │   │   └── utils.ts           # Utility functions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── server/
│   ├── _core/                     # Framework infrastructure
│   ├── services/                  # Business Logic Layer
│   │   ├── insightEngine.ts       # AI-driven health scoring & personalization
│   │   └── metricService.ts       # Daily data aggregation system
│   ├── db.ts                      # Database connection and queries
│   ├── routers.ts                 # Unified tRPC procedure definitions
│   ├── storage.ts                 # S3 / file storage helpers
│   └── *.test.ts                  # Vitest test files
├── drizzle/
│   ├── schema.ts                  # Database schema definitions
│   └── migrations/                # SQL migration files
├── shared/
│   ├── const.ts
│   └── types.ts
├── storage/
│   └── index.ts                   # S3 storage helpers
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── drizzle.config.ts
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 | UI framework with latest hooks and features |
| | Tailwind CSS 4 | Utility-first CSS framework |
| | shadcn/ui | Pre-built accessible components |
| | Recharts | Data visualization and charts |
| | Wouter | Lightweight client-side routing |
| **Backend** | Express 4 | HTTP server framework |
| | tRPC 11 | Type-safe RPC framework |
| | Drizzle ORM | Type-safe database queries |
| **Database** | Custom Relational DB | Connected via Drizzle to any supported SQL dialect (Postgres, SQLite, MySQL) |
| **Authentication** | Firebase Auth | Handles authentication natively via GoogleAuthProvider |
| **Diet Logic** | Advanced Algorithms | Deterministic tag-based filtering for meal planning and recommendations |
| **Testing** | Vitest | Fast unit testing framework |
| **Build Tools** | Vite | Fast development server and bundler |

---

## 3. Database Schema (Drizzle ORM)

### 3.1 Core Tables

#### Users Table
Extends the base user table with health-specific fields:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Health Profile Table
Stores user's health metrics and goals:

```sql
CREATE TABLE health_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  age INT,
  weight DECIMAL(5, 2),           -- in kg
  height DECIMAL(5, 2),           -- in cm
  gender ENUM('male', 'female', 'other'),
  healthConditions JSON,          -- ['diabetes', 'bp', 'cardiac', 'none']
  activityLevel ENUM('sedentary', 'light', 'moderate', 'active', 'very_active'),
  fitnessGoal ENUM('weight_loss', 'muscle_gain', 'endurance', 'general_health'),
  dietaryRestrictions JSON,       -- ['vegetarian', 'vegan', 'gluten_free', etc]
  allergies JSON,
  dosha ENUM('vata', 'pitta', 'kapha', 'not_assessed'),
  bmi DECIMAL(5, 2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Exercise Log Table
Tracks individual exercise sessions:

```sql
CREATE TABLE exercise_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  exerciseName VARCHAR(255),
  category ENUM('cardio', 'strength', 'flexibility', 'sports', 'other'),
  duration INT,                   -- in minutes
  intensity ENUM('light', 'moderate', 'high'),
  caloriesBurned INT,
  notes TEXT,
  loggedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (userId, loggedAt)
);
```

#### Diet Plan Table
Stores personalized diet recommendations:

```sql
CREATE TABLE diet_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  planName VARCHAR(255),
  description TEXT,
  mealSuggestions JSON,           -- array of meal objects
  proteinTarget INT,              -- in grams
  calorieTarget INT,
  healthCondition VARCHAR(100),
  generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Meal Log Table
Tracks daily meal intake:

```sql
CREATE TABLE meal_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  mealType ENUM('breakfast', 'lunch', 'dinner', 'snack'),
  mealName VARCHAR(255),
  caloriesEstimate INT,
  protein INT,
  carbs INT,
  fat INT,
  loggedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (userId, loggedAt)
);
```

#### Ayurvedic Assessment Table
Stores Dosha assessment results and recommendations:

```sql
CREATE TABLE ayurvedic_assessments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  dosha ENUM('vata', 'pitta', 'kapha'),
  doshaScore JSON,                -- {vata: 0-100, pitta: 0-100, kapha: 0-100}
  recommendations JSON,           -- array of lifestyle recommendations
  dietSuggestions JSON,
  herbSuggestions JSON,
  routineSuggestions JSON,
  assessedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Health Alerts Table
Stores reminders and notifications:

```sql
CREATE TABLE health_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  alertType ENUM('medication', 'hydration', 'exercise', 'meal', 'custom'),
  title VARCHAR(255),
  description TEXT,
  frequency ENUM('daily', 'weekly', 'custom'),
  scheduledTime TIME,
  isActive BOOLEAN DEFAULT TRUE,
  lastTriggeredAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Activity Tracker Table
Daily activity and step tracking:

```sql
CREATE TABLE activity_trackers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  date DATE,
  steps INT,
  estimatedCalories INT,
  activeMinutes INT,
  distance DECIMAL(5, 2),         -- in km
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (userId, date),
  INDEX (userId, date)
);
```

#### Progress Metrics Table
Aggregated progress data for dashboard:

```sql
CREATE TABLE progress_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  metricDate DATE,
  weight DECIMAL(5, 2),
  bmi DECIMAL(5, 2),
  exerciseMinutes INT,
  caloriesBurned INT,
  mealsLogged INT,
  goalAchievement DECIMAL(3, 1),  -- percentage
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (userId, metricDate),
  INDEX (userId, metricDate)
);
```

#### Daily Metrics Table (Aggregated Layer)
Stores aggregated daily metrics to power the fast insight generation engine non-blockingly:

```sql
CREATE TABLE daily_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  date DATE NOT NULL,
  totalCalories INT DEFAULT 0,
  totalProtein INT DEFAULT 0,
  totalCarbs INT DEFAULT 0,
  totalFat INT DEFAULT 0,
  totalExerciseMinutes INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (userId, date)
);
```

---

## 4. Authentication Flow

The platform uses **Firebase Auth** (specifically `GoogleAuthProvider`) coupled with internal token mapping:

1. **Login Initiation**: User clicks "Sign In with Google" → handled natively by Firebase `signInWithPopup`.
2. **Session Syncing**: The client takes the Firebase `user.uid` and issues a `trpcClient.auth.login.mutate` call.
3. **Session Creation**: Backend maps the `openId` to the database user record and establishes an encrypted JWT `session_cookie`.
4. **Protected Routes**: Frontend checks `trpc.auth.me.useQuery()` to verify authentication against the secure cookie.
5. **Logout**: User clicks logout → `trpc.auth.logout.useMutation()` clears the backend session cookie, while Firebase `signOut()` handles the frontend state.

**Key Features:**
- Secure session persistence via HttpOnly cookies across browser refresh
- Type-safe user context available in all tRPC procedures via `ctx.user`
- Protected procedures use `protectedProcedure` wrapper
- Public procedures use `publicProcedure` wrapper

---

## 5. API Routes & Data Flow

### 5.1 tRPC Router Structure

```typescript
appRouter {
  auth: {
    me: publicProcedure → User | null
    logout: publicProcedure → { success: boolean }
  }
  
  health: {
    getProfile: protectedProcedure → HealthProfile
    updateProfile: protectedProcedure → HealthProfile
    assessDosha: protectedProcedure → DoshaAssessment
  }
  
  exercise: {
    logExercise: protectedProcedure → ExerciseLog
    getExerciseLogs: protectedProcedure → ExerciseLog[]
    getExerciseStats: protectedProcedure → ExerciseStats
  }
  
  diet: {
    generatePlan: protectedProcedure → DietPlan (uses LLM)
    getPlan: protectedProcedure → DietPlan
    logMeal: protectedProcedure → MealLog
    getMealLogs: protectedProcedure → MealLog[]
    generateRecipe: protectedProcedure → Recipe (uses LLM)
  }
  
  ayurveda: {
    getAssessment: protectedProcedure → AyurvedicAssessment
    getRecommendations: protectedProcedure → Recommendations
  }
  
  alerts: {
    createAlert: protectedProcedure → HealthAlert
    getAlerts: protectedProcedure → HealthAlert[]
    updateAlert: protectedProcedure → HealthAlert
    deleteAlert: protectedProcedure → { success: boolean }
  }
  
  insights: {
    getInsights: protectedProcedure → AI Health Score & Actionable Recommendations
  }
  
  analytics: {
    getDashboardData: protectedProcedure → DashboardData
    getProgressChart: protectedProcedure → ProgressData
    getWeeklyStats: protectedProcedure → WeeklyStats
  }
}
```

### 5.2 Data Flow Example: Exercise Logging

```
User Action (Frontend)
    ↓
ExerciseTracker.tsx calls trpc.exercise.logExercise.useMutation()
    ↓
Backend: exercise.ts router receives data
    ↓
Validation & Database Insert
    ↓
Update progress_metrics table
    ↓
Return ExerciseLog to Frontend
    ↓
UI updates with optimistic update
    ↓
Dashboard reflects new stats
```

---

## 6. Component Structure

### 6.1 Layout Components

**DashboardLayout** (Pre-built in template)
- Sidebar navigation with user profile
- Main content area
- Health metrics summary
- Quick action buttons

### 6.2 Feature Components

| Component | Purpose | Location |
|-----------|---------|----------|
| HealthMetricsChart | Display weight, BMI trends | Dashboard |
| ExerciseCard | Show recent exercises | Dashboard |
| MealPlanCard | Display current meal plan | Dashboard |
| AyurvedicCard | Show Dosha info | Dashboard |
| HealthAlertsList | Manage reminders | HealthAlerts page |
| ExerciseForm | Log new exercise | ExerciseTracker page |
| DietPlanGenerator | Create meal plans | DietPlanner page |
| ProgressChart | Visualize progress | Dashboard |
| ActivitySummary | Daily activity stats | Dashboard |

### 6.3 Page Structure

- **Home.tsx**: Landing page with auth options
- **Dashboard.tsx**: Main hub showing all metrics
- **HealthQuestionnaire.tsx**: Initial health profile setup
- **ExerciseTracker.tsx**: Log and view exercises
- **DietPlanner.tsx**: Generate and manage meal plans
- **AyurvedicAssessment.tsx**: Dosha assessment quiz
- **HealthAlerts.tsx**: Manage reminders and notifications
- **Profile.tsx**: Edit health profile and preferences

---

## 7. Module Interactions

### 7.1 Health Profile Module
- **Trigger**: User completes health questionnaire
- **Action**: Stores health data, calculates BMI, determines initial Dosha
- **Output**: Enables personalized recommendations across all modules

### 7.2 Exercise Module
- **Trigger**: User logs exercise
- **Action**: Records exercise data, estimates calories, updates activity stats
- **Output**: Updates progress metrics, feeds into dashboard analytics

### 7.3 Diet Module
- **Trigger**: User requests meal plan or logs meal
- **Action**: Uses LLM to generate personalized meal plans based on health profile
- **Output**: Stores meal suggestions, tracks calorie intake

### 7.4 Ayurvedic Module
- **Trigger**: User completes Dosha assessment
- **Action**: Calculates Dosha type, generates lifestyle recommendations
- **Output**: Provides diet and routine suggestions aligned with Dosha

### 7.5 Alerts Module
- **Trigger**: User creates health reminder
- **Action**: Stores alert configuration
- **Output**: Displays notifications on dashboard (MVP: static notifications)

### 7.6 Analytics Module
- **Trigger**: Dashboard page loads
- **Action**: Aggregates data from all modules
- **Output**: Displays charts and progress summaries

### 7.7 AI Insights Engine
- **Trigger**: Dashboard loads or user takes an action (logs meal/workout)
- **Action**: Uses `metricService` to dynamically sync the current day's progress, passes it to `insightEngine` which evaluates complex dynamic thresholds against the user's specific health profile (e.g. egg allergy tracking, vegetarian status).
- **Output**: Calculates an additive daily Health Score (0-100) and displays actionable, highly-personalized smart insights.

---

## 8. Smart Diet Planner & Recommendation Engine

The platform operates robust tag-based filtering algorithms locally instead of depending on an external LLM:

### 8.1 Meal Plan Generation
```
User Health Profile + Dietary Preferences + Health Conditions
    ↓
Evaluated locally in server/routers.ts via filtering logic
    ↓
Determines macros (Calories, Protein, Carbs, Fat) by referencing tagged constraints (e.g. low_fat for Cardiac conditions)
    ↓
Parses optimal meal assignments and stores in diet_plans table
    ↓
Displays intelligent Smart Recommendations UI
```

### 8.2 Recipe Suggestions
```
User request with dietary restrictions
    ↓
Processed internally evaluating user 'tags' (vegan, gluten_free)
    ↓
System pulls from an established catalog of comprehensive recipes including macros
    ↓
Store and display in UI
```

---

## 9. Design & UI Approach

### 9.1 Design Philosophy
- **Clean & Minimal**: Focus on clarity and usability
- **Health-Focused**: Use calming colors (blues, greens, soft neutrals)
- **Accessible**: High contrast, readable fonts, keyboard navigation
- **Responsive**: Mobile-first design for on-the-go tracking

### 9.2 Color Palette
- **Primary**: Teal/Blue (#0891b2 or similar) - Trust, health
- **Secondary**: Green (#22c55e) - Wellness, growth
- **Accent**: Orange (#f97316) - Energy, activity
- **Neutral**: Gray scale for backgrounds and text

### 9.3 Typography
- **Headings**: Modern sans-serif (system font stack)
- **Body**: Readable sans-serif for accessibility
- **Font Size**: 14px-16px for body, 20px-32px for headings

### 9.4 Key UI Patterns
- **Cards**: For metrics, exercises, meals
- **Charts**: Recharts for progress visualization
- **Forms**: shadcn/ui for consistent input handling
- **Modals**: For confirmations and detailed views
- **Toasts**: For success/error feedback

---

## 10. Development Workflow

### 10.1 Build Loop
1. Update database schema in `drizzle/schema.ts`
2. Generate migration SQL via `pnpm drizzle-kit generate`
3. Apply migration via `webdev_execute_sql`
4. Add query helpers in `server/db.ts`
5. Create tRPC procedures in `server/routers.ts`
6. Build UI components calling tRPC hooks
7. Write Vitest tests for backend logic
8. Test in browser and iterate

### 10.2 Code Organization
- **Server Logic**: Keep in `server/routers/*.ts` files
- **Database Queries**: Centralize in `server/db.ts`
- **UI Components**: Organize by feature in `client/src/pages/`
- **Shared Types**: Define in `shared/types.ts` for type safety

---

## 11. Key Features Summary

| Feature | Status | Implementation |
|---------|--------|-----------------|
| User Authentication | Core | Manus OAuth |
| Health Profile Management | Core | Form + Database |
| Exercise Tracking | Core | Log + Analytics |
| Diet Plan Generation | Advanced | LLM Integration |
| Ayurvedic Assessment | Advanced | Quiz + Scoring |
| Health Alerts | Core | Reminder System |
| Progress Dashboard | Core | Charts + Metrics |
| Activity Tracking | Core | Daily Stats |
| Meal Planning | Advanced | LLM + Storage |
| AI Health Insights Engine | Advanced | Multi-layer Rules Engine |
| Daily Metrics Sync | Core | Background Aggregator |
| Notifications | MVP | Dashboard Display |

---

## 12. Scalability & Future Enhancements

### Phase 2 (Post-MVP)
- Real push notifications via service workers
- Wearable device integration (step tracking from devices)
- Social features (friend challenges, community)
- Advanced AI recommendations
- Integration with fitness APIs (Fitbit, Apple Health)

### Phase 3 (Long-term)
- Telemedicine consultations
- Personalized coaching
- Advanced analytics and insights
- Mobile app (React Native)

---

## 13. Security Considerations

- **Authentication**: OAuth 2.0 via Manus
- **Authorization**: Role-based access control (user/admin)
- **Data Privacy**: All health data encrypted at rest
- **API Security**: tRPC validates all inputs, protected procedures require auth
- **HTTPS**: All communication encrypted in transit

---

## Summary

This architecture provides a **scalable, type-safe foundation** for a comprehensive health and wellness platform. The separation of concerns (frontend/backend), use of tRPC for type safety, and a customized Drizzle integration for reliable data storage ensure massive maintainability and performance across any RDBMS. The internal deterministic algorithms enable precise, personalized recommendations while keeping the MVP scope highly performant and secure.

**Next Steps:**
1. Review and approve this architecture
2. Begin Phase 2: Database schema setup and Supabase integration
3. Implement authentication and core layout
4. Build features incrementally with testing

