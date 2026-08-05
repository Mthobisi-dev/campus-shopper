'use client';

import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'campus_shopper_user_id';

export async function getOrCreateUserId(): Promise<string> {
  if (typeof window === 'undefined') {
    return '00000000-0000-0000-0000-000000000001';
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id) {
      localStorage.setItem(STORAGE_KEY, user.id);
      return user.id;
    }
  } catch (err) {
    console.warn('Supabase auth check fallback:', err);
  }

  // Fallback to persistent local storage user ID for guest/demo sessions
  let localId = localStorage.getItem(STORAGE_KEY);
  if (!localId || !localId.includes('-')) {
    localId = 'dut_student_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem(STORAGE_KEY, localId);
  }
  return localId;
}

export function notifyBudgetUpdated(newBudget?: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('campus_shopper_budget_updated', { detail: { newBudget } }));
  }
}
