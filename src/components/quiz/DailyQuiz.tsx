import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Zap, Target, Lightbulb, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '../../supabase/supabaseClient';
import { MOCK_QUESTIONS, MockQuestion, shuffleArray, CATEGORIES, saveMistake } from '../../data/mockQuestions';
import QuizEngine from './QuizEngine';
import SmartRecommendation from './SmartRecommendation';
import { motion } from 'framer-motion';

const CATEGORY_COLORS: Record<string, { pill: string; bar: string; score: string }> = {
  'Verbal Ability':       { pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',     bar: 'bg-blue-500',    score: 'text-blue-600 dark:text-blue-400'    },
  'Numerical Ability':    { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'bg-emerald-500', score: 'text-emerald-600 dark:text-emerald-400' },
  'Analytical Ability':   { pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',   bar: 'bg-violet-500',  score: 'text-violet-600 dark:text-violet-400'  },
  'General Information':  { pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',       bar: 'bg-amber-500',   score: 'text-amber-600 dark:text-amber-400'    },
};

const getScoreColor = (correct: number, total: number) => {
  const pct = total > 0 ? correct / total : 0;
  if (pct >= 0.6) return { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' };
  if (pct >= 0.4) return { text: 'text-amber-600 dark:text-amber-400',     bar: 'bg-amber-500'   };
  return           { text: 'text-red-600 dark:text-red-400',               bar: 'bg-red-500'     };
};

interface DailyQuizProps {
  isDarkMode: boolean;
  onBack: () => void;
  onStartPractice: (category: string) => void;
  onOpenAIReview: (category: string) => void;
}

const DailyQuiz = ({ isDarkMode, onBack, onStartPractice, onOpenAIReview }: DailyQuizProps) => {
  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300';
  const btnPrimary = 'bg-blue-600 hover:bg-blue-700 text-white';

  const [phase, setPhase] = useState<'start' | 'quiz' | 'results'>('start');
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const [aiText, setAiText] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const sessionRef = useRef<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<Record<string, { correct: number; total: number }>>({});
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    const checkCompletion = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const today = new Date().toLocaleDateString('en-CA');
        const completedDate = localStorage.getItem(`daily_quiz_completed_${user.id}`);
        if (completedDate === today) {
          setHasCompletedToday(true);
        }
      }
      setIsCheckingStatus(false);
    };
    checkCompletion();
  }, []);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const startQuiz = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let weakCategories: string[] = [];

    if (user) {
      const { data: perf } = await supabase
        .from('performance')
        .select('accuracy_rate, categories:category_id(name)')
        .eq('user_id', user.id)
        .order('accuracy_rate', { ascending: true });

      if (perf && perf.length > 0) {
        // Only include categories with accuracy below 70%
        weakCategories = perf
          .filter((p: any) => (p.accuracy_rate || 0) < 70)
          .map((p: any) => p.categories?.name)
          .filter(Boolean);
      }

      const { data: session } = await supabase.from('quiz_sessions').insert({
        user_id: user.id,
        is_pretest: false,
        is_timed: false,
      }).select().single();
      if (session) sessionRef.current = session.id;
    }

    let selectedQuestions: MockQuestion[] = [];

    if (weakCategories.length > 0) {
      // All 5 questions from weak categories
      weakCategories.forEach(cat => {
        const catQuestions = (MOCK_QUESTIONS[cat] || [])
          .map(q => ({ ...q, category: cat }))
          .sort((a, b) => (Number(a.difficulty) || 1) - (Number(b.difficulty) || 1));
        selectedQuestions.push(...shuffleArray(catQuestions));
      });
    } else {
      // No weak areas — 5 random from all categories
      CATEGORIES.forEach(cat => {
        const catQuestions = (MOCK_QUESTIONS[cat] || [])
          .map(q => ({ ...q, category: cat }));
        selectedQuestions.push(...shuffleArray(catQuestions));
      });
    }

    // Shuffle and limit to 5
    selectedQuestions = shuffleArray(selectedQuestions).slice(0, 5);
    selectedQuestions.sort((a, b) => (Number(a.difficulty) || 1) - (Number(b.difficulty) || 1));

    setQuestions(selectedQuestions);
    setPhase('quiz');
    setCurrentIndex(0);
    setAnswers({});
    setScore(0);
  };

  const getAIExplanation = async (question: MockQuestion, userAnswer: string) => {
    setLoadingAI(true);
    setShowAI(true);
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CiviQuest'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [{
            role: 'system',
            content: 'You are a Civil Service Exam tutor. Explain in 2-3 sentences why the answer is correct and why the user\'s choice was wrong. Be concise and helpful.'
          }, {
            role: 'user',
            content: `Question: ${question.question}\nOptions: ${question.options.join(', ')}\nCorrect answer: ${question.correct}\nMy answer: ${userAnswer}\nPlease explain.`
          }]
        })
      });
      const data = await response.json();
      setAiText(data.choices?.[0]?.message?.content || `The correct answer is "${question.correct}". Review this topic to improve.`);
    } catch {
      setAiText(`The correct answer is "${question.correct}". Review this topic to improve.`);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAnswer = async (questionId: string, selected: string) => {
    if (answers[questionId]) return;
    const q = questions.find(q => q.id === questionId)!;
    const isCorrect = selected === q.correct;
    setAnswers(prev => ({ ...prev, [questionId]: selected }));
    if (isCorrect) setScore(prev => prev + 1);

    if (sessionRef.current) {
      try {
        await supabase.from('quiz_session_answers').insert({
          session_id: sessionRef.current,
          question_id: questionId,
          selected_answer: selected,
          is_correct: isCorrect,
        });
      } catch (err) {
        console.error('Failed to save answer:', err);
      }
    }

    if (!isCorrect) {
      saveMistake(q, selected, q.category || 'Unknown');
      await getAIExplanation(q, selected);
    }
  };

  const nextQuestion = () => {
    setShowAI(false);
    setAiText('');
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const stats: Record<string, { correct: number; total: number }> = {};
    questions.forEach(q => {
      const cat = q.category;
      if (!stats[cat]) stats[cat] = { correct: 0, total: 0 };
      stats[cat].total++;
      if (answers[q.id] === q.correct) stats[cat].correct++;
    });
    setCategoryStats(stats);

    const xp = score * 20;
    setEarnedXP(xp);
    setPhase('results');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toLocaleDateString('en-CA');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');

    const { data: profile } = await supabase.from('profiles').select('xp, level, streak_count, last_active_date').eq('id', user.id).single();
    if (profile) {
      const newXP = (profile.xp || 0) + xp;
      const newLevel = Math.floor(newXP / 500) + 1;
      const lastActive = profile.last_active_date;
      const newStreak = lastActive === today
        ? profile.streak_count
        : lastActive === yesterday
          ? (profile.streak_count || 0) + 1
          : 1;

      await supabase.from('profiles').update({
        xp: newXP,
        level: newLevel,
        streak_count: newStreak,
        last_active_date: today
      }).eq('id', user.id);
    }

    localStorage.setItem(`daily_quiz_completed_${user.id}`, today);
    setHasCompletedToday(true);

    if (sessionRef.current) {
      await supabase.from('quiz_sessions').update({
        score,
        ended_at: new Date().toISOString(),
      }).eq('id', sessionRef.current);
    }

    const { data: categories } = await supabase.from('categories').select('id, name');
    for (const [catName, catStats] of Object.entries(stats)) {
      const catId = categories?.find(c => c.name === catName)?.id;
      if (catId) {
        const { data: existingPerf } = await supabase
          .from('performance')
          .select('total_answered, total_correct')
          .eq('user_id', user.id)
          .eq('category_id', catId)
          .maybeSingle();

        const prevAnswered = existingPerf?.total_answered || 0;
        const prevCorrect = existingPerf?.total_correct || 0;
        const newTotalAnswered = prevAnswered + catStats.total;
        const newTotalCorrect = prevCorrect + catStats.correct;
        const newAccuracy = newTotalAnswered > 0 ? (newTotalCorrect / newTotalAnswered) * 100 : 0;

        await supabase.from('performance').upsert(
          {
            user_id: user.id,
            category_id: catId,
            accuracy_rate: newAccuracy,
            total_answered: newTotalAnswered,
            total_correct: newTotalCorrect,
          },
          { onConflict: 'user_id, category_id' }
        );
      }
    }
  };

  const getWeakest = () => {
    let weakest = { category: '', accuracy: 100 };
    for (const [cat, stats] of Object.entries(categoryStats)) {
      const acc = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      if (acc < weakest.accuracy) {
        weakest = { category: cat, accuracy: acc };
      }
    }
    return weakest;
  };

  // START SCREEN
  if (phase === 'start') {
    if (isCheckingStatus) {
      return (
        <div className="w-full max-w-3xl mx-auto px-4 py-9 flex justify-center items-center h-64">
           <div className={`text-sm ${subtextClass}`}>Checking daily status...</div>
        </div>
      );
    }

    if (hasCompletedToday) {
      return (
        <div className="w-full max-w-3xl mx-auto px-4 py-9 space-y-6">
          <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${subtextClass} hover:${textClass} transition-colors`}>
            <ArrowLeft className="w-4 h-4" /> Back to Quiz Hub
          </button>

          <div className={`${cardBg} rounded-2xl p-8 md:p-11 border shadow-sm space-y-6 text-center`}>
            <div className="flex flex-col items-center gap-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'} ring-8 ${isDarkMode ? 'ring-zinc-800/50' : 'ring-zinc-50'}`}>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h1 className={`text-xl font-bold mt-2 ${textClass}`}>You're all done for today!</h1>
                <p className={`text-sm mt-2 leading-relaxed ${subtextClass} max-w-md mx-auto`}>
                  Great job answering your daily quiz. Check back tomorrow for a new set of personalized questions to keep your streak going!
                </p>
              </div>
            </div>

            <div className={`rounded-xl p-5 border ${isDarkMode ? 'bg-zinc-800/80 border-zinc-700/80' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className={`w-4 h-4 ${subtextClass}`} />
                <span className={`text-sm font-semibold ${textClass}`}>Come back tomorrow</span>
              </div>
              <p className={`text-xs ${subtextClass}`}>Your next daily quiz will be available after midnight.</p>
            </div>

            <button onClick={onBack} className={`w-full py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>
              Return to Hub
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-9 space-y-6">
        <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${subtextClass} hover:${textClass} transition-colors`}>
          <ArrowLeft className="w-4 h-4" /> Back to Quiz Hub
        </button>

        <div className={`${cardBg} rounded-2xl p-8 md:p-11 border shadow-sm space-y-6`}>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
              <Zap className="w-7 h-7 text-yellow-500" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${textClass}`}>Daily Adaptive Quiz</h1>
              <p className={`text-sm mt-1 leading-relaxed ${subtextClass}`}>
                5 questions targeting your weak areas
              </p>
            </div>
          </div>

          <div className={`rounded-xl p-4 space-y-3 ${isDarkMode ? 'bg-zinc-800/60' : 'bg-zinc-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>What to expect</p>
            <WeakAreasFocus isDarkMode={isDarkMode} />
            {[
              { icon: Target, bg: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50', color: 'text-blue-500', text: 'Questions from Verbal, Numerical, Analytical & General Information' },
              { icon: Lightbulb, bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50', color: 'text-yellow-500', text: 'AI-powered explanations for wrong answers' },
              { icon: Zap, bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-50', color: 'text-green-500', text: 'Earn XP and build your streak' },
            ].map(({ icon: Icon, bg, color, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`text-sm leading-relaxed ${textClass}`}>
                  {text}
                </div>
              </div>
            ))}
          </div>

          <button onClick={startQuiz} className={`w-full py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>
            Start Daily Quiz
          </button>
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (phase === 'results') {
    const weakest = getWeakest();
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8 space-y-5">
        <div className="text-center space-y-1">
          <h1 className={`text-2xl font-bold ${textClass}`}>Quiz Complete! 🎉</h1>
          <p className={`text-sm ${subtextClass}`}>Here's how you did</p>
        </div>

        <div className={`${cardBg} rounded-2xl border p-7 text-center space-y-3`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>Total correct</p>
          <p className="text-6xl font-bold text-blue-600">{score}/{questions.length}</p>
          <div className={`w-full rounded-full h-2.5 overflow-hidden ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(score / questions.length) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-2.5 rounded-full bg-blue-500"
            />
          </div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{earnedXP} XP earned</p>
        </div>

        <div className="space-y-3">
          {Object.entries(categoryStats).map(([cat, stats]) => {
            const col = getScoreColor(stats.correct, stats.total);
            const catCol = CATEGORY_COLORS[cat] || { pill: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' };
            return (
              <div key={cat} className={`${cardBg} rounded-xl border p-4 space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${catCol.pill}`}>{cat}</span>
                  <span className={`text-sm font-bold ${col.text}`}>{stats.correct}/{stats.total}</span>
                </div>
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.correct / stats.total) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-1.5 rounded-full ${col.bar}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {weakest.category && (
          <SmartRecommendation
            weakestCategory={weakest.category}
            weakestAccuracy={weakest.accuracy}
            onStartPractice={onStartPractice}
            onOpenAIReview={onOpenAIReview}
            isDarkMode={isDarkMode}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className={`w-full py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  // QUIZ IN PROGRESS
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-5">
      <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${subtextClass} hover:${textClass} transition-colors`}>
        <ArrowLeft className="w-5 h-5" /> Exit Quiz
      </button>

      <div className="space-y-2">
        <div className={`flex justify-between text-xs font-medium ${subtextClass}`}>
          <span>Question {currentIndex + 1} of {questions.length}</span>
        </div>
        <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-1.5 rounded-full bg-blue-500"
          />
        </div>
        <div className="flex justify-center gap-1.5 pt-1">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={`rounded-full transition-all duration-200 ${
                i === currentIndex
                  ? 'w-4 h-1.5 bg-blue-500'
                  : answers[q.id]
                  ? 'w-1.5 h-1.5 bg-blue-300 dark:bg-blue-800'
                  : 'w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {currentQuestion && (
        <QuizEngine
          question={currentQuestion}
          questionIndex={currentIndex}
          totalQuestions={questions.length}
          selectedAnswer={answers[currentQuestion.id] || null}
          onAnswer={handleAnswer}
          showFeedback={true}
          showAIExplanation={true}
          aiExplanationText={aiText}
          loadingAI={loadingAI}
          isDarkMode={isDarkMode}
        />
      )}

      <div className="pt-2">
        {currentQuestion && answers[currentQuestion.id] && (
          <button onClick={nextQuestion} className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${btnPrimary} transition-colors`}>
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const WeakAreasFocus = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const [weakCats, setWeakCats] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: perf } = await supabase
        .from('performance')
        .select('accuracy_rate, categories:category_id(name)')
        .eq('user_id', user.id)
        .order('accuracy_rate', { ascending: true });
      if (perf && perf.length > 0) {
        setWeakCats(perf
          .filter((p: any) => (p.accuracy_rate || 0) < 70)
          .slice(0, 2)
          .map((p: any) => p.categories?.name)
          .filter(Boolean)
        );
      }
    };
    fetch();
  }, []);

  if (weakCats.length === 0) return null;

  return (
    <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-blue-900/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
      <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
        🎯 Focusing on your weak areas:
      </p>
      <div className="flex flex-wrap gap-2">
        {weakCats.map(cat => (
          <span key={cat} className={`text-xs font-medium px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DailyQuiz; 