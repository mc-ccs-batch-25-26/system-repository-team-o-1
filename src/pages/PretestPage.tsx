import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import { MOCK_QUESTIONS, MockQuestion, shuffleArray } from '../data/mockQuestions';
import { CheckCircle2, Target, BarChart2, Zap, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRETEST_QUESTIONS: MockQuestion[] = [
  ...shuffleArray(MOCK_QUESTIONS['Verbal Ability'] || []).slice(0, 5),
  ...shuffleArray(MOCK_QUESTIONS['Numerical Ability'] || []).slice(0, 5),
  ...shuffleArray(MOCK_QUESTIONS['Analytical Ability'] || []).slice(0, 5),
  ...shuffleArray(MOCK_QUESTIONS['General Information'] || []).slice(0, 5),
];

const CATEGORY_COLORS: Record<string, { pill: string; bar: string; score: string }> = {
  'Verbal Ability':       { pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',         bar: 'bg-blue-500',    score: 'text-blue-600 dark:text-blue-400'     },
  'Numerical Ability':    { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'bg-emerald-500', score: 'text-emerald-600 dark:text-emerald-400' },
  'Analytical Ability':   { pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',   bar: 'bg-violet-500',  score: 'text-violet-600 dark:text-violet-400'  },
  'General Information':  { pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',       bar: 'bg-amber-500',   score: 'text-amber-600 dark:text-amber-400'    },
};

const getScoreColor = (correct: number, total: number) => {
  const pct = correct / total;
  if (pct >= 0.6) return { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' };
  if (pct >= 0.4) return { text: 'text-amber-600 dark:text-amber-400',     bar: 'bg-amber-500'   };
  return           { text: 'text-red-600 dark:text-red-400',               bar: 'bg-red-500'     };
};

const PretestPage = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const question = PRETEST_QUESTIONS[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / PRETEST_QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestion === PRETEST_QUESTIONS.length - 1;
  const allAnswered = answeredCount === PRETEST_QUESTIONS.length;

  const handleOptionSelect = (questionId: string, option: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const goToNext = () => { if (currentQuestion < PRETEST_QUESTIONS.length - 1) setCurrentQuestion(p => p + 1); };
  const goToPrevious = () => { if (currentQuestion > 0) setCurrentQuestion(p => p - 1); };

  const getResults = () => {
    const cat: Record<string, { total: number; correct: number }> = {};
    PRETEST_QUESTIONS.forEach(q => {
      if (!cat[q.category]) {
        cat[q.category] = { total: 0, correct: 0 };
      }
      cat[q.category].total += 1;
      if (answers[q.id] === q.correct) cat[q.category].correct += 1;
    });
    return cat;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitted(true);
    setShowResults(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const categoryPerformance = getResults();
        
        // 1. Mark pretest as done in profiles
        await supabase.from('profiles').update({ pretest_done: true }).eq('id', session.user.id);
        
        // 2. Award XP for completing pretest
        const pretestXP = 100;
        const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', session.user.id).single();
        if (profile) {
          const newXP = (profile.xp || 0) + pretestXP;
          await supabase.from('profiles').update({ xp: newXP, level: Math.floor(newXP / 500) + 1 }).eq('id', session.user.id);
        }

        // 3. Get categories for mapping
        const { data: categories } = await supabase.from('categories').select('id, name');
        
        // 4. Save results to new pretest_results table (one row per category)
        const pretestInserts = Object.entries(categoryPerformance).map(async ([categoryName, stats]) => {
          const category = categories?.find(c => c.name === categoryName);
          if (!category) {
            console.warn(`Category not found: ${categoryName}`);
            return;
          }
          
          const accuracy = (stats.correct / stats.total) * 100;
          const isWeakCategory = accuracy < 50; // Below 50% is considered weak
          
          const { error: upsertErr } = await supabase
            .from('pretest_results')
            .upsert(
              {
                user_id: session.user.id,
                category_id: category.id,
                score: stats.correct,
                total_questions: stats.total,
                weak_category: isWeakCategory,
                completed_at: new Date().toISOString(),
              },
              { onConflict: 'user_id, category_id' }
            );

          if (upsertErr) {
            console.error(`Failed to save pretest result for ${categoryName}:`, upsertErr);
          }
        });

        await Promise.all(pretestInserts);

        // 5. Save quiz session record (for history, NOT for progress)
        const totalScore = Object.values(categoryPerformance).reduce((s, c) => s + c.correct, 0);
        await supabase.from('quiz_sessions').insert({
          user_id: session.user.id,
          score: totalScore,
          is_pretest: true,
          is_timed: false,
          ended_at: new Date().toISOString(),
        });

        // IMPORTANT: DO NOT update the 'performance' table here!
        // Pretest results should NOT affect lesson progress.
        
      }
    } catch (err) {
      console.error('Error submitting pretest:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => { 
    window.location.href = '/'; 
  };

  const results = showResults ? getResults() : null;
  const totalCorrect = results ? Object.values(results).reduce((s, c) => s + c.correct, 0) : 0;

  // ── RESULTS VIEW ──
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Pre-Test complete!</h1>
            <p className="text-sm text-zinc-500">Here's your baseline performance</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-300 dark:border-zinc-800 p-7 text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Total correct</p>
            <p className="text-6xl font-bold text-blue-600">{totalCorrect}/{PRETEST_QUESTIONS.length}</p>
            <div className="w-full bg-zinc-300 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(totalCorrect / PRETEST_QUESTIONS.length) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-2.5 rounded-full bg-blue-500"
              />
            </div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+100 XP earned</p>
          </div>
          <div className="space-y-3">
            {Object.entries(results).map(([category, stats]) => {
              const col = getScoreColor(stats.correct, stats.total);
              const catCol = CATEGORY_COLORS[category];
              return (
                <div key={category} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-800 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${catCol?.pill || ''}`}>{category}</span>
                    <span className={`text-sm font-bold ${col.text}`}>{stats.correct}/{stats.total}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
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
          <button
            onClick={handleContinue}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            {isSubmitting ? 'Saving…' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  // ── INTRO VIEW ──
  if (showIntro) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-xl space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-300 dark:border-zinc-800 p-11 space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Diagnostic Pre-Test</h1>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                  Helps CiviQuest understand your current knowledge level across Civil Service Exam subjects.
                </p>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Why take the pre-test?</p>
              {[
                { icon: Target, bg: 'bg-blue-50 dark:bg-blue-900/30', color: 'text-blue-500', title: 'Personalized quizzes', desc: 'weak areas get priority in daily quizzes' },
                { icon: BarChart2, bg: 'bg-emerald-50 dark:bg-emerald-900/30', color: 'text-emerald-500', title: 'Track improvement', desc: 'compare progress against this baseline' },
                { icon: Zap, bg: 'bg-amber-50 dark:bg-amber-900/30', color: 'text-amber-500', title: 'Efficient study', desc: 'spend time on what matters most' },
              ].map(({ icon: Icon, bg, color, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{title}</span> — {desc}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 text-center text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
             <span className="font-semibold">{PRETEST_QUESTIONS.length} questions</span> across 4 categories<br />
              Verbal Ability · Numerical Ability · Analytical Ability · General Information
            </div>
            <button
              onClick={() => setShowIntro(false)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              Start Pre-Test
            </button>
            <p className="text-center text-xs text-zinc-400">You can only take this once. Answers are final after submission.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION VIEW ──
  const catCol = CATEGORY_COLORS[question.category];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-2xl space-y-9">
        <div className="text-center space-y-0.5">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Diagnostic Pre-Test</h1>
          <p className="text-xs text-zinc-500">Answer all {PRETEST_QUESTIONS.length} questions to assess your baseline</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Question {currentQuestion + 1} of {PRETEST_QUESTIONS.length}</span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="w-full bg-zinc-300 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full bg-blue-500"
            />
          </div>
          <div className="flex justify-center gap-1.5 pt-0.5">
            {PRETEST_QUESTIONS.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === currentQuestion
                    ? 'w-4 h-2 bg-blue-500'
                    : answers[q.id]
                    ? 'w-2 h-2 bg-blue-300 dark:bg-blue-600'
                    : 'w-2 h-2 bg-zinc-300 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-300 dark:border-zinc-800 p-6 space-y-5 shadow-sm"
          >
            <div className="space-y-3">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${catCol?.pill || ''}`}>
                {question.category}
              </span>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white leading-relaxed">
                {currentQuestion + 1}. {question.question}
              </h3>
            </div>

            <div className="space-y-2.5">
              {question.options.map(option => {
                const isSelected = answers[question.id] === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleOptionSelect(question.id, option)}
                    disabled={submitted}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={currentQuestion === 0}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              currentQuestion === 0
                ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            ← Previous
          </button>

          <span className="text-xs text-zinc-400">{answeredCount}/{PRETEST_QUESTIONS.length} answered</span>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all ${
                allAnswered && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </button>
          ) : (
            <button
              onClick={goToNext}
              disabled={!answers[question.id]}
              className={`px-8 py-2 rounded-lg text-sm font-semibold text-white transition-all ${
                answers[question.id]
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          )}
        </div>

        <p className="text-center text-xs text-zinc-400">You cannot change answers after submission</p>
      </div>
    </div>
  );
};

export default PretestPage;