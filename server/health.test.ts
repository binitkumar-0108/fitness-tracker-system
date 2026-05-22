import "dotenv/config";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    password: "hashed_password",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as any,
  };

  return { ctx };
}

describe("Health Features", () => {
  describe("health.updateProfile", () => {
    it("should update user health profile with valid data", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.health.updateProfile({
        age: 30,
        weight: 75,
        height: 180,
        gender: "male",
        activityLevel: "moderate",
        fitnessGoal: "weight_loss",
        healthConditions: [],
        dietaryRestrictions: [],
        allergies: [],
      });

      console.log("TEST updateProfile RESULT:", result);
      expect(result).toBeDefined();
      expect(result?.age).toBe(30);
      expect(result?.weight).toBe(75);
      expect(result?.height).toBe(180);
    });

    it("should calculate BMI correctly", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.health.updateProfile({
        age: 30,
        weight: 70,
        height: 170,
        gender: "male",
        activityLevel: "light",
        fitnessGoal: "general_health",
      });

      // BMI = weight / (height in meters)^2 = 70 / (1.7^2) = 24.22
      expect(result?.bmi).toBeDefined();
      const bmiValue = typeof result?.bmi === "string" ? parseFloat(result.bmi) : result?.bmi;
      expect(bmiValue).toBeCloseTo(24.22, 1);
    });

    it("should store health conditions as array", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const conditions = ["diabetes", "hypertension"];
      const result = await caller.health.updateProfile({
        age: 45,
        weight: 80,
        height: 175,
        gender: "female",
        healthConditions: conditions,
        activityLevel: "light",
        fitnessGoal: "general_health",
      });

      expect(result.healthConditions).toBeDefined();
    });
  });

  describe("exercise.logExercise", () => {
    it("should log exercise with valid data", async () => {
      console.log("TEST: exercise.logExercise");
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.exercise.logExercise({
        exerciseName: "Running",
        category: "cardio",
        duration: 30,
        intensity: "moderate",
        caloriesBurned: 300,
        notes: "Morning run",
      });

      expect(result).toBeDefined();
      expect(result.exerciseName).toBe("Running");
      expect(result.duration).toBe(30);
      expect(result.category).toBe("cardio");
    });

    it("should retrieve exercise logs", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Log an exercise
      await caller.exercise.logExercise({
        exerciseName: "Yoga",
        category: "flexibility",
        duration: 45,
        intensity: "light",
      });

      // Retrieve logs
      const logs = await caller.exercise.getExerciseLogs({ limit: 10 });

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe("diet.logMeal", () => {
    it("should log meal with valid data", async () => {
      console.log("TEST: diet.logMeal");
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.diet.logMeal({
        mealType: "breakfast",
        mealName: "Oatmeal with berries",
        caloriesEstimate: 350,
        protein: 12,
        carbs: 45,
        fat: 8,
      });

      expect(result).toBeDefined();
      expect(result.mealName).toBe("Oatmeal with berries");
      expect(result.mealType).toBe("breakfast");
    });

    it("should retrieve meal logs", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Log a meal
      await caller.diet.logMeal({
        mealType: "lunch",
        mealName: "Grilled chicken with rice",
        caloriesEstimate: 600,
      });

      // Retrieve logs
      const logs = await caller.diet.getMealLogs({ limit: 10 });

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe("alerts.createAlert", () => {
    it("should create health alert with valid data", async () => {
      console.log("TEST: alerts.createAlert");
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.alerts.createAlert({
        alertType: "medication",
        title: "Take Vitamin D",
        description: "Daily vitamin D supplement",
        frequency: "daily",
        scheduledTime: "09:00",
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("Take Vitamin D");
      expect(result.alertType).toBe("medication");
    });

    it("should retrieve all alerts", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create an alert
      await caller.alerts.createAlert({
        alertType: "hydration",
        title: "Drink water",
        frequency: "daily",
      });

      // Retrieve alerts
      const alerts = await caller.alerts.getAlerts();

      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
    });

    it("should delete alert", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create an alert
      const alert = await caller.alerts.createAlert({
        alertType: "exercise",
        title: "Evening workout",
        frequency: "daily",
      });

      // Verify alert was created
      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();

      // Delete the alert
      const result = await caller.alerts.deleteAlert({ alertId: alert.id as number });

      expect(result).toBeDefined();
    });
  });

  describe("ayurveda.createAssessment", () => {
    it("should create Ayurvedic assessment", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ayurveda.createAssessment({
        dosha: "vata",
        doshaScore: { vata: 50, pitta: 30, kapha: 20 },
        recommendations: ["Stay warm", "Establish routine"],
        dietSuggestions: ["Warm foods", "Ghee"],
        herbSuggestions: ["Ashwagandha", "Brahmi"],
        routineSuggestions: ["Wake at 6 AM", "Oil massage"],
      });
      
      console.log("TEST createAssessment RESULT:", result);
      expect(result).toBeDefined();
      expect(result?.dosha).toBe("vata");
    });

    it("should retrieve Ayurvedic assessment", async () => {
      console.log("TEST: ayurveda.getAssessment");
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create assessment
      await caller.ayurveda.createAssessment({
        dosha: "pitta",
        doshaScore: { vata: 20, pitta: 60, kapha: 20 },
        recommendations: ["Cool down", "Balance work"],
        dietSuggestions: ["Cooling foods"],
        herbSuggestions: ["Brahmi"],
        routineSuggestions: ["Wake early"],
      });

      // Retrieve assessment
      const assessment = await caller.ayurveda.getAssessment();

      expect(assessment).toBeDefined();
      expect(assessment.dosha).toBe("pitta");
    });
  });
});
