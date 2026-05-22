CREATE TABLE "activity_trackers" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" date,
	"steps" integer,
	"estimatedCalories" integer,
	"activeMinutes" integer,
	"distance" numeric(5, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ayurvedic_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"dosha" varchar(24),
	"doshaScore" json,
	"recommendations" json,
	"dietSuggestions" json,
	"herbSuggestions" json,
	"routineSuggestions" json,
	"assessedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ayurvedic_assessments_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "daily_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" date NOT NULL,
	"totalCalories" integer DEFAULT 0,
	"totalProtein" integer DEFAULT 0,
	"workoutMinutes" integer DEFAULT 0,
	"steps" integer DEFAULT 0,
	"weight" numeric(5, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diet_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"planName" varchar(255),
	"description" text,
	"mealSuggestions" json,
	"proteinTarget" integer,
	"calorieTarget" integer,
	"healthCondition" varchar(100),
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"exerciseName" varchar(255),
	"category" varchar(24),
	"duration" integer,
	"intensity" varchar(16),
	"caloriesBurned" integer,
	"notes" text,
	"loggedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"alertType" varchar(24),
	"title" varchar(255),
	"description" text,
	"frequency" varchar(16),
	"scheduledTime" time,
	"isActive" boolean DEFAULT true,
	"lastTriggeredAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"age" integer,
	"weight" numeric(5, 2),
	"height" numeric(5, 2),
	"gender" varchar(16),
	"healthConditions" json,
	"activityLevel" varchar(32),
	"fitnessGoal" varchar(32),
	"dietaryRestrictions" json,
	"allergies" json,
	"dosha" varchar(24) DEFAULT 'not_assessed',
	"bmi" numeric(5, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "health_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "meal_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"mealType" varchar(16),
	"mealName" varchar(255),
	"caloriesEstimate" integer,
	"protein" integer,
	"carbs" integer,
	"fat" integer,
	"loggedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"metricDate" date,
	"weight" numeric(5, 2),
	"bmi" numeric(5, 2),
	"exerciseMinutes" integer,
	"caloriesBurned" integer,
	"mealsLogged" integer,
	"goalAchievement" numeric(3, 1),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64),
	"name" text,
	"email" varchar(320),
	"password" varchar(255),
	"loginMethod" varchar(64),
	"role" varchar(32) DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_userId_date" ON "activity_trackers" USING btree ("userId","date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_date_metrics" ON "daily_metrics" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX "idx_userId_loggedAt" ON "exercise_logs" USING btree ("userId","loggedAt");--> statement-breakpoint
CREATE INDEX "idx_userId_loggedAt_meal" ON "meal_logs" USING btree ("userId","loggedAt");--> statement-breakpoint
CREATE INDEX "idx_userId_metricDate" ON "progress_metrics" USING btree ("userId","metricDate");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_openId_unique" ON "users" USING btree ("openId");