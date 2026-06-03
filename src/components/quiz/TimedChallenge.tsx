import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Timer, Flame, Trophy, Zap, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/supabaseClient';
import { MockQuestion, shuffleArray, CATEGORIES, saveMistake, dbToMockQuestion } from '../../data/mockQuestions';
import QuizEngine from './QuizEngine';
import FloatingChatbot from '../FloatingChatbot';

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
  const [aiText, setAiText] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

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
    if (user) {
      const { data: session } = await supabase.from('quiz_sessions').insert({ user_id: user.id, is_pretest: false, is_timed: true }).select().single();
      if (session) sessionRef.current = session.id;
    }

    let query = supabase.from('questions').select('*, categories!inner(name)').eq('is_active', true);
    if (selectedCategory !== 'All') {
      const { data: cat } = await supabase.from('categories').select('id').eq('name', selectedCategory).single();
      if (cat) query = query.eq('category_id', cat.id);
    }

    const { data: dbQuestions } = await query.limit(50);
    let pool: MockQuestion[] = (dbQuestions || []).map(dbToMockQuestion);
    
    setQuestions(shuffleArray(pool).slice(0, selectedCategory === 'All' ? 20 : QUESTIONS_PER_CATEGORY));
    setPhase('challenge'); setCurrentIndex(0); setAnswers({}); setPoints(0); setCombo(0); setMaxCombo(0); setCorrectCount(0); setAiText(''); setTimeLeft(CHALLENGE_DURATION);
  };

  const getAIExplanation = async (question: MockQuestion, userAnswer: string) => {
        setLoadingAI(true);
        try {
            const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': window.location.origin, 'X-Title': 'CiviQuest' },
                body: JSON.stringify({
                    model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
                    messages: [
                        { role: 'system', content: 'You are a Civil Service Exam tutor. Explain in 2-3 sentences why the answer is correct and why the user\'s choice was wrong. Be concise and helpful.' },
                        { role: 'user', content: `Question: ${question.question}\nOptions: ${question.options.join(', ')}\nCorrect answer: ${question.correct}\nMy answer: ${userAnswer}\nPlease explain.` },
                    ],
                }),
            });
            const data = await response.json();
            setAiText(data.choices?.[0]?.message?.content || `The correct answer is "${question.correct}".`);
        } catch {
            setAiText(`The correct answer is "${question.correct}".`);
        } finally { setLoadingAI(false); }
    };
    
  const handleAnswer = async (questionId: string, selected: string) => {
    if (answers[questionId]) return;
    const q = questions.find(q => q.id === questionId)!;
    const isCorrect = selected === q.correct;
    setAnswers(prev => ({ ...prev, [questionId]: selected }));
    if (isCorrect) {
      const newCombo = combo + 1; setCombo(newCombo); if (newCombo > maxCombo) setMaxCombo(newCombo); setCorrectCount(prev => prev + 1);
      const xpPerCorrect = 10;
      setPoints(prev => prev + xpPerCorrect);
      if (newCombo >= 3) { setShowComboEffect(true); setTimeout(() => setShowComboEffect(false), 1000); }
    } else { 
      setCombo(0); 
      saveMistake(q, selected, q.category || 'Unknown'); 
      await getAIExplanation(q, selected);
    }
    if (sessionRef.current) {
      try { await supabase.from('quiz_session_answers').insert({ session_id: sessionRef.current, question_id: questionId, selected_answer: selected, is_correct: isCorrect }); } catch (err) { console.error('Failed to save answer:', err); }
    }
  };

  const goToNext = () => { 
    setAiText(''); 
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1); 
    else finishChallenge(); 
  };
  const goToPrevious = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

  const finishChallenge = async () => {
    const earnedXP = correctCount * 10;
    setPhase('results');
    
    const currentBest = personalBest;
    if (!currentBest || earnedXP > currentBest.score) {
      const newBest = { score: earnedXP, questions: correctCount, category: selectedCategory };
      localStorage.setItem('civiquest_timed_challenge_best', JSON.stringify(newBest));
      setPersonalBest(newBest);
    }
    
    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) return;
    
    const { data: profile } = await supabase.from('profiles').select('xp, level, daily_xp, weekly_xp, monthly_xp').eq('id', user.id).maybeSingle() as any;
    if (profile) {
      const newXP = (profile.xp || 0) + earnedXP;
      const newLevel = Math.floor(newXP / 500) + 1;
      await supabase.from('profiles').update({ xp: newXP, level: newLevel, daily_xp: (profile.daily_xp || 0) + earnedXP, weekly_xp: (profile.weekly_xp || 0) + earnedXP, monthly_xp: (profile.monthly_xp || 0) + earnedXP }).eq('id', user.id);
    }
    if (sessionRef.current) {
      await supabase.from('quiz_sessions').update({ score: correctCount, total_questions: questions.length, quiz_type: 'timed', ended_at: new Date().toISOString() }).eq('id', sessionRef.current);
    }
  };

  const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m}:${String(s).padStart(2, '0')}`; };

  if (phase === 'config') return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${subtextClass} hover:${textClass} transition-colors`}><ArrowLeft className="w-4 h-4" /> Back to Quiz Hub</button>
      <div className={`${cardBg} rounded-2xl p-8 md:p-11 border shadow-sm space-y-8`}>
        <div className="flex flex-col items-center gap-3 text-center"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-rose-900/30' : 'bg-rose-50'}`}><Timer className="w-7 h-7 text-rose-500" /></div><div><h1 className={`text-xl font-bold ${textClass}`}>Timed Challenge</h1><p className={`text-sm mt-1 leading-relaxed ${subtextClass}`}>Answer as many as you can in 5 minutes!</p></div></div>
        <div className={`rounded-xl p-4 space-y-3 ${isDarkMode ? 'bg-zinc-800/60' : 'bg-zinc-50'}`}><div className="flex items-center gap-2 mb-2"><Filter className="w-4 h-4 text-rose-500" /><p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>Select Category</p></div><div className="grid grid-cols-2 gap-2">{['All', ...CATEGORIES].map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${selectedCategory === cat ? 'bg-rose-600 text-white border-rose-600 shadow-md' : `${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}`}>{cat === 'All' ? 'All Categories' : cat}</button>))}</div></div>
        <button onClick={startChallenge} className={`w-full py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>Start Challenge</button>
      </div>
    </div>
  );

  if (phase === 'results') {
    const isNewBest = personalBest && correctCount * 10 >= personalBest.score;
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 space-y-5">
        <div className="text-center space-y-1"><h1 className={`text-2xl font-bold ${textClass}`}>{isNewBest ? 'New Personal Best! 🏆' : 'Challenge Over! ⏱️'}</h1></div>
        <div className={`${cardBg} rounded-2xl border shadow-sm p-4 space-y-3`}>
          <div className={`rounded-xl p-5 text-center border ${isDarkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}><p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>XP Earned</p><div className="text-4xl font-bold text-rose-500 mt-2">+{correctCount * 10} XP</div></div>
          <div className="flex gap-3 pt-2"><button onClick={() => setPhase('config')} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>Try Again</button><button onClick={onBack} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm border transition-colors ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}>Back to Hub</button></div>
        </div>
      </div>
    );
  }

  const timerPercent = (timeLeft / CHALLENGE_DURATION) * 100;
  return (
    <div className="min-h-screen bg-zinc-950 w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className={`sticky top-4 z-10 py-3.5 px-5 rounded-2xl border shadow-sm backdrop-blur-md ${timeLeft < 30 ? isDarkMode ? 'bg-red-900/80 border-red-700' : 'bg-red-50/90 border-red-200' : isDarkMode ? 'bg-zinc-800/80 border-zinc-700' : 'bg-white/90 border-zinc-300'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4"><div><p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>XP</p><p className={`text-lg font-bold ${textClass}`}>{points.toLocaleString()}</p></div><div><p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Combo</p><p className={`text-lg font-bold ${combo >= 3 ? 'text-orange-500' : textClass}`}>{combo > 0 ? `${combo}x` : '-'}</p></div></div>
          <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-rose-500'}`}><Timer className="w-5 h-5" />{formatTime(timeLeft)}</div>
        </div>
        <div className={`w-full rounded-full h-1.5 mt-3 overflow-hidden ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}><motion.div animate={{ width: `${timerPercent}%` }} transition={{ duration: 1, ease: 'linear' }} className={`h-1.5 rounded-full ${timeLeft < 60 ? 'bg-red-500' : 'bg-rose-500'}`} /></div>
      </div>
      {showComboEffect && <motion.div initial={{ opacity: 0, scale: 0.5, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="text-center"><span className="text-2xl font-black text-orange-500 drop-shadow-lg">🔥 {combo}x COMBO!</span></motion.div>}
      {currentQuestion && <QuizEngine question={currentQuestion} questionIndex={currentIndex} totalQuestions={questions.length} selectedAnswer={answers[currentQuestion.id] || null} onAnswer={handleAnswer} showFeedback={true} showAIExplanation={true} aiExplanationText={aiText} loadingAI={loadingAI} isDarkMode={isDarkMode} />}
      <div className="flex gap-3">
        <button onClick={goToPrevious} disabled={currentIndex === 0} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all ${currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : `${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}`}><ChevronLeft className="w-4 h-4" /> Previous</button>
        {currentIndex < questions.length - 1 ? <button onClick={goToNext} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${btnPrimary} transition-colors`}>Next <ChevronRight className="w-4 h-4" /></button> : <button onClick={finishChallenge} className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"><Trophy className="w-4 h-4" /> Finish</button>}
      </div>
      <FloatingChatbot position="bottom-right" />
    </div>
  );
};

export default TimedChallenge;