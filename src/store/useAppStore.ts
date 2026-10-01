import { create } from 'zustand';
import { router } from 'expo-router';

import { apiFetch, AuthExpiredError } from '@/lib/api';
import { useAuthStore } from './useAuthStore';

/** Backend meal types — must match POST /api/meals exactly. */
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
  /** ISO date string */
  date: string;
}

export interface MealGroup {
  type: MealType;
  items: MealItem[];
  totalKcal: number;
}

export interface TodaySummary {
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalCalories: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  groups: MealGroup[];
}

type Status = 'idle' | 'loading' | 'error' | 'success';

interface AppState {
  status: Status;
  today: TodaySummary | null;
  error: string | null;
  /** Refresh today's summary from /api/meals/today + /api/stats. */
  refresh: () => Promise<void>;
}

interface TodayResponse {
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalCalories: number;
  grouped?: Partial<Record<MealType, MealItem[]>>;
}

interface StatsResponse {
  calorieGoal?: number;
  proteinGoal?: number;
  carbGoal?: number;
  fatGoal?: number;
}

/** Best guess for "now" — used as the default mealType when logging. */
export function guessMealType(now = new Date()): MealType {
  const h = now.getHours();
  if (h < 11) return 'Breakfast';
  if (h < 15) return 'Lunch';
  if (h < 21) return 'Dinner';
  return 'Snack';
}

/** Greeting by time of day — en-GB copy. */
export function greetingFor(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const FALLBACK_GOALS = { calorieGoal: 2000, proteinGoal: 120, carbGoal: 250, fatGoal: 65 };

function positive(value: unknown, fallback: number): number {
  return typeof value === 'number' && value > 0 ? value : fallback;
}

async function handleAuthExpired(): Promise<void> {
  await useAuthStore.getState().logout();
  router.replace('/(auth)/login');
}

/** Single-flight so rapid focus events don't stack requests. */
let refreshFlight: Promise<void> | null = null;

export const useAppStore = create<AppState>((set) => ({
  status: 'idle',
  today: null,
  error: null,

  refresh: async () => {
    if (refreshFlight) return refreshFlight;
    refreshFlight = (async () => {
      set({ status: 'loading', error: null });
      try {
        const [today, stats] = await Promise.all([
          apiFetch<TodayResponse>('/api/meals/today'),
          apiFetch<StatsResponse>('/api/stats'),
        ]);

        const groups: MealGroup[] = MEAL_TYPES.map((type) => {
          const items = today.grouped?.[type] ?? [];
          const totalKcal = items.reduce((sum, m) => sum + (m.calories ?? 0), 0);
          return { type, items, totalKcal };
        });

        set({
          status: 'success',
          today: {
            totalCalories: today.totalCalories ?? 0,
            protein: today.protein ?? 0,
            carbs: today.carbs ?? 0,
            fat: today.fat ?? 0,
            goalCalories: positive(today.goalCalories, FALLBACK_GOALS.calorieGoal),
            proteinGoal: positive(stats.proteinGoal, FALLBACK_GOALS.proteinGoal),
            carbGoal: positive(stats.carbGoal, FALLBACK_GOALS.carbGoal),
            fatGoal: positive(stats.fatGoal, FALLBACK_GOALS.fatGoal),
            groups,
          },
        });
      } catch (err) {
        if (err instanceof AuthExpiredError) {
          await handleAuthExpired();
          return;
        }
        set({
          status: 'error',
          error:
            err instanceof Error ? err.message : 'Could not load today’s summary. Please try again.',
        });
      } finally {
        refreshFlight = null;
      }
    })();
    return refreshFlight;
  },
}));
