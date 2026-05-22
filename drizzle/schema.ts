import { serial, pgTable, text, timestamp, varchar, decimal, date, json, boolean, time, uniqueIndex, integer } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  openId: varchar("openId", { length: 64 }),
  
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Health Profile Table
export const healthProfiles = pgTable("health_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  age: integer("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  gender: varchar("gender", { length: 16 }),
  healthConditions: json("healthConditions"),
  activityLevel: varchar("activityLevel", { length: 32 }),
  fitnessGoal: varchar("fitnessGoal", { length: 32 }),
  dietaryRestrictions: json("dietaryRestrictions"),
  allergies: json("allergies"),
  dosha: varchar("dosha", { length: 24 }).default("not_assessed"),
  bmi: decimal("bmi", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type HealthProfile = typeof healthProfiles.$inferSelect;
export type InsertHealthProfile = typeof healthProfiles.$inferInsert;

// Exercise Log Table
export const exerciseLogs = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  exerciseName: varchar("exerciseName", { length: 255 }),
  category: varchar("category", { length: 24 }),
  duration: integer("duration"),
  intensity: varchar("intensity", { length: 16 }),
  caloriesBurned: integer("caloriesBurned"),
  notes: text("notes"),
  loggedAt: timestamp("loggedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_userId_loggedAt").on(table.userId, table.loggedAt),
]);

export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type InsertExerciseLog = typeof exerciseLogs.$inferInsert;

// Diet Plan Table
export const dietPlans = pgTable("diet_plans", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  planName: varchar("planName", { length: 255 }),
  description: text("description"),
  mealSuggestions: json("mealSuggestions"),
  proteinTarget: integer("proteinTarget"),
  calorieTarget: integer("calorieTarget"),
  healthCondition: varchar("healthCondition", { length: 100 }),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DietPlan = typeof dietPlans.$inferSelect;
export type InsertDietPlan = typeof dietPlans.$inferInsert;

// Meal Log Table
export const mealLogs = pgTable("meal_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  mealType: varchar("mealType", { length: 16 }),
  mealName: varchar("mealName", { length: 255 }),
  caloriesEstimate: integer("caloriesEstimate"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fat: integer("fat"),
  loggedAt: timestamp("loggedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_userId_loggedAt_meal").on(table.userId, table.loggedAt),
]);

export type MealLog = typeof mealLogs.$inferSelect;
export type InsertMealLog = typeof mealLogs.$inferInsert;

// Ayurvedic Assessment Table
export const ayurvedicAssessments = pgTable("ayurvedic_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  dosha: varchar("dosha", { length: 24 }),
  doshaScore: json("doshaScore"),
  recommendations: json("recommendations"),
  dietSuggestions: json("dietSuggestions"),
  herbSuggestions: json("herbSuggestions"),
  routineSuggestions: json("routineSuggestions"),
  assessedAt: timestamp("assessedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AyurvedicAssessment = typeof ayurvedicAssessments.$inferSelect;
export type InsertAyurvedicAssessment = typeof ayurvedicAssessments.$inferInsert;

// Health Alerts Table
export const healthAlerts = pgTable("health_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  alertType: varchar("alertType", { length: 24 }),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  frequency: varchar("frequency", { length: 16 }),
  scheduledTime: time("scheduledTime"),
  isActive: boolean("isActive").default(true),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type HealthAlert = typeof healthAlerts.$inferSelect;
export type InsertHealthAlert = typeof healthAlerts.$inferInsert;

// Activity Tracker Table
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

export type ActivityTracker = typeof activityTrackers.$inferSelect;
export type InsertActivityTracker = typeof activityTrackers.$inferInsert;

// Progress Metrics Table
export const progressMetrics = pgTable("progress_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  metricDate: date("metricDate"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  bmi: decimal("bmi", { precision: 5, scale: 2 }),
  exerciseMinutes: integer("exerciseMinutes"),
  caloriesBurned: integer("caloriesBurned"),
  mealsLogged: integer("mealsLogged"),
  goalAchievement: decimal("goalAchievement", { precision: 3, scale: 1 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_userId_metricDate").on(table.userId, table.metricDate),
]);

export type ProgressMetric = typeof progressMetrics.$inferSelect;
export type InsertProgressMetric = typeof progressMetrics.$inferInsert;

// Daily Metrics Table (Aggregation for Insights)
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

export type DailyMetric = typeof dailyMetrics.$inferSelect;
export type InsertDailyMetric = typeof dailyMetrics.$inferInsert;