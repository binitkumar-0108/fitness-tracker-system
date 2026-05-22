import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { upsertUser } from "./db";
import { sdk } from "./_core/sdk";
import { analyzeUserDay } from "./services/insightEngine";
import { syncDailyMetrics } from "./services/metricService";

/**
 * Intelligent helper to generate rule-based meal suggestions
 */
function generateDietSuggestions(profile: any) {
  const suggestions = [
    // --- BREAKFAST (11) ---
    { 
      name: "Oats with Fruits", 
      description: "Hearty oats tipped with berries and honey", 
      calories: 400, protein: 12, carbs: 70, fat: 8,
      image: "/meals/oats_fruits.png", 
      tags: ["vegetarian", "low_fat"], type: "breakfast",
      ingredients: ["Rolled Oats", "Milk or Water", "Blueberries", "Banana", "Honey"],
      steps: ["Cook oats until soft", "Add honey", "Top with fresh fruits"]
    },
    { 
      name: "Egg White Omelette", 
      description: "Fluffy egg whites with spinach and mushrooms", 
      calories: 250, protein: 25, carbs: 10, fat: 12,
      image: "/meals/egg_white_omelette.png", 
      tags: ["low_calorie", "high_protein", "keto", "low_fat"], type: "breakfast",
      ingredients: ["6 Egg Whites", "Fresh Spinach", "Mushrooms"],
      steps: ["Sauté veggies", "Add egg whites", "Cook until set"]
    },
    {
      name: "Greek Yogurt with Honey",
      description: "Creamy Greek yogurt topped with honey and nuts",
      calories: 300, protein: 15, carbs: 32, fat: 12,
      image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
      tags: ["vegetarian", "low_sugar", "low_fat"], type: "breakfast",
      ingredients: ["Greek Yogurt", "Honey", "Walnuts"],
      steps: ["Place yogurt in bowl", "Drizzle honey", "Sprinkle nuts"]
    },
    {
      name: "Avocado Toast",
      description: "Whole grain toast topped with mashed avocado, a poached egg, and chili flakes",
      calories: 420, protein: 14, carbs: 35, fat: 24,
      image: "/meals/avocado_toast.png",
      tags: ["high_protein"], type: "breakfast",
      ingredients: ["Whole Grain Bread", "Avocado", "Poached Egg", "Chili Flakes", "Lemon"],
      steps: ["Toast bread", "Mash avocado with lemon", "Top with poached egg and chili flakes"]
    },
    {
      name: "Smoothie Bowl",
      description: "Mixed berries smoothie bowl with chia seeds",
      calories: 320, protein: 10, carbs: 55, fat: 6,
      image: "/meals/smoothie_bowl.png",
      tags: ["vegan", "vegetarian", "gluten_free", "low_fat"], type: "breakfast",
      ingredients: ["Frozen Berries", "Banana", "Almond Milk", "Chia Seeds"],
      steps: ["Blend fruit and milk", "Pour into bowl", "Top with chia seeds"]
    },
    {
      name: "Scrambled Tofu",
      description: "Turmeric-infused scrambled tofu with bell peppers",
      calories: 280, protein: 18, carbs: 12, fat: 18,
      image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
      tags: ["vegan", "vegetarian", "gluten_free"], type: "breakfast",
      ingredients: ["Firm Tofu", "Turmeric", "Bell Peppers", "Onions"],
      steps: ["Crumble tofu", "Sauté with peppers and spices", "Serve hot"]
    },
    {
      name: "Banana Pancakes",
      description: "2-ingredient healthy pancakes made from oats and bananas",
      calories: 380, protein: 10, carbs: 65, fat: 8,
      image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=300&fit=crop",
      tags: ["vegetarian", "gluten_free", "low_fat"], type: "breakfast",
      ingredients: ["Banana", "Oat Flour", "Eggs"],
      steps: ["Mash banana", "Mix with egg and flour", "Cook in pan"]
    },
    {
      name: "Chia Pudding",
      description: "Overnight chia seed pudding with almond milk",
      calories: 220, protein: 8, carbs: 20, fat: 12,
      image: "/meals/chia_pudding.png",
      tags: ["vegan", "vegetarian", "gluten_free", "low_fat"], type: "breakfast",
      ingredients: ["Chia Seeds", "Almond Milk", "Vanilla Extract"],
      steps: ["Mix ingredients", "Refrigerate overnight", "Serve chilled"]
    },
    {
      name: "Breakfast Burrito",
      description: "Healthy burrito with egg whites and black beans",
      calories: 420, protein: 22, carbs: 50, fat: 15,
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400&h=300&fit=crop",
      tags: ["vegetarian"], type: "breakfast",
      ingredients: ["Whole Wheat Tortilla", "Egg Whites", "Black Beans", "Salsa"],
      steps: ["Scramble egg whites", "Warm beans and tortilla", "Wrap and serve"]
    },
    {
      name: "Pineapple Cottage Cheese",
      description: "Low-fat cottage cheese paired with fresh pineapple chunks",
      calories: 200, protein: 14, carbs: 25, fat: 4,
      image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&h=300&fit=crop",
      tags: ["vegetarian", "low_calorie", "low_fat"], type: "breakfast",
      ingredients: ["Low-fat Cottage Cheese", "Fresh Pineapple"],
      steps: ["Place cheese in bowl", "Top with pineapple chunks"]
    },
    {
      name: "Berry Oat Bran Bowl",
      description: "Warm oat bran cooked with almond milk and fresh mixed berries",
      calories: 240, protein: 8, carbs: 40, fat: 5,
      image: "/meals/berry_oat_bowl.jpg",
      tags: ["vegan", "vegetarian", "gluten_free", "low_fat"], type: "breakfast",
      ingredients: ["Oat Bran", "Almond Milk", "Mixed Berries", "Cinnamon"],
      steps: ["Cook oat bran in milk", "Stir until creamy", "Top with berries"]
    },

    // --- LUNCH (11) ---
    { 
      name: "Grilled Paneer Salad", 
      description: "Fresh greens with grilled paneer and balsamic vinaigrette", 
      calories: 350, protein: 20, carbs: 15, fat: 23,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop", 
      tags: ["vegetarian", "low_sugar"], type: "lunch",
      ingredients: ["Paneer", "Mixed Greens", "Balsamic Vinegar"],
      steps: ["Grill paneer", "Toss greens", "Apply dressing"]
    },
    { 
      name: "Grilled Tofu Platter", 
      description: "Marinated tofu with steamed broccoli", 
      calories: 320, protein: 22, carbs: 20, fat: 16,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", 
      tags: ["vegan", "vegetarian", "low_sugar"], type: "lunch",
      ingredients: ["Tofu", "Broccoli", "Soy Sauce"],
      steps: ["Marinate tofu", "Grill tofu", "Steam broccoli"]
    },
    {
      name: "Chickpea Salad",
      description: "Hearty chickpea salad with cucumbers and tomatoes",
      calories: 380, protein: 14, carbs: 55, fat: 12,
      image: "/meals/chickpea_salad_user.png",
      tags: ["vegan", "vegetarian", "gluten_free", "low_fat"], type: "lunch",
      ingredients: ["Chickpeas", "Cucumber", "Tomato", "Lemon"],
      steps: ["Rinse chickpeas", "Chop vegetables", "Mix with lemon juice"]
    },
    {
      name: "Mediterranean Veggies",
      description: "Roasted Mediterranean vegetables with herbs",
      calories: 280, protein: 8, carbs: 32, fat: 14,
      image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop",
      tags: ["vegan", "vegetarian", "gluten_free", "low_fat"], type: "lunch",
      ingredients: ["Zucchini", "Bell Peppers", "Eggplant", "Olive Oil"],
      steps: ["Slice veggies", "Toss in oil and herbs", "Roast at 200°C"]
    },
    {
      name: "Turkey Hummus Wrap",
      description: "Lean turkey slices with hummus and spinach in a whole wheat wrap",
      calories: 410, protein: 28, carbs: 45, fat: 14,
      image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop",
      tags: ["high_protein", "low_fat"], type: "lunch",
      ingredients: ["Whole Wheat Wrap", "Turkey Slices", "Hummus", "Spinach"],
      steps: ["Spread hummus", "Layer turkey and spinach", "Roll tightly"]
    },
    {
      name: "Quinoa Bean Bowl",
      description: "Healthy quinoa bowl with black beans and corn",
      calories: 460, protein: 18, carbs: 75, fat: 10,
      image: "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=400&h=300&fit=crop",
      tags: ["vegan", "vegetarian", "gluten_free", "low_fat"], type: "lunch",
      ingredients: ["Quinoa", "Black Beans", "Corn", "Lime"],
      steps: ["Cook quinoa", "Mix with beans and corn", "Drizzle lime juice"]
    },
    {
      name: "Salmon Spinach Salad",
      description: "Grilled salmon fillet over fresh baby spinach",
      calories: 450, protein: 35, carbs: 10, fat: 28,
      image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
      tags: ["gluten_free", "high_protein"], type: "lunch",
      ingredients: ["Salmon", "Baby Spinach", "Lemon", "Olive Oil"],
      steps: ["Grill salmon", "Place over spinach", "Drizzle lemon oil"]
    },
    {
      name: "Miso Tofu Soup",
      description: "Authentic japanese miso soup with silk tofu and seaweed",
      calories: 120, protein: 8, carbs: 12, fat: 5,
      image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
      tags: ["vegan", "vegetarian", "low_calorie", "low_fat"], type: "lunch",
      ingredients: ["Miso Paste", "Silk Tofu", "Seaweed", "Green Onions"],
      steps: ["Boil water", "Dissolve miso", "Add tofu and seaweed"]
    },
    {
      name: "Falafel Tahini Plate",
      description: "Baked falafels served with tahini and fresh pita",
      calories: 480, protein: 14, carbs: 60, fat: 20,
      image: "/meals/falafel_plate.png",
      tags: ["vegetarian"], type: "lunch",
      ingredients: ["Chickpea Falafel", "Tahini Sauce", "Whole Wheat Pita", "Cucumber"],
      steps: ["Bake falafels", "Warm pita", "Serve with sauce and veggies"]
    },
    {
      name: "Light Tuna Salad",
      description: "Tuna salad made with Greek yogurt instead of mayo",
      calories: 250, protein: 32, carbs: 15, fat: 6,
      image: "https://images.unsplash.com/photo-1512838243191-e81e8f66f1fd?w=400&h=300&fit=crop",
      tags: ["high_protein", "low_fat"], type: "lunch",
      ingredients: ["Canned Tuna", "Greek Yogurt", "Celery", "Onion"],
      steps: ["Drain tuna", "Mix with yogurt and chopped veggies", "Serve on greens"]
    },
    {
      name: "Steamed White Fish with Asparagus",
      description: "Delicately steamed white fish served alongside fresh roasted asparagus",
      calories: 260, protein: 35, carbs: 8, fat: 6,
      image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop",
      tags: ["high_protein", "gluten_free", "low_fat"], type: "lunch",
      ingredients: ["Cod Fillet", "Asparagus", "Lemon", "Black Pepper"],
      steps: ["Season fish", "Steam until flaky", "Serve with roasted asparagus"]
    },

    // --- DINNER (11) ---
    { 
      name: "Lentil Soup", 
      description: "Protein-rich lentil soup with garden vegetables", 
      calories: 300, protein: 18, carbs: 45, fat: 6,
      image: "/meals/lentil_soup.png", 
      tags: ["vegan", "vegetarian", "gluten_free", "low_fat"], type: "dinner",
      ingredients: ["Lentils", "Carrots", "Onions", "Broth"],
      steps: ["Sauté veggies", "Add lentils and broth", "Simmer 20 mins"]
    },
    { 
      name: "Quinoa Bowl", 
      description: "Balanced quinoa bowl with roasted chickpeas", 
      calories: 450, protein: 15, carbs: 65, fat: 15,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", 
      tags: ["vegan", "vegetarian", "gluten_free", "balanced"], type: "dinner",
      ingredients: ["Quinoa", "Chickpeas", "Cucumber"],
      steps: ["Cook quinoa", "Roast chickpeas", "Mix and serve"]
    },
    {
      name: "Lemon Herb Chicken",
      description: "Grilled chicken breast seasoned with lemon and herbs",
      calories: 380, protein: 35, carbs: 10, fat: 20,
      image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop",
      tags: ["high_protein", "gluten_free"], type: "dinner",
      ingredients: ["Chicken Breast", "Lemon", "Rosemary", "Garlic"],
      steps: ["Season chicken", "Grill until cooked", "Drizzle with lemon"]
    },
    {
      name: "Baked Salmon",
      description: "Fresh salmon baked with asparagus and garlic",
      calories: 420, protein: 32, carbs: 15, fat: 25,
      image: "/meals/baked_salmon.png",
      tags: ["high_protein", "gluten_free"], type: "dinner",
      ingredients: ["Salmon Fillet", "Asparagus", "Garlic", "Lemon"],
      steps: ["Season salmon and asparagus", "Bake at 200°C for 15 mins", "Serve hot"]
    },
    {
      name: "Veggie Stir-fry",
      description: "Asian stir-fry with mixed vegetables and peanut sauce",
      calories: 340, protein: 12, carbs: 35, fat: 18,
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop",
      tags: ["vegan", "vegetarian"], type: "dinner",
      ingredients: ["Bok Choy", "Peanuts", "Soy Sauce", "Tofu"],
      steps: ["Sauté tofu and veggies", "Whisk peanut sauce", "Toss together"]
    },
    {
      name: "Ratatouille",
      description: "Classic French stewed vegetable dish",
      calories: 220, protein: 6, carbs: 32, fat: 8,
      image: "/meals/ratatouille.png",
      tags: ["vegan", "vegetarian", "gluten_free", "low_calorie", "low_fat"], type: "dinner",
      ingredients: ["Eggplant", "Zucchini", "Bell Peppers", "Tomatoes"],
      steps: ["Slice veggies", "Slow cook in tomato sauce", "Serve with herbs"]
    },
    {
      name: "Stuffed Bell Peppers",
      description: "Bell peppers stuffed with lentils, rice, and spices",
      calories: 390, protein: 16, carbs: 55, fat: 12,
      image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&h=300&fit=crop",
      tags: ["vegetarian", "gluten_free", "low_fat"], type: "dinner",
      ingredients: ["Bell Peppers", "Lentils", "Brown Rice", "Feta Cheese"],
      steps: ["Hollow peppers", "Stuff with cooked mixtures", "Bake until tender"]
    },
    {
      name: "Black Bean Tacos",
      description: "Simple bean tacos with corn tortillas and avocado",
      calories: 440, protein: 14, carbs: 55, fat: 18,
      image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop",
      tags: ["vegan", "vegetarian", "gluten_free"], type: "dinner",
      ingredients: ["Black Beans", "Corn Tortillas", "Avocado", "Lime"],
      steps: ["Season beans", "Warm tortillas", "Assemble with avocado"]
    },
    {
      name: "Low-fat Lasagna",
      description: "Spinach and ricotta lasagna using low-fat ingredients",
      calories: 460, protein: 24, carbs: 65, fat: 12,
      image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=300&fit=crop",
      tags: ["vegetarian", "low_fat"], type: "dinner",
      ingredients: ["Lasagna Sheets", "Ricotta", "Spinach", "Marinara"],
      steps: ["Layer sheets and cheese", "Bake at 180°C", "Let set before serving"]
    },
    {
      name: "Light Veggie Korma",
      description: "Healthy Indian curry with mixed vegetables and coconut milk",
      calories: 410, protein: 10, carbs: 45, fat: 22,
      image: "/meals/veggie_korma_user.png",
      tags: ["vegan", "vegetarian", "gluten_free"], type: "dinner",
      ingredients: ["Mixed Veggies", "Coconut Milk", "Ginger", "Turmeric"],
      steps: ["Sauté aromatics", "Simmer veggies in coconut milk", "Serve with rice"]
    },
    {
      name: "Lean Turkey Chili",
      description: "Comforting chili made with lean turkey meat, kidney beans, and tomatoes",
      calories: 310, protein: 28, carbs: 32, fat: 8,
      image: "/meals/lean_turkey_chilli.jpg",
      tags: ["high_protein", "gluten_free", "low_fat"], type: "dinner",
      ingredients: ["Lean Ground Turkey", "Kidney Beans", "Diced Tomatoes", "Chili Powder"],
      steps: ["Brown turkey", "Add beans, tomatoes and spices", "Simmer for 30 mins"]
    }
  ];

  // Parse strings back to arrays if they are strings (from DB)
  const restrictions = typeof profile?.dietaryRestrictions === 'string' ? JSON.parse(profile.dietaryRestrictions || "[]") : (profile?.dietaryRestrictions || []);
  const conditions = typeof profile?.healthConditions === 'string' ? JSON.parse(profile.healthConditions || "[]") : (profile?.healthConditions || []);
  const goal = profile?.fitnessGoal;
  const allergies = typeof profile?.allergies === 'string' ? JSON.parse(profile.allergies || "[]") : (profile?.allergies || []);

  let filtered = suggestions;

  // 0. Allergies
  if (allergies.length > 0) {
    filtered = filtered.filter(s => {
      const hasAllergyInIngredients = s.ingredients.some(ing => 
        allergies.some((allergy: string) => ing.toLowerCase().includes(allergy.trim().toLowerCase()))
      );
      const hasAllergyInName = allergies.some((allergy: string) => s.name.toLowerCase().includes(allergy.trim().toLowerCase()));
      return !hasAllergyInIngredients && !hasAllergyInName;
    });
  }

  // 1. Dietary Restrictions
  if (restrictions.includes("vegan")) {
    filtered = filtered.filter(s => s.tags.includes("vegan"));
  } else if (restrictions.includes("vegetarian")) {
    filtered = filtered.filter(s => s.tags.includes("vegetarian"));
  }
  
  if (restrictions.includes("gluten_free")) {
    filtered = filtered.filter(s => s.tags.includes("gluten_free"));
  }

  // 2. Health Conditions
  if (conditions.includes("diabetes")) {
    filtered = filtered.filter(s => s.tags.includes("low_sugar") || s.calories < 400);
  }
  if (conditions.includes("cardiac")) {
    filtered = filtered.filter(s => s.tags.includes("low_fat"));
  }

  // 3. Fitness Goals
  if (goal === "weight_loss") {
    filtered = filtered.sort((a, b) => a.calories - b.calories);
  } else if (goal === "muscle_gain") {
    filtered = filtered.sort((a, b) => b.protein - a.protein);
  }

  return filtered;
}

export const appRouter = router({
  system: router({
    health: publicProcedure
      .input(z.object({ timestamp: z.number().min(0) }))
      .query(() => ({ ok: true })),
    seedDemoData: protectedProcedure.mutation(async ({ ctx }) => {
      const userId = ctx.user.id;
      
      // 1. Seed Health Profile
      await db.upsertHealthProfile({
        userId,
        age: 28,
        weight: 75.5,
        height: 180,
        gender: "male",
        activityLevel: "moderate",
        fitnessGoal: "muscle_gain",
        bmi: 23.3,
        healthConditions: JSON.stringify(["none"]),
        dietaryRestrictions: JSON.stringify(["vegetarian"]),
      });

      // 2. Seed Exercise Logs
      const exercises = [
        { name: "Running", cat: "cardio", dur: 30, cal: 300 },
        { name: "Bench Press", cat: "strength", dur: 45, cal: 200 },
        { name: "Swimming", cat: "cardio", dur: 20, cal: 250 },
      ];

      for (const ex of exercises) {
        await db.createExerciseLog({
          userId,
          exerciseName: ex.name,
          category: ex.cat,
          duration: ex.dur,
          intensity: "moderate",
          caloriesBurned: ex.cal,
          loggedAt: new Date(Date.now() - Math.random() * 1000000000),
        });
      }

      // 3. Seed Progress Metrics
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        await db.upsertProgressMetric({
          userId,
          metricDate: date,
          weight: 75.5 - (i * 0.1),
          bmi: 23.3,
          exerciseMinutes: 30 + Math.floor(Math.random() * 30),
          caloriesBurned: 200 + Math.floor(Math.random() * 200),
          goalAchievement: 80 + Math.floor(Math.random() * 20),
        });
      }

      return { success: true };
    }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  login: publicProcedure
  .input(z.object({
    openId: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    loginMethod: z.string()
  }))
  .mutation(async ({ input, ctx }) => {

    await upsertUser({
      openId: input.openId,
      name: input.name,
      email: input.email,
      loginMethod: input.loginMethod
    });

    const cookieOptions = getSessionCookieOptions(ctx.req);
    const sessionToken = await sdk.createSessionToken(input.openId, {
      name: input.name ?? "User"
    });

    console.log(`[Auth] Setting cookie ${COOKIE_NAME} with options:`, cookieOptions);
    console.log(`[Auth] Session token generated for: ${input.openId}`);

    ctx.res.cookie(
      COOKIE_NAME,
      sessionToken,
      cookieOptions
    );

    return { success: true };
  }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {  
        success: true,
      } as const;
    }),
  }),

  health: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getHealthProfile(ctx.user.id);
    }),
    updateProfile: protectedProcedure.input(z.object({
      age: z.number().min(0).max(120).optional(),
      weight: z.number().positive().optional(),
      height: z.number().positive().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      healthConditions: z.array(z.string()).optional(),
      activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
      fitnessGoal: z.enum(["weight_loss", "muscle_gain", "endurance", "general_health"]).optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      console.log("[Mutation] updateProfile STARTED - User ID:", ctx.user.id);
      console.log("[Mutation] updateProfile INPUT:", JSON.stringify(input, null, 2));
      console.log("INPUT RECEIVED:", input.dietaryRestrictions);

      if (input.dietaryRestrictions && !Array.isArray(input.dietaryRestrictions)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "dietaryRestrictions must be an array",
        });
      }

      try {
        const bmi = input.weight && input.height ? 
          Number((input.weight / ((input.height / 100) ** 2)).toFixed(2)) : undefined;
        
        const result = await db.upsertHealthProfile({
          userId: ctx.user.id,
          ...(input.age !== undefined && { age: input.age }),
          ...(input.weight !== undefined && { weight: input.weight }),
          ...(input.height !== undefined && { height: input.height }),
          ...(input.gender !== undefined && { gender: input.gender }),
          ...(input.activityLevel !== undefined && { activityLevel: input.activityLevel }),
          ...(input.fitnessGoal !== undefined && { fitnessGoal: input.fitnessGoal }),
          ...(bmi !== undefined && { bmi }),
          ...(input.healthConditions !== undefined && { 
            healthConditions: input.healthConditions 
          }),
          ...(input.dietaryRestrictions !== undefined && { 
            dietaryRestrictions: input.dietaryRestrictions 
          }),
          ...(input.allergies !== undefined && { 
            allergies: input.allergies 
          }),
        });

        console.log("[Mutation] updateProfile SUCCESS - User ID:", ctx.user.id);
        return result;
      } catch (error) {
        console.error("[Mutation] updateProfile FAILURE - User ID:", ctx.user.id, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update health profile. Please try again later.",
          cause: error,
        });
      }
    }),
  }),

  exercise: router({
    logExercise: protectedProcedure.input(z.object({
      exerciseName: z.string(),
      category: z.enum(["cardio", "strength", "flexibility", "sports", "other"]),
      duration: z.number(),
      intensity: z.enum(["light", "moderate", "high"]),
      caloriesBurned: z.number().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.createExerciseLog({
        userId: ctx.user.id,
        ...input,
        loggedAt: new Date(),
      });
      // Sync daily metrics after logging exercise (non-blocking)
      try {
        await syncDailyMetrics(ctx.user.id, new Date());
      } catch (err) {
        console.error("[TRPC] Failed to sync daily metrics after exercise:", err);
      }
      return result;
    }),
    getExerciseLogs: protectedProcedure.input(z.object({
      limit: z.number().default(50),
    })).query(async ({ ctx, input }) => {
      return await db.getExerciseLogs(ctx.user.id, input.limit);
    }),
  }),

  diet: router({
    createPlan: protectedProcedure.input(z.object({
      planName: z.string(),
      description: z.string(),
      mealSuggestions: z.array(z.any()),
      proteinTarget: z.number(),
      calorieTarget: z.number(),
      healthCondition: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return await db.createDietPlan({
        userId: ctx.user.id,
        ...input,
        mealSuggestions: JSON.stringify(input.mealSuggestions),
      });
    }),
    getPlan: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDietPlan(ctx.user.id);
    }),
    logMeal: protectedProcedure.input(z.object({
      mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
      mealName: z.string(),
      caloriesEstimate: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.createMealLog({
        userId: ctx.user.id,
        ...input,
        loggedAt: new Date(),
      });
      // Sync daily metrics after logging meal (non-blocking)
      try {
        await syncDailyMetrics(ctx.user.id, new Date());
      } catch (err) {
        console.error("[TRPC] Failed to sync daily metrics after meal:", err);
      }
      return result;
    }),
    getMealLogs: protectedProcedure.input(z.object({
      limit: z.number().default(50),
    })).query(async ({ ctx, input }) => {
      return await db.getMealLogs(ctx.user.id, input.limit);
    }),
    getSuggestions: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getHealthProfile(ctx.user.id);
      return generateDietSuggestions(profile);
    }),
  }),

  ayurveda: router({
    getAssessment: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAyurvedicAssessment(ctx.user.id);
    }),
    createAssessment: protectedProcedure.input(z.object({
      dosha: z.enum(["vata", "pitta", "kapha"]),
      doshaScore: z.record(z.string(), z.number()),
      recommendations: z.array(z.string()),
      dietSuggestions: z.array(z.string()),
      herbSuggestions: z.array(z.string()),
      routineSuggestions: z.array(z.string()),
    })).mutation(async ({ ctx, input }) => {
      return await db.createAyurvedicAssessment({
        userId: ctx.user.id,
        ...input,
      });
    }),
  }),

  alerts: router({
    createAlert: protectedProcedure.input(z.object({
      alertType: z.enum(["medication", "hydration", "exercise", "meal", "custom"]),
      title: z.string(),
      description: z.string().optional(),
      frequency: z.enum(["daily", "weekly", "custom"]),
      scheduledTime: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return await db.createHealthAlert({
        userId: ctx.user.id,
        ...input,
      });
    }),
    getAlerts: protectedProcedure.query(async ({ ctx }) => {
      return await db.getHealthAlerts(ctx.user.id);
    }),
    updateAlert: protectedProcedure.input(z.object({
      alertId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { alertId, ...updateData } = input;
      return await db.updateHealthAlert(alertId, updateData);
    }),
    deleteAlert: protectedProcedure.input(z.object({
      alertId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      return await db.deleteHealthAlert(input.alertId);
    }),
  }),

  insights: router({
    getInsights: protectedProcedure.query(async ({ ctx }) => {
      return await analyzeUserDay(ctx.user.id);
    }),
  }),

  analytics: router({
    getProgressMetrics: protectedProcedure.input(z.object({
      days: z.number().default(30),
    })).query(async ({ ctx, input }) => {
      return await db.getProgressMetrics(ctx.user.id, input.days);
    }),
  }),
});

export type AppRouter = typeof appRouter;

