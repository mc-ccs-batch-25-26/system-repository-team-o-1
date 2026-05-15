import { supabase } from '../supabase/supabaseClient';

// Interface for category performance data
export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  accuracy: number;
  totalAnswered: number;
  totalCorrect: number;
}

// Interface for time-based performance data
export interface TimePerformance {
  date: string;
  score: number;
  accuracy: number;
}

// Get performance data by category
export const getCategoryPerformanceData = async (): Promise<CategoryPerformance[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('performance')
      .select(`
        accuracy_rate,
        total_answered,
        total_correct,
        categories:category_id (id, name)
      `)
      .eq('user_id', user.id);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      categoryId: item.categories?.id || '',
      categoryName: item.categories?.name || 'Unknown',
      accuracy: Math.round(item.accuracy_rate || 0),
      totalAnswered: item.total_answered || 0,
      totalCorrect: item.total_correct || 0,
    }));
  } catch (error) {
    console.error("Error getting category performance data:", error);
    return [];
  }
};

// Get performance data over time (from quiz sessions)
export const getTimePerformanceData = async (): Promise<TimePerformance[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('score, started_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const dateMap = new Map<string, { totalScore: number; count: number }>();

    (data || []).forEach((session: any) => {
      const dateStr = new Date(session.started_at).toISOString().split('T')[0];
      const existing = dateMap.get(dateStr);

      if (existing) {
        existing.totalScore += session.score;
        existing.count += 1;
      } else {
        dateMap.set(dateStr, { totalScore: session.score, count: 1 });
      }
    });

    const result: TimePerformance[] = [];
    dateMap.forEach((value, date) => {
      result.push({
        date,
        score: Math.round(value.totalScore / value.count),
        accuracy: Math.round((value.totalScore / (value.count * 20)) * 100), // Assuming ~20 questions per quiz
      });
    });

    return result;
  } catch (error) {
    console.error("Error getting time performance data:", error);
    return [];
  }
};