import { supabase } from '../supabase/supabaseClient';
import { lessonContent } from '../data/lessonContent';

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  quizAccuracy: number;
  quizCorrect: number;
  quizTotal: number;
  lessonCompleted: number;
  lessonTotal: number;
  regularAccuracy: number;
  regularAnswered: number;
  regularCorrect: number;
}

export interface TimePerformance {
  date: string;
  score: number;
  accuracy: number;
}

export const getCategoryPerformanceData = async (): Promise<CategoryPerformance[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get lesson progress (lesson quizzes)
    const { data: lessonProgress } = await supabase
      .from('lesson_progress')
      .select('category_id, topic_id, score, total_questions, status')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    // Get regular quiz performance
    const { data: perf } = await supabase
      .from('performance')
      .select('accuracy_rate, total_answered, total_correct, category_id')
      .eq('user_id', user.id);

    // Get categories
    const { data: categories } = await supabase.from('categories').select('id, name');

    return (categories || []).map((cat: any) => {
      // Lesson quiz data
      const catLessons = (lessonProgress || []).filter((l: any) => l.category_id === cat.id);
      const quizCorrect = catLessons.reduce((sum: number, l: any) => sum + (l.score || 0), 0);
      const quizTotal = catLessons.reduce((sum: number, l: any) => sum + (l.total_questions || 0), 0);
      const quizAccuracy = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0;

      // Regular quiz data
      const perfData = (perf || []).find((p: any) => p.category_id === cat.id);

      // Topic count from lessonContent
      const categoryContent = lessonContent.find(c => c.title === cat.name);
      const totalTopics = categoryContent?.topics?.filter(t => t.items.length > 0).length || 0;

      return {
        categoryId: cat.id,
        categoryName: cat.name || 'Unknown',
        quizAccuracy,
        quizCorrect,
        quizTotal,
        lessonCompleted: catLessons.length,
        lessonTotal: totalTopics,
        regularAccuracy: Math.round(perfData?.accuracy_rate || 0),
        regularAnswered: perfData?.total_answered || 0,
        regularCorrect: perfData?.total_correct || 0,
      };
    });
  } catch (error) {
    console.error("Error getting category performance data:", error);
    return [];
  }
};

export const getTimePerformanceData = async (): Promise<TimePerformance[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('score, total_questions, started_at')
      .eq('user_id', user.id)
      .eq('is_pretest', false)
      .order('started_at', { ascending: true });

    if (error) throw error;

    const dateMap = new Map<string, { totalScore: number; totalQuestions: number }>();

    (data || []).forEach((session: any) => {
      const dateStr = new Date(session.started_at).toISOString().split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) {
        existing.totalScore += session.score || 0;
        existing.totalQuestions += session.total_questions || 0;
      } else {
        dateMap.set(dateStr, { totalScore: session.score || 0, totalQuestions: session.total_questions || 0 });
      }
    });

    const result: TimePerformance[] = [];
    dateMap.forEach((value, date) => {
      result.push({
        date,
        score: value.totalScore,
        accuracy: value.totalQuestions > 0 ? Math.round((value.totalScore / value.totalQuestions) * 100) : 0,
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error getting time performance data:", error);
    return [];
  }
};