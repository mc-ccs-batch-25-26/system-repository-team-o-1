import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, FileText, AlertTriangle, Clock, Shield, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/supabaseClient';
import { MockQuestion, shuffleArray, CATEGORIES, saveMistake, dbToMockQuestion } from '../../data/mockQuestions';
import QuizEngine from './QuizEngine';
import SmartRecommendation from './SmartRecommendation';

const CATEGORY_COLORS: Record<string, { pill: string; bar: string; score: string }> = {
  'Verbal Ability':       { pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',     bar: 'bg-blue-500',    score: 'text-blue-600 dark:text-blue-400'    },
  'Numerical Ability':    { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'bg-emerald-500', score: 'text-emerald-600 dark:text-emerald-400' },
  'Analytical Ability':   { pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',   bar: 'bg-violet-500',  score: 'text-violet-600 dark:text-violet-400'  },
  'General Information':  { pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',       bar: 'bg-amber-500',   score: 'text-amber-600 dark:text-amber-400'    },
};

const getScoreColor = (correct: number, total: number) => {
  const pct = total > 0 ? correct / total : 0;
  if (pct >= 0.7) return { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' };
  if (pct >= 0.4) return { text: 'text-amber-600 dark:text-amber-400',     bar: 'bg-amber-500'   };
  return           { text: 'text-red-600 dark:text-red-400',               bar: 'bg-red-500'     };
};

interface MockExamProps {
  isDarkMode: boolean;
  onBack: () => void;
  onStartPractice: (category: string) => void;
  onOpenAIReview: (category: string) => void;
}

const EXAM_DURATION = 190 * 60;

const MockExam = ({ isDarkMode, onBack, onStartPractice, onOpenAIReview }: MockExamProps) => {
  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300';
  const btnPrimary = 'bg-purple-600 hover:bg-purple-700 text-white';

  const [phase, setPhase] = useState<'start' | 'exam' | 'results'>('start');
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [score, setScore] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<Record<string, { correct: number; total: number }>>({});
  const [timeTaken, setTimeTaken] = useState(0);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (phase !== 'exam') return;
    if (timeLeft <= 0) { finishExam(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    if (timeLeft === 300 && !showWarning) setShowWarning(true);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const startExam = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: session } = await supabase.from('quiz_sessions').insert({ user_id: user.id, is_pretest: false, is_timed: true }).select().single();
      if (session) sessionRef.current = session.id;
    }

    // Fetch from database - 170 questions
    const { data: dbQuestions } = await supabase
      .from('questions')
      .select('*, categories!inner(name)')
      .eq('is_active', true)
      .limit(200);

    let examQuestions: MockQuestion[] = (dbQuestions || []).map(dbToMockQuestion);
    examQuestions = shuffleArray(examQuestions).slice(0, 170);

    setQuestions(examQuestions);
    setPhase('exam');
    setCurrentIndex(0);
    setAnswers({});
    setScore(0);
    setTimeLeft(EXAM_DURATION);
  };

  const handleAnswer = async (questionId: string, selected: string) => {
    if (answers[questionId]) return;
    setAnswers(prev => ({ ...prev, [questionId]: selected }));
    if (sessionRef.current) {
      const q = questions.find(q => q.id === questionId)!;
      const isCorrect = selected === q.correct;
      try {
        await supabase.from('quiz_session_answers').insert({ session_id: sessionRef.current, question_id: questionId, selected_answer: selected, is_correct: isCorrect });
        if (!isCorrect) saveMistake(q, selected, q.category || 'Unknown');
      } catch (err) { console.error('Failed to save answer:', err); }
    }
  };

  const nextQuestion = () => { if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1); };
  const prevQuestion = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

  const finishExam = async () => {
    const totalTimeTaken = EXAM_DURATION - timeLeft;
    setTimeTaken(totalTimeTaken);
    let finalScore = 0;
    const stats: Record<string, { correct: number; total: number }> = {};
    questions.forEach(q => {
      const cat = q.category;
      if (!stats[cat]) stats[cat] = { correct: 0, total: 0 };
      stats[cat].total++;
      if (answers[q.id] === q.correct) { stats[cat].correct++; finalScore++; }
    });
    setScore(finalScore);
    setCategoryStats(stats);
    setPhase('results');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const earnedXP = finalScore * 10;
    const { data: profile } = await supabase.from('profiles').select('xp, level, daily_xp, weekly_xp, monthly_xp').eq('id', user.id).single() as any;
    if (profile) {
      const newXP = (profile.xp || 0) + earnedXP;
      const newLevel = Math.floor(newXP / 500) + 1;
      await supabase.from('profiles').update({ xp: newXP, level: newLevel, daily_xp: (profile.daily_xp || 0) + earnedXP, weekly_xp: (profile.weekly_xp || 0) + earnedXP, monthly_xp: (profile.monthly_xp || 0) + earnedXP }).eq('id', user.id);
    }
    if (sessionRef.current) {
      await supabase.from('quiz_sessions').update({ score: finalScore, total_questions: questions.length, quiz_type: 'mock', ended_at: new Date().toISOString() }).eq('id', sessionRef.current);
    }
  };

  const formatTime = (seconds: number) => { const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60; if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; return `${m}:${String(s).padStart(2, '0')}`; };
  const getWeakest = () => { let weakest = { category: '', accuracy: 100 }; for (const [cat, stats] of Object.entries(categoryStats)) { const acc = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0; if (acc < weakest.accuracy) weakest = { category: cat, accuracy: acc }; } return weakest; };
  const answeredCount = Object.keys(answers).length;

  if (phase === 'start') return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${subtextClass} hover:${textClass} transition-colors`}><ArrowLeft className="w-4 h-4" /> Back to Quiz Hub</button>
      <div className={`${cardBg} rounded-2xl p-8 md:p-11 border shadow-sm space-y-8`}>
        <div className="flex flex-col items-center gap-3 text-center"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}><FileText className="w-7 h-7 text-purple-500" /></div><div><h1 className={`text-xl font-bold ${textClass}`}>Mock Exam</h1><p className={`text-sm mt-1 leading-relaxed ${subtextClass}`}>Simulate actual Civil Service Exam conditions</p></div></div>
        <div className={`rounded-xl p-4 space-y-3 ${isDarkMode ? 'bg-zinc-800/60' : 'bg-zinc-50'}`}><p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>Exam Details</p>{[ { icon: Clock, bg: isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50', color: 'text-purple-500', text: '3-hour 10-minute timer — real CSC exam pacing' }, { icon: FileText, bg: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50', color: 'text-blue-500', text: '170 questions across all 4 categories' }, { icon: Shield, bg: isDarkMode ? 'bg-red-900/30' : 'bg-red-50', color: 'text-red-500', text: 'No instant feedback — results shown at the end' } ].map(({ icon: Icon, bg, color, text }) => (<div key={text} className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div><div className={`text-sm leading-relaxed ${textClass}`}>{text}</div></div>))}</div>
        <button onClick={startExam} className={`w-full py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>Begin Mock Exam</button>
      </div>
    </div>
  );

  if (phase === 'results') {
    const weakest = getWeakest(); const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0; const passed = percentage >= 80;
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 space-y-5">
        <div className="text-center space-y-1"><h1 className={`text-2xl font-bold ${textClass}`}>{passed ? 'Exam Passed! 🎉' : 'Exam Complete 📋'}</h1><p className={`text-sm ${subtextClass}`}>{passed ? 'Excellent performance!' : 'Keep practicing to improve your score'}</p></div>
        <div className={`${cardBg} rounded-2xl border p-7 text-center space-y-3`}><p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>Final Score</p><div className="flex justify-center items-end gap-2"><p className={`text-6xl font-bold ${passed ? 'text-emerald-500' : 'text-red-500'}`}>{score}<span className={`text-2xl ${subtextClass}`}>/{questions.length}</span></p></div><p className={`text-sm font-bold ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{percentage}% — {passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}</p><div className={`w-full rounded-full h-2.5 overflow-hidden mt-4 ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}><motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-2.5 rounded-full ${passed ? 'bg-emerald-500' : 'bg-red-500'}`} /></div><p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">+{score * 10} XP earned</p></div>
        <div className={`grid grid-cols-3 gap-2 ${cardBg} rounded-xl border p-4 text-center`}><div><p className={`text-lg font-bold ${textClass}`}>{formatTime(timeTaken)}</p><p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Time Taken</p></div><div className="border-x border-zinc-300 dark:border-zinc-700"><p className={`text-lg font-bold ${textClass}`}>{questions.length > 0 ? Math.round(timeTaken / questions.length) : 0}s</p><p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Avg/Question</p></div><div><p className={`text-lg font-bold ${textClass}`}>{answeredCount}/{questions.length}</p><p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Answered</p></div></div>
        <div className="space-y-3">{Object.entries(categoryStats).map(([cat, stats]) => { const col = getScoreColor(stats.correct, stats.total); const catCol = CATEGORY_COLORS[cat] || { pill: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' }; return (<div key={cat} className={`${cardBg} rounded-xl border p-4 space-y-2.5`}><div className="flex items-center justify-between"><span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${catCol.pill}`}>{cat}</span><span className={`text-sm font-bold ${col.text}`}>{stats.correct}/{stats.total}</span></div><div className={`w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}><motion.div initial={{ width: 0 }} animate={{ width: `${(stats.correct / stats.total) * 100}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} className={`h-1.5 rounded-full ${col.bar}`} /></div></div>); })}</div>
        {weakest.category && <SmartRecommendation weakestCategory={weakest.category} weakestAccuracy={weakest.accuracy} onStartPractice={onStartPractice} onOpenAIReview={onOpenAIReview} isDarkMode={isDarkMode} />}
        <div className="flex gap-3 pt-2"><button onClick={() => setPhase('start')} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>Retake Exam</button><button onClick={onBack} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm border transition-colors ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-400 text-zinc-700 hover:bg-zinc-50'}`}>Back to Hub</button></div>
      </div>
    );
  }

  const isTimeLow = timeLeft < 600; const isTimeCritical = timeLeft < 300;
  return (
    <div className="min-h-screen bg-zinc-950 w-full max-w-3xl mx-auto px-4 py-6 space-y-6"> 
      <div className={`sticky top-4 z-10 py-3.5 px-5 rounded-2xl border shadow-sm backdrop-blur-md ${isTimeCritical ? isDarkMode ? 'bg-red-900/80 border-red-700' : 'bg-red-50/90 border-red-200' : isTimeLow ? isDarkMode ? 'bg-yellow-900/80 border-yellow-700' : 'bg-yellow-50/90 border-yellow-200' : isDarkMode ? 'bg-zinc-800/80 border-zinc-700' : 'bg-white/90 border-zinc-300'}`}>
        <div className="flex items-center justify-between"><div className="flex items-center gap-4"><button onClick={onBack} className={`p-1.5 rounded-lg border ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-700' : 'border-zinc-300 hover:bg-zinc-100'} transition-colors`}><ArrowLeft className="w-4 h-4" /></button><span className={`text-xs font-bold uppercase tracking-wider ${subtextClass}`}>Q {currentIndex + 1} / {questions.length}</span></div><div className="flex items-center gap-4"><span className={`text-xs font-medium ${subtextClass} hidden sm:block`}>{answeredCount} answered</span><div className={`flex items-center gap-2 font-mono text-lg font-bold ${isTimeCritical ? 'text-red-500 animate-pulse' : isTimeLow ? 'text-yellow-600 dark:text-yellow-500' : 'text-purple-600 dark:text-purple-400'}`}><Clock className="w-5 h-5" />{formatTime(timeLeft)}</div></div></div>
        <div className={`w-full rounded-full h-1.5 mt-3 overflow-hidden ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}><motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} className={`h-1.5 rounded-full ${isTimeCritical ? 'bg-red-500' : 'bg-purple-500'}`} /></div>
      </div>
      <div className="flex justify-between items-center px-1"><button onClick={() => setShowNavigator(!showNavigator)} className={`flex items-center gap-2 text-xs font-bold tracking-wider rounded-lg px-3 py-2 transition-colors ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700'} shadow-sm`}><LayoutGrid className="w-4 h-4" /><span>{answeredCount}/{questions.length} Answered</span></button></div>
      <AnimatePresence>{showNavigator && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className={`p-4 rounded-2xl border shadow-sm ${cardBg}`}><div className="grid grid-cols-10 gap-1.5 w-full justify-items-center">{questions.map((q, idx) => (<button key={q.id} onClick={() => setCurrentIndex(idx)} className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all ${idx === currentIndex ? 'bg-purple-600 text-white shadow-sm scale-110 z-10' : answers[q.id] ? isDarkMode ? 'bg-zinc-600 text-zinc-300' : 'bg-zinc-400 text-white' : isDarkMode ? 'border border-zinc-700 text-zinc-600 hover:bg-zinc-800' : 'border border-zinc-300 text-zinc-400 hover:bg-zinc-50'}`}>{idx + 1}</button>))}</div></div></motion.div>)}</AnimatePresence>
      {showWarning && isTimeCritical && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-700/50' : 'bg-red-50 text-red-600 border border-red-200'}`}><AlertTriangle className="w-5 h-5 flex-shrink-0" />Less than 5 minutes remaining!<button onClick={() => setShowWarning(false)} className="ml-auto text-xs underline font-bold opacity-80 hover:opacity-100">Dismiss</button></motion.div>)}
      {currentQuestion && <QuizEngine question={currentQuestion} questionIndex={currentIndex} totalQuestions={questions.length} selectedAnswer={answers[currentQuestion.id] || null} onAnswer={handleAnswer} showFeedback={false} showAIExplanation={false} aiExplanationText="" loadingAI={false} isDarkMode={isDarkMode} />}
      <div className="flex gap-3 pt-2">
        <button onClick={prevQuestion} disabled={currentIndex === 0} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${currentIndex === 0 ? 'opacity-20 cursor-not-allowed text-zinc-400 border-transparent' : `bg-transparent border ${isDarkMode ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-500 hover:bg-zinc-100'}`}`}><ArrowLeft className="w-4 h-4" /> Previous</button>
        {currentIndex < questions.length - 1 ? <button onClick={nextQuestion} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${btnPrimary} transition-colors`}>Next <ArrowRight className="w-4 h-4" /></button> : <button onClick={finishExam} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors`}>Submit Exam</button>}
      </div>
    </div>
  );
};

export default MockExam;