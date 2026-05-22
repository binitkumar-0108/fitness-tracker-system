import "dotenv/config";
import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  return {
    ctx: {
      user: {
        id: userId,
        openId: "test-user-" + userId,
        email: "test@example.com",
        name: "Test User",
        loginMethod: "email",
        role: "user",
      } as any,
      req: {} as any,
      res: {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
      } as any,
    }
  };
}

describe("Critical Features Testing", () => {
  describe("Diet Suggestion Allergy Filtering", () => {
    it("should filter out meals containing allergens in ingredients", async () => {
      const { ctx } = createAuthContext(101);
      const caller = appRouter.createCaller(ctx);

      // 1. Update profile with "chickpea" allergy
      await caller.health.updateProfile({
        allergies: ["chickpea"],
      });

      // 2. Get suggestions
      const suggestions = await caller.diet.getSuggestions();

      // 3. Verify that Chickpea Salad and Falafel Tahini Plate are missing
      const hasChickpeaSalad = suggestions.some(s => s.name.toLowerCase().includes("chickpea"));
      const hasFalafel = suggestions.some(s => s.name.toLowerCase().includes("falafel"));
      
      expect(hasChickpeaSalad).toBe(false);
      expect(hasFalafel).toBe(false);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it("should filter out meals containing allergens in name", async () => {
      const { ctx } = createAuthContext(102);
      const caller = appRouter.createCaller(ctx);

      // 1. Update profile with "Salmon" allergy
      await caller.health.updateProfile({
        allergies: ["Salmon"],
      });

      // 2. Get suggestions
      const suggestions = await caller.diet.getSuggestions();

      // 3. Verify that Salmon dishes are missing
      const hasSalmon = suggestions.some(s => s.name.toLowerCase().includes("salmon"));
      expect(hasSalmon).toBe(false);
    });
    
    it("should be case-insensitive and handle whitespace", async () => {
      const { ctx } = createAuthContext(103);
      const caller = appRouter.createCaller(ctx);

      // 1. Update profile with "  OATS  " allergy
      await caller.health.updateProfile({
        allergies: ["  OATS  "],
      });

      // 2. Get suggestions
      const suggestions = await caller.diet.getSuggestions();

      // 3. Verify that "Oats with Fruits" is missing
      const hasOats = suggestions.some(s => s.name.toLowerCase().includes("oats"));
      expect(hasOats).toBe(false);
    });
  });

  describe("Health Profile 'None' Mutual Exclusivity", () => {
    // Note: The exclusivity is currently implemented in the frontend (handleCheckboxChange).
    // The backend stores whatever is sent. We should verify what the backend receives 
    // when we "simulate" the frontend logic.
    
    it("should store precisely what the frontend sends (None only)", async () => {
      const { ctx } = createAuthContext(104);
      const caller = appRouter.createCaller(ctx);

      await caller.health.updateProfile({
        healthConditions: ["none"],
      });

      const profile = await caller.health.getProfile();
      expect(profile.healthConditions).toEqual(["none"]);
    });

    it("should store multiple conditions when 'none' is absent", async () => {
      const { ctx } = createAuthContext(105);
      const caller = appRouter.createCaller(ctx);

      await caller.health.updateProfile({
        healthConditions: ["diabetes", "hypertension"],
      });

      const profile = await caller.health.getProfile();
      expect(profile.healthConditions).toContain("diabetes");
      expect(profile.healthConditions).toContain("hypertension");
      expect(profile.healthConditions).not.toContain("none");
    });
  });
});
