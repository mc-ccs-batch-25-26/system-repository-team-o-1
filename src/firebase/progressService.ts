import { supabase } from '../supabase/supabaseClient';

// ============================================
// CIVIQUEST PROGRESS SERVICE
// ============================================

// Save user progress after quiz completion
export const saveUserProgress = async (progressData: {
  topicId: number;
  topicTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  timeSpent: number;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: user.id,
        score: progressData.score,
        is_pretest: false,
        is_timed: true,
        ended_at: progressData.completedAt.toISOString(),
      });

    if (error) {
      console.error('Error saving user progress:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in saveUserProgress:', error);
    return { success: false, error };
  }
};

// Get overall progress stats from performance table
export const getProgressStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        completion: 0,
        accuracy: 0,
        studyTime: 0,
        quizzesTaken: 0,
        readiness: 0,
      };
    }

    const userId = user.id;

    // Get performance data
    const { data: performanceData, error: perfError } = await supabase
      .from('performance')
      .select('*')
      .eq('user_id', userId);

    if (perfError) throw perfError;

    // Get quiz sessions count
    const { count: quizCount, error: countError } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    // Calculate stats
    let totalAnswered = 0;
    let totalCorrect = 0;

    (performanceData || []).forEach((perf: any) => {
      totalAnswered += perf.total_answered || 0;
      totalCorrect += perf.total_correct || 0;
    });

    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const completion = Math.round(((performanceData || []).length / 3) * 100); // 3 categories

    // Get pre-test status
    const { data: profile } = await supabase
      .from('profiles')
      .select('pretest_done')
      .eq('id', userId)
      .single();

    const readiness = profile?.pretest_done ? accuracy : 0;

    return {
      completion,
      accuracy,
      studyTime: quizCount || 0, // number of quizzes taken
      quizzesTaken: quizCount || 0,
      readiness,
    };
  } catch (error) {
    console.error("Error fetching progress stats:", error);
    return {
      completion: 0,
      accuracy: 0,
      studyTime: 0,
      quizzesTaken: 0,
      readiness: 0,
    };
  }
};

// Get performance per category (for weak areas display)
export const getCategoryPerformance = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('performance')
      .select(`
        accuracy_rate,
        total_answered,
        total_correct,
        categories:category_id (name)
      `)
      .eq('user_id', user.id);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      category: item.categories?.name || 'Unknown',
      accuracy: Math.round(item.accuracy_rate || 0),
      totalAnswered: item.total_answered,
      totalCorrect: item.total_correct,
    }));
  } catch (error) {
    console.error("Error fetching category performance:", error);
    return [];
  }
};

// Save quiz session result
export const saveQuizSession = async (
  score: number,
  totalQuestions: number,
  isPretest: boolean,
  isTimed: boolean
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: user.id,
        score,
        is_pretest: isPretest,
        is_timed: isTimed,
        ended_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, sessionId: data.id };
  } catch (error) {
    console.error("Error saving quiz session:", error);
    return { success: false, error };
  }
};

// Save individual answer
export const saveAnswer = async (
  sessionId: string,
  questionId: string,
  selectedAnswer: string,
  isCorrect: boolean
) => {
  try {
    const { error } = await supabase
      .from('quiz_session_answers')
      .insert({
        session_id: sessionId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error saving answer:", error);
    return { success: false, error };
  }
};

// Update performance after quiz
export const updatePerformance = async (categoryId: string, isCorrect: boolean) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get current performance
    const { data: existing } = await supabase
      .from('performance')
      .select('*')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .single();

    const totalAnswered = (existing?.total_answered || 0) + 1;
    const totalCorrect = (existing?.total_correct || 0) + (isCorrect ? 1 : 0);
    const accuracyRate = (totalCorrect / totalAnswered) * 100;

    if (existing) {
      await supabase
        .from('performance')
        .update({
          accuracy_rate: accuracyRate,
          total_answered: totalAnswered,
          total_correct: totalCorrect,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('performance')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          accuracy_rate: accuracyRate,
          total_answered: totalAnswered,
          total_correct: totalCorrect,
        });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating performance:", error);
    return { success: false, error };
  }
};

// Get wrong answers for review
export const getWrongAnswers = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('quiz_session_answers')
      .select(`
        selected_answer,
        is_correct,
        questions:question_id (question_text, correct_answer, option_a, option_b, option_c, option_d)
      `)
      .eq('is_correct', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching wrong answers:", error);
    return [];
  }
};