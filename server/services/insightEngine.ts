import * as db from "../db";

export interface Insight {
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  severity: number; // 0 to 1
  action: string;
  suggestions: string[];
}

export interface DailyAnalysis {
  insights: Insight[];
  healthScore: number;
}

/**
 * Core engine to analyze user metrics and generate intelligent health insights
 */
export async function analyzeUserDay(userId: number): Promise<DailyAnalysis> {
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateStr(new Date());
  const profile = await db.getHealthProfile(userId);
  const rawMetrics = await db.getDailyMetric(userId, today);
  const metrics = {
    totalCalories: Number(rawMetrics?.totalCalories ?? 0),
    totalProtein: Number(rawMetrics?.totalProtein ?? 0),
    workoutMinutes: Number(rawMetrics?.workoutMinutes ?? 0),
    steps: Number(rawMetrics?.steps ?? 0),
    weight: rawMetrics?.weight ? Number(rawMetrics.weight) : (profile?.weight ? Number(profile.weight) : 70)
  };

  const weight = metrics.weight;
  const insights: Insight[] = [];

  // Helper for personalized suggestions
  const getProteinSuggestions = (profile: any) => {
    let restrictions: string[] = [];
    let allergies: string[] = [];

    const safeParse = (data: any): string[] => {
      if (!data) return [];
      if (Array.isArray(data)) return data.map(s => String(s).toLowerCase());
      if (typeof data === 'string') {
        const trimmed = data.trim();
        if (!trimmed) return [];
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed.map(s => String(s).toLowerCase()) : [String(parsed).toLowerCase()];
        } catch (e) {
          // Fallback if it's a plain string like "vegetarian, vegan" or "egg"
          return trimmed.split(',').map(s => s.trim().toLowerCase());
        }
      }
      return [];
    };

    restrictions = safeParse(profile?.dietaryRestrictions);
    allergies = safeParse(profile?.allergies);
    
    const isVegetarian = restrictions.some(r => r.includes("vegetarian") || r.includes("vegan"));
    const hasEggAllergy = allergies.some(a => a.includes("egg"));
    const isVegan = restrictions.some(r => r.includes("vegan"));

    const baseSuggestions = [];
    if (!isVegetarian && !isVegan) baseSuggestions.push("Include chicken or lean meat");
    if (!hasEggAllergy && !isVegan) baseSuggestions.push("Add eggs to breakfast");
    if (!isVegan) baseSuggestions.push("Have a Greek yogurt or paneer");
    
    baseSuggestions.push("Add lentils or beans to lunch");
    baseSuggestions.push("Have a protein shake (plant-based if vegan)");
    baseSuggestions.push("Snack on roasted chickpeas or nuts");

    return baseSuggestions.slice(0, 3);
  };

  const proteinSuggestions = getProteinSuggestions(profile);

  // 1. Protein Analysis (Target: 0.8g per kg)
  const proteinPerKg = metrics.totalProtein / weight;
  if (proteinPerKg < 0.8) {
    insights.push({
      type: "warning",
      title: "Low Protein Intake",
      message: `You've only consumed ${(proteinPerKg).toFixed(1)}g per kg. Muscles need protein to recover. (+0 points)`,
      severity: 0.8,
      action: "Add Protein Meal",
      suggestions: proteinSuggestions
    });
  } else if (proteinPerKg >= 1.2) {
    insights.push({
      type: "success",
      title: "Optimal Protein Reached",
      message: "Great job! You've reached an optimal protein level for muscle maintenance. (+40 points)",
      severity: 0.1,
      action: "Stay Consistent",
      suggestions: ["Keep up the balanced meals", "Monitor recovery levels"]
    });
  } else {
    insights.push({
      type: "info",
      title: "Good Protein Progress",
      message: `You've reached the baseline protein requirement. Aim for 1.2g/kg for better results. (+20 points)`,
      severity: 0.3,
      action: "Add Protein Meal",
      suggestions: proteinSuggestions
    });
  }

  // 2. Calorie Analysis
  const estimatedBMR = weight * 22;
  const calorieThreshold = estimatedBMR * 0.8;
  if (metrics.totalCalories >= calorieThreshold && metrics.totalCalories <= estimatedBMR * 1.2) {
    insights.push({
      type: "success",
      title: "Healthy Calorie Range",
      message: "You are staying within your optimal metabolic range today. (+30 points)",
      severity: 0.1,
      action: "Log Meal",
      suggestions: ["Maintain this balance", "Focus on nutrient-dense foods"]
    });
  } else if (metrics.totalCalories > 0 && metrics.totalCalories < calorieThreshold) {
    insights.push({
      type: "warning",
      title: "Calorie Deficit Too High",
      message: "Consuming too few calories can slow your metabolism and cause fatigue. (+10 points for logging)",
      severity: 0.7,
      action: "Increase Intake",
      suggestions: ["Add healthy fats like nuts", "Increase portion sizes", "Have a nutrient-dense snack"]
    });
  } else if (metrics.totalCalories === 0) {
    insights.push({
      type: "info",
      title: "Calorie Tracking Pending",
      message: "Log your first meal to start tracking your energy balance. (+0 points)",
      severity: 0.4,
      action: "Log Meal",
      suggestions: ["Add your breakfast", "Track a healthy snack", "Log your lunch"]
    });
  }

  // 3. Workout Analysis
  if (metrics.workoutMinutes < 30) {
    insights.push({
      type: "info",
      title: "Activity Goal Pending",
      message: metrics.workoutMinutes > 0 
        ? `You've done ${metrics.workoutMinutes} mins, but aim for 30 for the full reward. (+15 points)`
        : "You haven't hit the 30-minute daily activity target yet. (+0 points)",
      severity: 0.4,
      action: "Start Workout",
      suggestions: ["Try a quick 15-min HIIT", "Go for a brisk walk", "Follow a 10-min stretching routine"]
    });
  } else {
    insights.push({
      type: "success",
      title: "Workout Goal Met",
      message: `Fantastic! You've completed ${metrics.workoutMinutes} minutes of exercise today. (+30 points)`,
      severity: 0.1,
      action: "Log Recovery",
      suggestions: ["Drink plenty of water", "Do some light stretching", "Get 7-8 hours of sleep"]
    });
  }

  // 4. Success Condition (All primary targets met)
  if (proteinPerKg >= 0.8 && metrics.totalCalories >= calorieThreshold && metrics.workoutMinutes >= 30) {
    insights.push({
      type: "success",
      title: "Daily Champion! 🏆",
      message: "You've hit all your key health targets today. Your body will thank you!",
      severity: 0,
      action: "Share Progress",
      suggestions: ["Keep this streak going!", "Invite a friend to join"]
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "Start Your Journey",
      message: "Log your meals and workouts daily to unlock personalized health insights and track your progress.",
      severity: 0.1,
      action: "Log Meal",
      suggestions: ["Track your breakfast", "Log a 15-min walk"]
    });
  }

  const healthScore = calculateHealthScore(metrics, weight, calorieThreshold);

  return {
    insights: insights.sort((a, b) => b.severity - a.severity),
    healthScore
  };
}

/**
 * Calculates a health score from 0-100 based on daily metrics
 */
export function calculateHealthScore(metrics: any, weight: number, calorieThreshold: number): number {
  let score = 0;

  // 1. Protein Points (Max 40)
  const proteinPerKg = metrics.totalProtein / weight;
  if (proteinPerKg >= 1.2) score += 40;
  else if (proteinPerKg >= 0.8) score += 20;

  // 2. Calorie Points (Max 30)
  // Reward for being within a healthy range (BMR threshold to 120% of BMR)
  const estimatedBMR = weight * 22;
  if (metrics.totalCalories >= calorieThreshold && metrics.totalCalories <= estimatedBMR * 1.2) {
    score += 30;
  } else if (metrics.totalCalories > 0) {
    score += 10; // Some points for logging
  }

  // 3. Workout Points (Max 30)
  if (metrics.workoutMinutes >= 30) score += 30;
  else if (metrics.workoutMinutes > 0) score += 15;

  return Math.min(100, score);
}
