import * as db from "../db";

/**
 * Recalculates and updates daily metrics for a user on a specific date.
 * Aggregates data from meal_logs and exercise_logs.
 */
export async function syncDailyMetrics(userId: number, date: Date | string) {
  // Helper to get local YYYY-MM-DD
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateStr = typeof date === 'string' ? date : getLocalDateStr(date);
  console.log(`[MetricService] Syncing for ${dateStr} (User: ${userId})`);

  // 1. Fetch all meal logs for this day
  const mealLogs = await db.getMealLogs(userId, 100);
  const todayMeals = mealLogs.filter(log => {
    if (!log.loggedAt) return false;
    return getLocalDateStr(new Date(log.loggedAt)) === dateStr;
  });

  const totalCalories = todayMeals.reduce((sum, log) => sum + (log.caloriesEstimate || 0), 0);
  const totalProtein = todayMeals.reduce((sum, log) => sum + (log.protein || 0), 0);

  // 2. Fetch all exercise logs for this day
  const exerciseLogs = await db.getExerciseLogs(userId, 50);
  const todayExercises = exerciseLogs.filter(log => {
    if (!log.loggedAt) return false;
    return getLocalDateStr(new Date(log.loggedAt)) === dateStr;
  });

  const workoutMinutes = todayExercises.reduce((sum, log) => sum + (log.duration || 0), 0);

  // 3. Get steps from activity tracker (if any)
  const activityTracker = await db.getActivityTracker(userId, dateStr);
  const steps = activityTracker?.steps || 0;

  // 4. Get current weight from health profile
  const profile = await db.getHealthProfile(userId);
  const weight = profile.weight;

  // 5. Upsert into daily_metrics
  await db.upsertDailyMetric({
    userId,
    date: dateStr,
    totalCalories,
    totalProtein,
    workoutMinutes,
    steps,
    weight,
  });

  console.log(`[MetricService] Synced daily metrics for user ${userId} on ${dateStr}:`, {
    totalCalories,
    totalProtein,
    workoutMinutes,
    steps
  });
}
