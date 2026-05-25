import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Timer, Flame, Trophy, Zap, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/supabaseClient';
import { MOCK_QUESTIONS, MockQuestion, shuffleArray, CATEGORIES, saveMistake } from '../../data/mockQuestions';
import QuizEngine from './QuizEngine';

interface TimedChallengeProps { isDarkMode: boolean; onBack: () => void; }

const CHALLENGE_DURATION = 5 * 60;
const QUESTIONS_PER_CATEGORY = 20;

const TimedChallenge = ({ isDarkMode, onBack }: TimedChallengeProps) => {
  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300';
  const btnPrimary = 'bg-rose-600 hover:bg-rose-700 text-white';

  const [phase, setPhase] = useState<'config' | 'challenge' | 'results'>('config');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_DURATION);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showComboEffect, setShowComboEffect] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const [personalBest, setPersonalBest] = useState<{ score: number; questions: number; category: string } | null>(null);

  useEffect(() => { const saved = localStorage.getItem('civiquest_timed_challenge_best'); if (saved) setPersonalBest(JSON.parse(saved)); }, []);
  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (phase !== 'challenge') return;
    if (timeLeft <= 0) { finishChallenge(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const startChallenge = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let weakCategories: string[] = [];
    if (user) {
      const { data: session } = await supabase.from('quiz_sessions').insert({ user_id: user.id, is_pretest: false, is_timed: true }).select().single();
      if (session) sessionRef.current = session.id;
      const { data: perf } = await supabase.from('performance').select('accuracy_rate, categories:category_id(name)').eq('user_id', user.id).order('accuracy_rate', { ascending: true });
      if (perf && perf.length > 0) {
        weakCategories = perf.filter((p: any) => (p.accuracy_rate || 0) < 70).map((p: any) => p.categories?.name).filter(Boolean);
      } else {
        const { data: pretestData } = await supabase.from('pretest_results').select('categories:category_id(name)').eq('user_id', user.id).eq('weak_category', true);
        if (pretestData && pretestData.length > 0) weakCategories = pretestData.map((p: any) => p.categories?.name).filter(Boolean);
      }
    }
    let pool: MockQuestion[] = [];
    if (selectedCategory === 'All') {
      CATEGORIES.forEach(cat => { pool.push(...shuffleArray(MOCK_QUESTIONS[cat] || []).slice(0, 5)); });
    } else {
      pool = shuffleArray(MOCK_QUESTIONS[selectedCategory] || []).slice(0, QUESTIONS_PER_CATEGORY);
    }
    setQuestions(shuffleArray(pool));
    setPhase('challenge'); setCurrentIndex(0); setAnswers({}); setPoints(0); setCombo(0); setMaxCombo(0); setCorrectCount(0); setTimeLeft(CHALLENGE_DURATION);
  };

  const handleAnswer = async (questionId: string, selected: string) => {
    if (answers[questionId]) return;
    const q = questions.find(q => q.id === questionId)!;
    const isCorrect = selected === q.correct;
    setAnswers(prev => ({ ...prev, [questionId]: selected }));
    if (isCorrect) {
      const newCombo = combo + 1; setCombo(newCombo); if (newCombo > maxCombo) setMaxCombo(newCombo); setCorrectCount(prev => prev + 1);
      const speedBonus = Math.floor(timeLeft / 30) * 10; const comboMultiplier = Math.min(newCombo, 5); const earned = (100 + speedBonus) * comboMultiplier; setPoints(prev => prev + earned);
      if (newCombo >= 3) { setShowComboEffect(true); setTimeout(() => setShowComboEffect(false), 1000); }
    } else { setCombo(0); saveMistake(q, selected, q.category || 'Unknown'); }
    if (sessionRef.current) {
      try { await supabase.from('quiz_session_answers').insert({ session_id: sessionRef.current, question_id: questionId, selected_answer: selected, is_correct: isCorrect }); } catch (err) { console.error('Failed to save answer:', err); }
    }
  };

  const goToNext = () => { if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1); else finishChallenge(); };
  const goToPrevious = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

  const finishChallenge = async () => {
    const questionsAttempted = Object.keys(answers).length; setPhase('results');
    const currentBest = personalBest;
    if (!currentBest || points > currentBest.score) { const newBest = { score: points, questions: correctCount, category: selectedCategory }; localStorage.setItem('civiquest_timed_challenge_best', JSON.stringify(newBest)); setPersonalBest(newBest); }
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const earnedXP = correctCount * 10;
    const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', user.id).maybeSingle();
    if (profile) { const newXP = (profile.xp || 0) + earnedXP; const newLevel = Math.floor(newXP / 500) + 1; await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', user.id); }
    if (sessionRef.current) { await supabase.from('quiz_sessions').update({ score: correctCount, total_questions: questions.length, quiz_type: 'timed', ended_at: new Date().toISOString() }).eq('id', sessionRef.current); }
    const stats: Record<string, { correct: number; total: number }> = {};
    questions.forEach(q => { const cat = q.category; if (!stats[cat]) stats[cat] = { correct: 0, total: 0 }; if (answers[q.id]) { stats[cat].total++; if (answers[q.id] === q.correct) stats[cat].correct++; } });
    const { data: categories } = await supabase.from('categories').select('id, name');
    for (const [catName, catStats] of Object.entries(stats)) {
      const catId = categories?.find(c => c.name === catName)?.id;
      if (catId && catStats.total > 0) {
        const { data: existingPerf } = await supabase.from('performance').select('total_answered, total_correct').eq('user_id', user.id).eq('category_id', catId).maybeSingle();
        const prevAnswered = existingPerf?.total_answered || 0; const prevCorrect = existingPerf?.total_correct || 0;
        await supabase.from('performance').upsert({ user_id: user.id, category_id: catId, accuracy_rate: ((prevCorrect + catStats.correct) / (prevAnswered + catStats.total)) * 100, total_answered: prevAnswered + catStats.total, total_correct: prevCorrect + catStats.correct }, { onConflict: 'user_id, category_id' });
      }
    }
  };

  const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m}:${String(s).padStart(2, '0')}`; };
  const questionsAttempted = Object.keys(answers).length;

  if (phase === 'config') return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${subtextClass} hover:${textClass} transition-colors`}><ArrowLeft className="w-4 h-4" /> Back to Quiz Hub</button>
      <div className={`${cardBg} rounded-2xl p-8 md:p-11 border shadow-sm space-y-8`}>
        <div className="flex flex-col items-center gap-3 text-center"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-rose-900/30' : 'bg-rose-50'}`}><Timer className="w-7 h-7 text-rose-500" /></div><div><h1 className={`text-xl font-bold ${textClass}`}>Timed Challenge</h1><p className={`text-sm mt-1 leading-relaxed ${subtextClass}`}>Choose a category and answer as many as you can in 5 minutes!</p></div></div>
        <div className={`rounded-xl p-4 space-y-3 ${isDarkMode ? 'bg-zinc-800/60' : 'bg-zinc-50'}`}><div className="flex items-center gap-2 mb-2"><Filter className="w-4 h-4 text-rose-500" /><p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>Select Category</p></div><div className="grid grid-cols-2 gap-2">{['All', ...CATEGORIES].map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${selectedCategory === cat ? 'bg-rose-600 text-white border-rose-600 shadow-md' : `${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}`}>{cat === 'All' ? 'All Categories' : cat}</button>))}</div></div>
        <div className={`rounded-xl p-4 space-y-3 ${isDarkMode ? 'bg-zinc-800/60' : 'bg-zinc-50'}`}><p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>Rules of the Challenge</p>{[ { icon: Zap, bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50', color: 'text-yellow-500', text: 'Speed bonus — faster answers earn more points' }, { icon: Flame, bg: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50', color: 'text-orange-500', text: 'Combo multiplier — consecutive correct answers multiply score' }, { icon: Trophy, bg: isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50', color: 'text-amber-500', text: 'Beat your personal best for each category!' } ].map(({ icon: Icon, bg, color, text }) => (<div key={text} className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div><div className={`text-sm leading-relaxed ${textClass}`}>{text}</div></div>))}</div>
        {personalBest && (<div className={`p-4 rounded-xl border text-center ${isDarkMode ? 'bg-amber-900/20 border-amber-700/30' : 'bg-amber-50 border-amber-200'}`}><p className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>Personal Best ({personalBest.category})</p><p className={`text-3xl font-bold text-amber-500 mt-1`}>{personalBest.score.toLocaleString()} pts</p><p className={`text-xs ${subtextClass} mt-1`}>{personalBest.questions} correct in 5 min</p></div>)}
        <button onClick={startChallenge} className={`w-full py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>Start Challenge ({selectedCategory === 'All' ? '20' : QUESTIONS_PER_CATEGORY} questions)</button>
      </div>
    </div>
  );

  if (phase === 'results') {
    const isNewBest = personalBest && points >= personalBest.score;
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 space-y-5">
        <div className="text-center space-y-1"><h1 className={`text-2xl font-bold ${textClass}`}>{isNewBest ? 'New Personal Best! 🏆' : 'Challenge Over! ⏱️'}</h1><p className={`text-sm ${subtextClass}`}>{selectedCategory} • Here's your performance</p></div>
        <div className={`${cardBg} rounded-2xl border shadow-sm p-4 space-y-3`}>
          <div className={`rounded-xl p-5 text-center border ${isDarkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}><p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>Challenge Score</p><div className="text-4xl font-bold text-rose-500 mt-2 mb-1">{points.toLocaleString()} <span className="text-xs font-normal text-zinc-400">pts</span></div><p className={`text-xs ${subtextClass}`}>{correctCount} of {questionsAttempted} correct</p></div>
          <div className={`rounded-xl p-5 border ${isDarkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}><div className="grid grid-cols-3 gap-2 text-center"><div><p className={`text-2xl font-bold ${textClass}`}>{questionsAttempted}</p><p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Attempted</p></div><div className="border-x border-zinc-300 dark:border-zinc-800"><p className={`text-2xl font-bold text-emerald-500`}>{correctCount}</p><p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Correct</p></div><div><p className={`text-2xl font-bold text-orange-500`}>{maxCombo}x</p><p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Max Combo</p></div></div></div>
          <div className={`rounded-xl p-5 text-center border ${isDarkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}><p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>XP Earned</p><p className="text-2xl font-bold text-emerald-500 mt-1">+{correctCount * 10}</p></div>
        </div>
        <div className="flex gap-3 pt-2"><button onClick={() => setPhase('config')} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>Try Again</button><button onClick={onBack} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm border transition-colors ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}>Back to Hub</button></div>
      </div>
    );
  }

  const timerPercent = (timeLeft / CHALLENGE_DURATION) * 100;
  return (
    <div className="min-h-screen bg-zinc-950 w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className={`sticky top-4 z-10 py-3.5 px-5 rounded-2xl border shadow-sm backdrop-blur-md ${timeLeft < 30 ? isDarkMode ? 'bg-red-900/80 border-red-700' : 'bg-red-50/90 border-red-200' : timeLeft < 60 ? isDarkMode ? 'bg-yellow-900/80 border-yellow-700' : 'bg-yellow-50/90 border-yellow-200' : isDarkMode ? 'bg-zinc-800/80 border-zinc-700' : 'bg-white/90 border-zinc-300'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4"><button onClick={onBack} className={`p-1.5 rounded-lg border ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-700' : 'border-zinc-300 hover:bg-zinc-100'} transition-colors hidden sm:block`}><ArrowLeft className="w-4 h-4" /></button><div><p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Points</p><p className={`text-lg font-bold ${textClass}`}>{points.toLocaleString()}</p></div><div className="w-px h-8 bg-zinc-300 dark:bg-zinc-700 hidden sm:block" /><div><p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Combo</p><p className={`text-lg font-bold ${combo >= 3 ? 'text-orange-500' : textClass}`}>{combo > 0 ? `${combo}x` : '-'}</p></div></div>
          <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : timeLeft < 60 ? 'text-yellow-600 dark:text-yellow-500' : 'text-rose-500'}`}><Timer className="w-5 h-5" />{formatTime(timeLeft)}</div>
        </div>
        <div className={`w-full rounded-full h-1.5 mt-3 overflow-hidden ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}><motion.div animate={{ width: `${timerPercent}%` }} transition={{ duration: 1, ease: 'linear' }} className={`h-1.5 rounded-full ${timeLeft < 60 ? 'bg-red-500' : 'bg-rose-500'}`} /></div>
      </div>
      {showComboEffect && <motion.div initial={{ opacity: 0, scale: 0.5, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="text-center"><span className="text-2xl font-black text-orange-500 drop-shadow-lg">🔥 {combo}x COMBO!</span></motion.div>}
      <div className="space-y-2"><div className={`flex justify-between text-xs font-medium ${subtextClass}`}><span>Question {currentIndex + 1} of {questions.length}</span></div><div className={`w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`}><motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} className="h-1.5 rounded-full bg-rose-500" /></div></div>
      {currentQuestion && <QuizEngine question={currentQuestion} questionIndex={currentIndex} totalQuestions={questions.length} selectedAnswer={answers[currentQuestion.id] || null} onAnswer={handleAnswer} showFeedback={true} showAIExplanation={false} aiExplanationText="" loadingAI={false} isDarkMode={isDarkMode} />}
      <div className="flex gap-3">
        <button onClick={goToPrevious} disabled={currentIndex === 0} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all ${currentIndex === 0 ? 'opacity-40 cursor-not-allowed border-zinc-300 dark:border-zinc-700 text-zinc-400' : `${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}`}><ChevronLeft className="w-4 h-4" /> Previous</button>
        {currentIndex < questions.length - 1 ? <button onClick={goToNext} disabled={!answers[currentQuestion?.id]} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${btnPrimary} transition-all ${!answers[currentQuestion?.id] ? 'opacity-50 cursor-not-allowed' : ''}`}>Next <ChevronRight className="w-4 h-4" /></button> : <button onClick={finishChallenge} className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-all"><Trophy className="w-4 h-4" /> Finish</button>}
      </div>
    </div>
  );
};

export default TimedChallenge;