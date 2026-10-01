import { create } from 'zustand';

export interface MealEntry {
  id: string;
  name: string;
  time: string;
  items: number;
  kcal: number;
  /** tile tint for the thumbnail placeholder */
  tint: string;
}

export interface DaySummary {
  dateLabel: string;
  greeting: string;
  userName: string;
  kcalConsumed: number;
  kcalGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fat: number;
  fatGoal: number;
  meals: MealEntry[];
}

const mockDay: DaySummary = {
  dateLabel: 'Tuesday, 15 Oct',
  greeting: 'Good evening,',
  userName: 'Aarya',
  kcalConsumed: 1540,
  kcalGoal: 2400,
  protein: 128,
  proteinGoal: 170,
  carbs: 210,
  carbsGoal: 280,
  fat: 64,
  fatGoal: 80,
  meals: [
    { id: 'breakfast', name: 'Breakfast', time: '8:30 AM', items: 3, kcal: 520, tint: '#F3E5C8' },
    { id: 'lunch', name: 'Lunch', time: '12:45 PM', items: 4, kcal: 680, tint: '#DCEBD2' },
    { id: 'snacks', name: 'Snacks', time: '4:15 PM', items: 2, kcal: 210, tint: '#E4D9F2' },
    { id: 'dinner', name: 'Dinner', time: 'Not logged yet', items: 0, kcal: 0, tint: '#F6F4EE' },
  ],
};

interface AppState {
  day: DaySummary;
}

export const useAppStore = create<AppState>(() => ({
  day: mockDay,
}));
