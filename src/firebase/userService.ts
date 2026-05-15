import { supabase } from '../supabase/supabaseClient';

const PROFILES_TABLE = 'profiles';

// Interface for user data
export interface UserData {
  userId: string;
  email: string;
  username?: string;
  xp: number;
  level: number;
  pretestDone: boolean;
  streakCount: number;
  lastActiveDate?: string;
  createdAt: Date;
}

// Helper to map DB row to UserData
const mapToUserData = (data: any): UserData => {
  return {
    userId: data.id,
    email: data.email,
    username: data.username,
    xp: data.xp || 0,
    level: data.level || 1,
    pretestDone: data.pretest_done || false,
    streakCount: data.streak_count || 0,
    lastActiveDate: data.last_active_date,
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  };
};

// Helper to map UserData to DB row
const mapToDbRow = (userData: Partial<UserData>): any => {
  const row: any = {};
  if (userData.userId !== undefined) row.id = userData.userId;
  if (userData.email !== undefined) row.email = userData.email;
  if (userData.username !== undefined) row.username = userData.username;
  if (userData.xp !== undefined) row.xp = userData.xp;
  if (userData.level !== undefined) row.level = userData.level;
  if (userData.pretestDone !== undefined) row.pretest_done = userData.pretestDone;
  if (userData.streakCount !== undefined) row.streak_count = userData.streakCount;
  if (userData.lastActiveDate !== undefined) row.last_active_date = userData.lastActiveDate;
  return row;
};

// Cache for user data
const userDataCache = new Map<string, { value: UserData | null; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Get user data
export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const cached = userDataCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.value;
    }

    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        userDataCache.set(userId, { value: null, timestamp: Date.now() });
        return null;
      }
      throw error;
    }

    if (data) {
      const userData = mapToUserData(data);
      userDataCache.set(userId, { value: userData, timestamp: Date.now() });
      return userData;
    }

    userDataCache.set(userId, { value: null, timestamp: Date.now() });
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserData>) => {
  try {
    const dbData = mapToDbRow(updates);

    const { error } = await supabase
      .from(PROFILES_TABLE)
      .update(dbData)
      .eq('id', userId);

    if (error) throw error;

    userDataCache.delete(userId);
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error };
  }
};

// Update XP
export const updateUserXP = async (userId: string, xp: number) => {
  return updateUserProfile(userId, { xp });
};

// Update level
export const updateUserLevel = async (userId: string, level: number) => {
  return updateUserProfile(userId, { level });
};

// Mark pre-test as done
export const markPretestDone = async (userId: string) => {
  return updateUserProfile(userId, { pretestDone: true });
};

// Update streak
export const updateStreak = async (userId: string, streakCount: number) => {
  return updateUserProfile(userId, { streakCount, lastActiveDate: new Date().toISOString().split('T')[0] });
};

// Invalidate cache
export const invalidateUserCache = (userId: string) => {
  userDataCache.delete(userId);
};