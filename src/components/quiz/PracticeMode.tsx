import { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Filter, Lightbulb } from 'lucide-react';
import { supabase } from '../../supabase/supabaseClient';
import { MOCK_QUESTIONS, MockQuestion, shuffleArray, CATEGORIES } from '../../data/mockQuestions';
import QuizEngine from './QuizEngine';
import SmartRecommendation from './SmartRecommendation';
import { motion } from 'framer-motion';
import { saveMistake } from '../../data/mockQuestions';

const CATEGORY_COLORS: Record<string, { pill: string; bar: string; score: string }> = {
  'Verbal Ability':       { pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',     bar: 'bg-blue-500',    score: 'text-blue-600 dark:text-blue-400'    },
  'Quantitative Ability': { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'bg-emerald-500', score: 'text-emerald-600 dark:text-emerald-400' },
  'Logical Reasoning':    { pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',   bar: 'bg-violet-500',  score: 'text-violet-600 dark:text-violet-400'  },
};

const getScoreColor = (correct: number, total: number) => {
  const pct = total > 0 ? correct / total : 0;
  if (pct >= 0.6) return { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' };
  if (pct >= 0.4) return { text: 'text-amber-600 dark:text-amber-400',     bar: 'bg-amber-500'   };
  return           { text: 'text-red-600 dark:text-red-400',               bar: 'bg-red-500'     };
};

interface PracticeModeProps {
  isDarkMode: boolean;
  onBack: () => void;
  onOpenAIReview: (category: string) => void;
  preSelectedCategory?: string | null;
}

const PracticeMode = ({ isDarkMode, onBack, onOpenAIReview, preSelectedCategory }: PracticeModeProps) => {
  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300';
  const btnPrimary = 'bg-blue-600 hover:bg-blue-700 text-white';

  const [phase, setPhase] = useState<'config' | 'quiz' | 'results'>('config');
  const [selectedCategory, setSelectedCategory] = useState<string>(preSelectedCategory || 'All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(0); // 0 = All
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [aiText, setAiText] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const sessionRef = useRef<string | null>(null);

  const [categoryStats, setCategoryStats] = useState<Record<string, { correct: number; total: number }>>({});

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const difficultyOptions = [
    { value: 0, label: 'All Levels', color: 'text-blue-500' },
    { value: 1, label: 'Easy', color: 'text-green-500' },
    { value: 2, label: 'Medium', color: 'text-yellow-500' },
    { value: 3, label: 'Hard', color: 'text-red-500' },
  ];

  const startPractice = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: session } = await supabase.from('quiz_sessions').insert({
        user_id: user.id,
        is_pretest: false,
        is_timed: false,
      }).select().single();
      if (session) sessionRef.current = session.id;
    }

    let pool: MockQuestion[] = [];

    if (selectedCategory === 'All') {
      pool = Object.values(MOCK_QUESTIONS).flat();
    } else {
      pool = MOCK_QUESTIONS[selectedCategory] || [];
    }

    if (selectedDifficulty > 0) {
      pool = pool.filter(q => q.difficulty === selectedDifficulty);
    }

    setQuestions(shuffleArray(pool).slice(0, 15));
    setPhase('quiz');
    setCurrentIndex(0);
    setAnswers({});
    setScore(0);
  };

  const getAIExplanation = async (question: MockQuestion, userAnswer: string) => {
    setLoadingAI(true);
    try {
      const apiKey = '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';
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CiviQuest'
        },
        body: JSON.stringify({
          model: 'openrouter/free',
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
      setAiText(data.choices?.[0]?.message?.content || `The correct answer is "${question.correct}".`);
    } catch {
      setAiText(`The correct answer is "${question.correct}".`);
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
    if (!isCorrect) {
  saveMistake(q, selected, q.category || 'Unknown');
    }
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
      await getAIExplanation(q, selected);
    }
  };

  const nextQuestion = () => {
    setAiText('');
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishPractice();
    }
  };

  const finishPractice = async () => {
    const stats: Record<string, { correct: number; total: number }> = {};
    questions.forEach(q => {
      const cat = q.category;
      if (!stats[cat]) stats[cat] = { correct: 0, total: 0 };
      stats[cat].total++;
      if (answers[q.id] === q.correct) stats[cat].correct++;
    });
    setCategoryStats(stats);

    const earnedXP = score * 15; // Slightly less XP than Daily
    setPhase('results');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update profile XP (no streak update for practice)
    const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', user.id).single();
    if (profile) {
      const newXP = (profile.xp || 0) + earnedXP;
      const newLevel = Math.floor(newXP / 500) + 1;
      await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', user.id);
    }

    if (sessionRef.current) {
      await supabase.from('quiz_sessions').update({
        score,
        ended_at: new Date().toISOString(),
      }).eq('id', sessionRef.current);
    }
  };

  const getWeakest = () => {
    let weakest = { category: '', accuracy: 100 };
    for (const [cat, stats] of Object.entries(categoryStats)) {
      const acc = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      if (acc < weakest.accuracy) weakest = { category: cat, accuracy: acc };
    }
    return weakest;
  };

  // CONFIG SCREEN
  if (phase === 'config') {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
        <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${subtextClass} hover:${textClass} transition-colors`}>
          <ArrowLeft className="w-4 h-4" /> Back to Quiz Hub
        </button>

        <div className={`${cardBg} rounded-2xl p-8 md:p-11 border shadow-sm space-y-8`}>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <BookOpen className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${textClass}`}>Practice Mode</h1>
              <p className={`text-sm mt-1 leading-relaxed ${subtextClass}`}>
                Free practice — no pressure, instant feedback
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-500" />
                <h3 className={`text-sm font-bold uppercase tracking-wide ${subtextClass}`}>Select Subject</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['All', ...CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-3.5 rounded-xl text-sm font-medium border transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : `${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-3">
              <h3 className={`text-sm font-bold uppercase tracking-wide ${subtextClass}`}>Select Difficulty</h3>
              <div className="grid grid-cols-2 gap-2">
                {difficultyOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedDifficulty(opt.value)}
                    className={`px-4 py-3.5 rounded-xl text-sm font-medium border transition-all ${
                      selectedDifficulty === opt.value
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : `${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`flex items-start gap-3 p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
            <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>Practice mode gives instant feedback with AI explanations. No XP penalties for wrong answers.</p>
          </div>

          <button onClick={startPractice} className={`w-full py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>
            Start Practice (15 Questions)
          </button>
        </div>
      </div>
    );
  }

  // RESULTS
  if (phase === 'results') {
    const weakest = getWeakest();
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 space-y-5">
        <div className="text-center space-y-1">
          <h1 className={`text-2xl font-bold ${textClass}`}>Practice Complete! ✅</h1>
          <p className={`text-sm ${subtextClass}`}>Great practice session</p>
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
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{score * 15} XP earned</p>
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
            onStartPractice={(cat) => {
              setSelectedCategory(cat);
              setPhase('config');
            }}
            onOpenAIReview={onOpenAIReview}
            isDarkMode={isDarkMode}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => setPhase('config')} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>
            Practice Again
          </button>
          <button onClick={onBack} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm border transition-colors ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}>
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  // QUIZ IN PROGRESS
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${subtextClass} hover:${textClass} transition-colors`}>
        <ArrowLeft className="w-4 h-4" /> Exit Practice
      </button>

      <div className="space-y-2">
        <div className={`flex justify-between text-xs font-medium ${subtextClass}`}>
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
            Practice Mode
          </span>
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
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Practice'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PracticeMode;
  