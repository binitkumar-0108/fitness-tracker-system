import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import {
  InsertUser,
  users,
  healthProfiles,
  exerciseLogs,
  dietPlans,
  mealLogs,
  ayurvedicAssessments,
  healthAlerts,
  activityTrackers,
  progressMetrics,
  dailyMetrics,
  type HealthProfile,
  type ExerciseLog,
  type DietPlan,
  type MealLog,
  type AyurvedicAssessment,
  type HealthAlert,
  type ActivityTracker,
  type ProgressMetric,
  type DailyMetric,
  type InsertHealthProfile,
} from "../drizzle/schema";
import { ENV } from './_core/env';

// --- IN-MEMORY MOCK FOR VITEST ---
const isTest = process.env.VITEST === 'true';

const mockUsers = new Map<string, any>();
const mockHealthProfiles = new Map<number, any>();
const mockExerciseLogs: any[] = [];
const mockDietPlans = new Map<number, any>();
const mockMealLogs: any[] = [];
const mockAyurvedicAssessments = new Map<number, any>();
const mockHealthAlerts = new Map<number, any>();
let nextAlertId = 1;
const mockActivityTrackers: any[] = [];
const mockProgressMetrics: any[] = [];
const mockDailyMetrics: any[] = [];

if (isTest) {
  console.log("[Database] Running in Vitest environment. Redirecting all database queries to in-memory store.");
}

let _supabase: SupabaseClient | null = null;
let _pgPool: Pool | null = null;

function getPgPool() {
  if (!_pgPool) {
    const conn = process.env.DATABASE_URL;
    if (!conn) return null;
    _pgPool = new Pool({ connectionString: conn });
  }
  return _pgPool;
}

// Lazily create the Supabase client for server-side DB operations.
export async function getDb() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL ?? process.env.DATABASE_URL ?? "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
    if (!url || !key) {
      console.warn("[Database] Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
      return null;
    }
    _supabase = createClient(url, key, { auth: { persistSession: false } });
    console.log("[Database] Supabase client initialized");
  }
  return _supabase;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (isTest) {
    const existing = mockUsers.get(user.openId ?? "");
    const updatedUser = {
      id: existing?.id ?? Math.floor(Math.random() * 1000000) + 1,
      openId: user.openId,
      name: user.name,
      email: user.email,
      loginMethod: user.loginMethod,
      lastSignedIn: user.lastSignedIn ?? new Date(),
      role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    mockUsers.set(user.openId ?? "", updatedUser);
    return;
  }

  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const supabase = await getDb();
  if (!supabase) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    console.log("UPSERT USER INPUT:", user);

    const values: InsertUser = {
      openId: user.openId,
      name: user.name,
      email: user.email,
      loginMethod: user.loginMethod,
      lastSignedIn: user.lastSignedIn ?? new Date(),
      role: user.role || (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
    } as InsertUser;

    // Try existing user by openId
    const { data: existing, error: selectErr } = await supabase.from('users').select('*').eq('openId', user.openId).maybeSingle();
    if (selectErr) console.warn('[Database] upsertUser select error:', selectErr);

    if (existing) {
      const { error: updateErr } = await supabase.from('users').update(values).eq('openId', user.openId);
      if (updateErr) {
        console.error('[Database] Failed to update user:', updateErr);
        throw updateErr;
      }
    } else {
      const { error: insertErr } = await supabase.from('users').insert([values]);
      if (insertErr) {
        console.error('[Database] Failed to insert user:', insertErr);
        throw insertErr;
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  if (isTest) {
    return mockUsers.get(openId) ?? null;
  }

  const supabase = await getDb();
  if (!supabase) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  const { data, error } = await supabase.from('users').select('*').eq('openId', openId).maybeSingle();
  if (error) {
    console.warn('[Database] getUserByOpenId error:', error);
    return null;
  }
  return data ?? null;
}

async function pgMaybeSingle(query: string, params: any[] = []) {
  const pool = getPgPool();
  if (!pool) return null;
  const res = await pool.query(query, params);
  return res.rows && res.rows.length > 0 ? res.rows[0] : null;
}

async function pgQuery(query: string, params: any[] = []) {
  const pool = getPgPool();
  if (!pool) return { rows: [], rowCount: 0 };
  return await pool.query(query, params);
}

// Health Profile Queries
const safeParse = (value: any) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export async function getHealthProfile(userId: number) {
  if (isTest) {
    const profile = mockHealthProfiles.get(userId);
    if (!profile) {
      return {
        userId,
        age: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: null,
        fitnessGoal: null,
        bmi: null,
        dosha: "not_assessed",
        healthConditions: [],
        dietaryRestrictions: [],
        allergies: [],
        updatedAt: new Date(),
      };
    }
    return profile;
  }

  const supabase = await getDb();
  console.log("[db] Fetching health profile for userId:", userId);

  if (!supabase) {
    console.log("[db] No database connection, returning default profile");
    return {
      userId,
      age: null,
      height: null,
      weight: null,
      gender: null,
      activityLevel: null,
      fitnessGoal: null,
      bmi: null,
      dosha: "not_assessed",
      healthConditions: [],
      dietaryRestrictions: [],
      allergies: [],
      updatedAt: new Date(),
    };
  }

  const { data, error } = await supabase.from('health_profiles').select('*').eq('userId', userId).maybeSingle();
  if (error) {
    console.warn('[Database] getHealthProfile error:', error);
    // Fallback to direct PG query when PostgREST schema cache doesn't include the table
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      const row = await pgMaybeSingle('SELECT * FROM public.health_profiles WHERE "userId" = $1 LIMIT 1', [userId]);
      if (!row) return {
        userId,
        age: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: null,
        fitnessGoal: null,
        bmi: null,
        dosha: "not_assessed",
        healthConditions: [],
        dietaryRestrictions: [],
        allergies: [],
        updatedAt: new Date(),
      };
      return {
        ...row,
        weight: row.weight ? Number(row.weight) : null,
        height: row.height ? Number(row.height) : null,
        bmi: row.bmi ? Number(row.bmi) : null,
        healthConditions: safeParse(row.healthconditions ?? row.healthConditions),
        dietaryRestrictions: safeParse(row.dietaryrestrictions ?? row.dietaryRestrictions),
        allergies: safeParse(row.allergies),
      };
    }
  }

  if (!data) {
    return {
      userId,
      age: null,
      height: null,
      weight: null,
      gender: null,
      activityLevel: null,
      fitnessGoal: null,
      bmi: null,
      dosha: "not_assessed",
      healthConditions: [],
      dietaryRestrictions: [],
      allergies: [],
      updatedAt: new Date(),
    };
  }

  const profile: any = data;
  return {
    ...profile,
    weight: profile.weight ? Number(profile.weight) : null,
    height: profile.height ? Number(profile.height) : null,
    bmi: profile.bmi ? Number(profile.bmi) : null,
    healthConditions: safeParse(profile.healthConditions),
    dietaryRestrictions: safeParse(profile.dietaryRestrictions),
    allergies: safeParse(profile.allergies),
  };
}

export async function upsertHealthProfile(data: any) {
  if (isTest) {
    const existing = mockHealthProfiles.get(data.userId) || {};
    const updated = {
      ...existing,
      ...data,
      bmi: data.weight && data.height ? Number((data.weight / ((data.height / 100) ** 2)).toFixed(2)) : existing.bmi,
      healthConditions: data.healthConditions ?? existing.healthConditions ?? [],
      dietaryRestrictions: data.dietaryRestrictions ?? existing.dietaryRestrictions ?? [],
      allergies: data.allergies ?? existing.allergies ?? [],
      updatedAt: new Date(),
    };
    mockHealthProfiles.set(data.userId, updated);
    return updated;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  console.log("DB UPDATE EXECUTED for userId:", data.userId);

  const { data: existing, error: selErr } = await supabase.from('health_profiles').select('*').eq('userId', data.userId).maybeSingle();
  if (selErr) {
    console.warn('[Database] upsertHealthProfile select error:', selErr);
    if (selErr.code === 'PGRST205' || (selErr.message && selErr.message.includes('Could not find the table'))) {
      // Fallback to direct Postgres upsert
      const row = await pgMaybeSingle('SELECT * FROM public.health_profiles WHERE "userId" = $1 LIMIT 1', [data.userId]);
      const payload = {
        userId: data.userId,
        age: data.age ?? null,
        weight: data.weight ?? null,
        height: data.height ?? null,
        gender: data.gender ?? null,
        healthConditions: data.healthConditions ? JSON.stringify(data.healthConditions) : null,
        activityLevel: data.activityLevel ?? null,
        fitnessGoal: data.fitnessGoal ?? null,
        dietaryRestrictions: data.dietaryRestrictions ? JSON.stringify(data.dietaryRestrictions) : null,
        allergies: data.allergies ? JSON.stringify(data.allergies) : null,
        dosha: data.dosha ?? 'not_assessed',
        bmi: data.bmi ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (row) {
        const setClause = Object.keys(payload).map((k, i) => `\"${k}\" = $${i + 2}`).join(', ');
        const params = [data.userId, ...Object.values(payload)];
        await pgQuery(`UPDATE public.health_profiles SET ${setClause} WHERE \"userId\" = $1`, params);
      } else {
        const keys = Object.keys(payload).map(k => `\"${k}\"`).join(', ');
        const vals = Object.keys(payload).map((_, i) => `$${i + 1}`).join(', ');
        await pgQuery(`INSERT INTO public.health_profiles (${keys}) VALUES (${vals})`, Object.values(payload));
      }
      return await getHealthProfile(data.userId);
    }
  }

  if (existing) {
    const { error: updateErr } = await supabase.from('health_profiles').update(data).eq('userId', data.userId);
    if (updateErr) console.error('[Database] upsertHealthProfile update error:', updateErr);
  } else {
    const { error: insertErr } = await supabase.from('health_profiles').insert([data]);
    if (insertErr) console.error('[Database] upsertHealthProfile insert error:', insertErr);
  }

  return await getHealthProfile(data.userId);
}

// Exercise Log Queries
export async function createExerciseLog(data: any) {
  if (isTest) {
    const log = {
      ...data,
      id: Math.floor(Math.random() * 1000000) + 1,
      loggedAt: data.loggedAt ?? new Date(),
    };
    mockExerciseLogs.push(log);
    return log;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const { data: inserted, error } = await supabase.from('exercise_logs').insert([data]).select().maybeSingle();
  if (error) {
    console.error('[Database] createExerciseLog error:', error);
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      // Fallback to direct PG insert
      const keys = Object.keys(data).map(k => `\"${k}\"`).join(', ');
      const vals = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
      const params = Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));
      const res = await pgQuery(`INSERT INTO public.exercise_logs (${keys}) VALUES (${vals}) RETURNING id`, params);
      return { ...data, id: res.rows[0]?.id };
    }
    return null;
  }
  return { ...data, id: inserted?.id };
}

export async function getExerciseLogs(userId: number, limit: number = 50) {
  if (isTest) {
    return mockExerciseLogs
      .filter(l => l.userId === userId)
      .sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime())
      .slice(0, limit);
  }

  const supabase = await getDb();
  if (!supabase) return [];
  const { data, error } = await supabase.from('exercise_logs').select('*').eq('userId', userId).order('loggedAt', { ascending: false }).limit(limit);
  if (error) {
    console.warn('[Database] getExerciseLogs error:', error);
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      const res = await pgQuery('SELECT * FROM public.exercise_logs WHERE "userId" = $1 ORDER BY "loggedAt" DESC LIMIT $2', [userId, limit]);
      return res.rows ?? [];
    }
  }
  return data ?? [];
}

// Diet Plan Queries
export async function createDietPlan(data: any) {
  if (isTest) {
    const plan = {
      ...data,
      id: Math.floor(Math.random() * 1000000) + 1,
    };
    mockDietPlans.set(data.userId, plan);
    return plan;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const { data: inserted, error } = await supabase.from('diet_plans').insert([data]).select().maybeSingle();
  if (error) {
    console.error('[Database] createDietPlan error:', error);
    return null;
  }
  return { ...data, id: inserted?.id };
}

export async function getDietPlan(userId: number) {
  if (isTest) {
    return mockDietPlans.get(userId) ?? null;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const { data, error } = await supabase.from('diet_plans').select('*').eq('userId', userId).maybeSingle();
  if (error) console.warn('[Database] getDietPlan error:', error);
  return data ?? null;
}

// Meal Log Queries
export async function createMealLog(data: any) {
  if (isTest) {
    const log = {
      ...data,
      id: Math.floor(Math.random() * 1000000) + 1,
      loggedAt: data.loggedAt ?? new Date(),
    };
    mockMealLogs.push(log);
    return log;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const { data: inserted, error } = await supabase.from('meal_logs').insert([data]).select().maybeSingle();
  if (error) {
    console.error('[Database] createMealLog error:', error);
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      const keys = Object.keys(data).map(k => `\"${k}\"`).join(', ');
      const vals = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
      const params = Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));
      const res = await pgQuery(`INSERT INTO public.meal_logs (${keys}) VALUES (${vals}) RETURNING id`, params);
      return { ...data, id: res.rows[0]?.id };
    }
    return null;
  }
  return { ...data, id: inserted?.id };
}

export async function getMealLogs(userId: number, limit: number = 50) {
  if (isTest) {
    return mockMealLogs
      .filter(l => l.userId === userId)
      .sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime())
      .slice(0, limit);
  }

  const supabase = await getDb();
  if (!supabase) return [];
  const { data, error } = await supabase.from('meal_logs').select('*').eq('userId', userId).order('loggedAt', { ascending: false }).limit(limit);
  if (error) {
    console.warn('[Database] getMealLogs error:', error);
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      const res = await pgQuery('SELECT * FROM public.meal_logs WHERE "userId" = $1 ORDER BY "loggedAt" DESC LIMIT $2', [userId, limit]);
      return res.rows ?? [];
    }
  }
  return data ?? [];
}

// Ayurvedic Assessment Queries
export async function createAyurvedicAssessment(data: any) {
  if (isTest) {
    const assessment = {
      ...data,
      id: Math.floor(Math.random() * 1000000) + 1,
    };
    mockAyurvedicAssessments.set(data.userId, assessment);
    return assessment;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const { data: existing, error: selErr } = await supabase.from('ayurvedic_assessments').select('*').eq('userId', data.userId).maybeSingle();
  if (selErr) {
    console.warn('[Database] createAyurvedicAssessment select error:', selErr);
    if (selErr.code === 'PGRST205' || (selErr.message && selErr.message.includes('Could not find the table'))) {
      const row = await pgMaybeSingle('SELECT * FROM public.ayurvedic_assessments WHERE "userId" = $1 LIMIT 1', [data.userId]);
      if (row) {
        const keys = Object.keys(data).map((k, i) => `\"${k}\" = $${i + 2}`).join(', ');
        const params = [data.userId, ...Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v))];
        await pgQuery(`UPDATE public.ayurvedic_assessments SET ${keys} WHERE \"userId\" = $1`, params);
      } else {
        const keys = Object.keys(data).map(k => `\"${k}\"`).join(', ');
        const vals = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
        const params = Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));
        await pgQuery(`INSERT INTO public.ayurvedic_assessments (${keys}) VALUES (${vals})`, params);
      }
      return await getAyurvedicAssessment(data.userId);
    }
  }
  if (existing) {
    const { error: updateErr } = await supabase.from('ayurvedic_assessments').update(data).eq('userId', data.userId);
    if (updateErr) console.error('[Database] createAyurvedicAssessment update error:', updateErr);
  } else {
    const { error: insertErr } = await supabase.from('ayurvedic_assessments').insert([data]);
    if (insertErr) console.error('[Database] createAyurvedicAssessment insert error:', insertErr);
  }
  return await getAyurvedicAssessment(data.userId);
}

export async function getAyurvedicAssessment(userId: number) {
  if (isTest) {
    return mockAyurvedicAssessments.get(userId) ?? null;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const { data, error } = await supabase.from('ayurvedic_assessments').select('*').eq('userId', userId).maybeSingle();
  if (error) {
    console.warn('[Database] getAyurvedicAssessment error:', error);
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      const row = await pgMaybeSingle('SELECT * FROM public.ayurvedic_assessments WHERE "userId" = $1 LIMIT 1', [userId]);
      if (!row) return null;
      const assessment: any = row;
      return {
        ...assessment,
        doshaScore: typeof assessment.doshascore === "string" ? JSON.parse(assessment.doshascore) : assessment.doshascore,
        recommendations: safeParse(assessment.recommendations),
        dietSuggestions: safeParse(assessment.dietsuggestions ?? assessment.dietSuggestions),
        herbSuggestions: safeParse(assessment.herbsuggestions ?? assessment.herbSuggestions),
        routineSuggestions: safeParse(assessment.routinesuggestions ?? assessment.routineSuggestions),
      };
    }
  }
  if (!data) return null;
  const assessment: any = data;
  return {
    ...assessment,
    doshaScore: typeof assessment.doshaScore === "string" ? JSON.parse(assessment.doshaScore) : assessment.doshaScore,
    recommendations: safeParse(assessment.recommendations),
    dietSuggestions: safeParse(assessment.dietSuggestions),
    herbSuggestions: safeParse(assessment.herbSuggestions),
    routineSuggestions: safeParse(assessment.routineSuggestions),
  };
}

// Health Alerts Queries
export async function createHealthAlert(data: any) {
  if (isTest) {
    const id = nextAlertId++;
    const alert = {
      ...data,
      id,
      isActive: true,
      createdAt: new Date(),
    };
    mockHealthAlerts.set(id, alert);
    return alert;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const { data: inserted, error } = await supabase.from('health_alerts').insert([data]).select().maybeSingle();
  if (error) {
    console.error('[Database] createHealthAlert error:', error);
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      const keys = Object.keys(data).map(k => `\"${k}\"`).join(', ');
      const vals = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
      const params = Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));
      const res = await pgQuery(`INSERT INTO public.health_alerts (${keys}) VALUES (${vals}) RETURNING id`, params);
      return { ...data, id: res.rows[0]?.id };
    }
    return null;
  }
  return { ...data, id: inserted?.id };
}

export async function getHealthAlerts(userId: number) {
  if (isTest) {
    return Array.from(mockHealthAlerts.values()).filter(a => a.userId === userId);
  }

  const supabase = await getDb();
  if (!supabase) return [];
  const { data, error } = await supabase.from('health_alerts').select('*').eq('userId', userId);
  if (error) {
    console.warn('[Database] getHealthAlerts error:', error);
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      const res = await pgQuery('SELECT * FROM public.health_alerts WHERE "userId" = $1', [userId]);
      return res.rows ?? [];
    }
  }
  return data ?? [];
}

export async function updateHealthAlert(alertId: number, data: any) {
  if (isTest) {
    const existing = mockHealthAlerts.get(alertId);
    if (existing) {
      const updated = { ...existing, ...data };
      mockHealthAlerts.set(alertId, updated);
      return updated;
    }
    return null;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const { error } = await supabase.from('health_alerts').update(data).eq('id', alertId);
  if (error) {
    console.error('[Database] updateHealthAlert error:', error);
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      const keys = Object.keys(data).map((k, i) => `\"${k}\" = $${i + 1}`).join(', ');
      const params = Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));
      await pgQuery(`UPDATE public.health_alerts SET ${keys} WHERE id = $${params.length + 1}`, [...params, alertId]);
    }
  }
  return data;
}

export async function deleteHealthAlert(alertId: number) {
  if (isTest) {
    return mockHealthAlerts.delete(alertId);
  }

  const supabase = await getDb();
  if (!supabase) return false;
  const { error } = await supabase.from('health_alerts').delete().eq('id', alertId);
  if (error) {
    console.error('[Database] deleteHealthAlert error:', error);
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      const res = await pgQuery('DELETE FROM public.health_alerts WHERE id = $1', [alertId]);
      return (res.rowCount ?? 0) > 0;
    }
    return false;
  }
  return !error;
}

// Activity Tracker Queries
export async function upsertActivityTracker(data: any) {
  if (isTest) {
    const dateStr = typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0];
    const existingIndex = mockActivityTrackers.findIndex(t => t.userId === data.userId && t.date === dateStr);
    const payload = { ...data, date: dateStr };
    if (existingIndex > -1) {
      mockActivityTrackers[existingIndex] = { ...mockActivityTrackers[existingIndex], ...payload };
    } else {
      mockActivityTrackers.push(payload);
    }
    return payload;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const dateStr = typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0];
  const { data: existing, error: selErr } = await supabase.from('activity_trackers').select('*').eq('userId', data.userId).eq('date', dateStr).maybeSingle();
  if (selErr) {
    console.warn('[Database] upsertActivityTracker select error:', selErr);
    if (selErr.code === 'PGRST205' || (selErr.message && selErr.message.includes('Could not find the table'))) {
      const row = await pgMaybeSingle('SELECT * FROM public.activity_trackers WHERE "userId" = $1 AND "date" = $2 LIMIT 1', [data.userId, dateStr]);
      const payload = { ...data, date: dateStr };
      if (row) {
        const keys = Object.keys(payload).map((k, i) => `\"${k}\" = $${i + 2}`).join(', ');
        const params = [data.userId, ...Object.values(payload).map(v => (typeof v === 'object' ? JSON.stringify(v) : v))];
        await pgQuery(`UPDATE public.activity_trackers SET ${keys} WHERE \"userId\" = $1 AND \"date\" = $2`, params);
      } else {
        const keys = Object.keys(payload).map(k => `\"${k}\"`).join(', ');
        const vals = Object.keys(payload).map((_, i) => `$${i + 1}`).join(', ');
        const params = Object.values(payload).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));
        await pgQuery(`INSERT INTO public.activity_trackers (${keys}) VALUES (${vals})`, params);
      }
      return data;
    }
  }
  if (existing) {
    const { error: updateErr } = await supabase.from('activity_trackers').update(data).eq('userId', data.userId).eq('date', dateStr);
    if (updateErr) console.error('[Database] upsertActivityTracker update error:', updateErr);
  } else {
    const { error: insertErr } = await supabase.from('activity_trackers').insert([{ ...data, date: dateStr }]);
    if (insertErr) console.error('[Database] upsertActivityTracker insert error:', insertErr);
  }
  return data;
}

export async function getActivityTracker(userId: number, date: Date | string) {
  if (isTest) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return mockActivityTrackers.find(t => t.userId === userId && t.date === dateStr) ?? null;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  const { data, error } = await supabase.from('activity_trackers').select('*').eq('userId', userId).eq('date', dateStr).maybeSingle();
  if (error) console.warn('[Database] getActivityTracker error:', error);
  return data ?? null;
}

// Progress Metrics Queries
export async function upsertProgressMetric(data: any) {
  if (isTest) {
    const metricDateVal = typeof data.metricDate === 'string' ? new Date(data.metricDate) : data.metricDate;
    const existingIndex = mockProgressMetrics.findIndex(t => t.userId === data.userId && t.metricDate.getTime() === metricDateVal.getTime());
    const finalData = { ...data, metricDate: metricDateVal };
    if (existingIndex > -1) {
      mockProgressMetrics[existingIndex] = { ...mockProgressMetrics[existingIndex], ...finalData };
    } else {
      mockProgressMetrics.push(finalData);
    }
    return finalData;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const { data: existing, error: selErr } = await supabase.from('progress_metrics').select('*').eq('userId', data.userId).eq('metricDate', data.metricDate).maybeSingle();
  if (selErr) {
    console.warn('[Database] upsertProgressMetric select error:', selErr);
    if (selErr.code === 'PGRST205' || (selErr.message && selErr.message.includes('Could not find the table'))) {
      const row = await pgMaybeSingle('SELECT * FROM public.progress_metrics WHERE "userId" = $1 AND "metricDate" = $2 LIMIT 1', [data.userId, data.metricDate]);
      if (row) {
        const keys = Object.keys(data).map((k, i) => `\"${k}\" = $${i + 2}`).join(', ');
        const params = [data.userId, ...Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v))];
        await pgQuery(`UPDATE public.progress_metrics SET ${keys} WHERE \"userId\" = $1 AND \"metricDate\" = $2`, params);
      } else {
        const keys = Object.keys(data).map(k => `\"${k}\"`).join(', ');
        const vals = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
        const params = Object.values(data).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));
        await pgQuery(`INSERT INTO public.progress_metrics (${keys}) VALUES (${vals})`, params);
      }
      return data;
    }
  }
  if (existing) {
    const { error: updateErr } = await supabase.from('progress_metrics').update(data).eq('userId', data.userId).eq('metricDate', data.metricDate);
    if (updateErr) console.error('[Database] upsertProgressMetric update error:', updateErr);
  } else {
    const { error: insertErr } = await supabase.from('progress_metrics').insert([data]);
    if (insertErr) console.error('[Database] upsertProgressMetric insert error:', insertErr);
  }
  return data;
}

export async function getProgressMetrics(userId: number, days: number = 30) {
  if (isTest) {
    return mockProgressMetrics
      .filter(m => m.userId === userId)
      .sort((a, b) => b.metricDate.getTime() - a.metricDate.getTime())
      .slice(0, days);
  }

  const supabase = await getDb();
  if (!supabase) return [];
  const { data, error } = await supabase.from('progress_metrics').select('*').eq('userId', userId).order('metricDate', { ascending: false }).limit(days);
  if (error) {
    console.warn('[Database] getProgressMetrics error:', error);
    if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
      const res = await pgQuery('SELECT * FROM public.progress_metrics WHERE "userId" = $1 ORDER BY "metricDate" DESC LIMIT $2', [userId, days]);
      return res.rows ?? [];
    }
  }
  return data ?? [];
}

export async function demoLogin() {
  if (isTest) {
    const demoUser = {
      openId: "demo_user",
      name: "Demo User",
      email: "demo@healthflow.com",
      loginMethod: "demo",
      role: "admin",
      lastSignedIn: new Date()
    };
    mockUsers.set(demoUser.openId, demoUser);
    return demoUser;
  }

  const demoUser = {
    openId: "demo_user",
    name: "Demo User",
    email: "demo@healthflow.com",
    loginMethod: "demo",
    role: "admin",
    lastSignedIn: new Date()
  };

  await upsertUser(demoUser as any);

  return demoUser;
}

// Daily Metrics Queries
export async function upsertDailyMetric(data: any) {
  if (isTest) {
    const dateStr = typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0];
    const existingIndex = mockDailyMetrics.findIndex(m => m.userId === data.userId && m.date === dateStr);
    const finalData = { ...data, date: dateStr };
    if (existingIndex > -1) {
      mockDailyMetrics[existingIndex] = { ...mockDailyMetrics[existingIndex], ...finalData };
    } else {
      mockDailyMetrics.push(finalData);
    }
    return finalData;
  }

  const supabase = await getDb();
  if (!supabase) return null;

  // Ensure date is a string YYYY-MM-DD
  const dateStr = typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0];
  const finalData = { ...data, date: dateStr };

  const { data: existing, error: selErr } = await supabase.from('daily_metrics').select('*').eq('userId', finalData.userId).eq('date', finalData.date).maybeSingle();
  if (selErr) {
    console.warn('[Database] upsertDailyMetric select error:', selErr);
    if (selErr.code === 'PGRST205' || (selErr.message && selErr.message.includes('Could not find the table'))) {
      const row = await pgMaybeSingle('SELECT * FROM public.daily_metrics WHERE "userId" = $1 AND "date" = $2 LIMIT 1', [finalData.userId, finalData.date]);
      if (row) {
        const keys = Object.keys(finalData).map((k, i) => `\"${k}\" = $${i + 2}`).join(', ');
        const params = [finalData.userId, ...Object.values(finalData).map(v => (typeof v === 'object' ? JSON.stringify(v) : v))];
        await pgQuery(`UPDATE public.daily_metrics SET ${keys} WHERE \"userId\" = $1 AND \"date\" = $2`, params);
      } else {
        const keys = Object.keys(finalData).map(k => `\"${k}\"`).join(', ');
        const vals = Object.keys(finalData).map((_, i) => `$${i + 1}`).join(', ');
        const params = Object.values(finalData).map(v => (typeof v === 'object' ? JSON.stringify(v) : v));
        await pgQuery(`INSERT INTO public.daily_metrics (${keys}) VALUES (${vals})`, params);
      }
      return finalData;
    }
  }

  if (existing) {
    const { error: updateErr } = await supabase.from('daily_metrics').update(finalData).eq('userId', finalData.userId).eq('date', finalData.date);
    if (updateErr) console.error('[Database] upsertDailyMetric update error:', updateErr);
  } else {
    const { error: insertErr } = await supabase.from('daily_metrics').insert([finalData]);
    if (insertErr) console.error('[Database] upsertDailyMetric insert error:', insertErr);
  }
  return finalData;
}

export async function getDailyMetric(userId: number, date: Date | string) {
  if (isTest) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return mockDailyMetrics.find(m => m.userId === userId && m.date === dateStr) ?? null;
  }

  const supabase = await getDb();
  if (!supabase) return null;
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  const { data, error } = await supabase.from('daily_metrics').select('*').eq('userId', userId).eq('date', dateStr).maybeSingle();
  if (error) console.warn('[Database] getDailyMetric error:', error);
  return data ?? null;
}
