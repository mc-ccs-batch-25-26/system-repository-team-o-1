import { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Filter, Lightbulb, CheckCircle2, Zap } from 'lucide-react';
import { supabase } from '../../supabase/supabaseClient';
import { MockQuestion, shuffleArray, saveMistake, CATEGORIES, dbToMockQuestion } from '../../data/mockQuestions';
import QuizEngine from './QuizEngine';
import SmartRecommendation from './SmartRecommendation';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingChatbot from '../FloatingChatbot';

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

const CATEGORY_COLORS: Record<string, { pill: string; bar: string; score: string }> = {
    'Verbal Ability':      { pill: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',             bar: 'bg-sky-500',     score: 'text-sky-600 dark:text-sky-400'       },
    'Numerical Ability':   { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'bg-emerald-500', score: 'text-emerald-600 dark:text-emerald-400' },
    'Analytical Ability':  { pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',  bar: 'bg-violet-500',  score: 'text-violet-600 dark:text-violet-400'  },
    'General Information': { pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',      bar: 'bg-amber-500',   score: 'text-amber-600 dark:text-amber-400'    },
};

const getScoreColor = (correct: number, total: number) => {
    const pct = total > 0 ? correct / total : 0;
    if (pct >= 0.6) return { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' };
    if (pct >= 0.4) return { text: 'text-amber-600 dark:text-amber-400',     bar: 'bg-amber-500',   badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'         };
    return           { text: 'text-rose-600 dark:text-rose-400',             bar: 'bg-rose-500',    badge: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'             };
};

const difficultyOptions = [
    { value: 'all', label: 'All Levels',  dot: 'bg-blue-400'  },
    { value: 'easy', label: 'Easy',        dot: 'bg-emerald-400' },
    { value: 'medium', label: 'Medium',      dot: 'bg-amber-400'  },
    { value: 'hard', label: 'Hard',        dot: 'bg-rose-500'   },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2.5">{children}</p>
);

const AnimatedBar = ({ value, colorClass, delay = 0 }: { value: number; colorClass: string; delay?: number }) => (
    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <motion.div className={`h-full rounded-full ${colorClass}`} initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }} transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay }} />
    </div>
);

interface PracticeModeProps {
    isDarkMode: boolean;
    onBack: () => void;
    onOpenAIReview: (category: string) => void;
    preSelectedCategory?: string | null;
}

const PracticeMode = ({ isDarkMode, onBack, onOpenAIReview, preSelectedCategory }: PracticeModeProps) => {
    const [phase, setPhase] = useState<'config' | 'quiz' | 'results'>('config');
    const [selectedCategory, setSelectedCategory] = useState<string>(preSelectedCategory || 'All');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
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

    const startPractice = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: session } = await supabase.from('quiz_sessions').insert({
                user_id: user.id, is_pretest: false, is_timed: false,
            }).select().single();
            if (session) sessionRef.current = session.id;
        }

        // Fetch from database
        let query = supabase.from('questions').select('*, categories!inner(name)').eq('is_active', true);
        
        if (selectedCategory !== 'All') {
            const { data: cat } = await supabase.from('categories').select('id').eq('name', selectedCategory).single();
            if (cat) query = query.eq('category_id', cat.id);
        }
        
        if (selectedDifficulty !== 'all') {
            query = query.eq('difficulty', selectedDifficulty);
        }

        const { data: dbQuestions } = await query.limit(50);
        let pool: MockQuestion[] = (dbQuestions || []).map(dbToMockQuestion);
        
        setQuestions(shuffleArray(pool).slice(0, 15));
        setPhase('quiz');
        setCurrentIndex(0);
        setAnswers({});
        setScore(0);
    };

    const getAIExplanation = async (question: MockQuestion, userAnswer: string) => {
        setLoadingAI(true);
        try {
            const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': window.location.origin, 'X-Title': 'CiviQuest' },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
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
        if (isCorrect) setScore(prev => prev + 1);
        if (!isCorrect) saveMistake(q, selected, q.category || 'Unknown');
        if (sessionRef.current) {
            try {
                await supabase.from('quiz_session_answers').insert({ session_id: sessionRef.current, question_id: questionId, selected_answer: selected, is_correct: isCorrect });
            } catch (err) { console.error('Failed to save answer:', err); }
        }
        if (!isCorrect) await getAIExplanation(q, selected);
    };

    const nextQuestion = () => {
        setAiText('');
        if (currentIndex < questions.length - 1) { setCurrentIndex(prev => prev + 1); }
        else { finishPractice(); }
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
        setPhase('results');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const earnedXP = score * 15;
        const { data: profile } = await supabase.from('profiles').select('xp, level, daily_xp, weekly_xp, monthly_xp').eq('id', user.id).maybeSingle();
        if (profile) {
            const newXP = (profile.xp || 0) + earnedXP;
            const newLevel = Math.floor(newXP / 500) + 1;
            await supabase.from('profiles').update({ xp: newXP, level: newLevel, daily_xp: (profile.daily_xp || 0) + earnedXP, weekly_xp: (profile.weekly_xp || 0) + earnedXP, monthly_xp: (profile.monthly_xp || 0) + earnedXP }).eq('id', user.id);
        }

        if (sessionRef.current) {
            await supabase.from('quiz_sessions').update({ score, total_questions: questions.length, quiz_type: 'practice', ended_at: new Date().toISOString() }).eq('id', sessionRef.current);
        }

        const { data: categories } = await supabase.from('categories').select('id, name');
        for (const [catName, catStats] of Object.entries(stats)) {
            const catId = categories?.find(c => c.name === catName)?.id;
            if (catId) {
                const { data: existingPerf } = await supabase.from('performance').select('total_answered, total_correct').eq('user_id', user.id).eq('category_id', catId).maybeSingle();
                const prevAnswered = existingPerf?.total_answered || 0;
                const prevCorrect  = existingPerf?.total_correct  || 0;
                const newTotalAnswered = prevAnswered + catStats.total;
                const newTotalCorrect  = prevCorrect  + catStats.correct;
                const newAccuracy = newTotalAnswered > 0 ? (newTotalCorrect / newTotalAnswered) * 100 : 0;
                await supabase.from('performance').upsert({ user_id: user.id, category_id: catId, accuracy_rate: newAccuracy, total_answered: newTotalAnswered, total_correct: newTotalCorrect }, { onConflict: 'user_id, category_id' });
            }
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
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-6">
                    <motion.button initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28 }} onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Quiz Hub
                    </motion.button>
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        <div className="px-8 pt-8 pb-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20"><BookOpen className="w-6 h-6 text-blue-500" /></div>
                            <div><h1 className="text-lg font-bold text-zinc-900 dark:text-white">Practice Mode</h1><p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Free practice — no pressure, instant feedback</p></div>
                        </div>
                        <div className="px-8 py-7 space-y-7">
                            <div>
                                <div className="flex items-center gap-1.5 mb-3"><Filter className="w-3.5 h-3.5 text-zinc-400" /><SectionLabel>Subject</SectionLabel></div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['All', ...CATEGORIES].map(cat => (
                                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={`relative px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 text-left ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}`}>{cat}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <SectionLabel>Difficulty</SectionLabel>
                                <div className="grid grid-cols-2 gap-2">
                                    {difficultyOptions.map(opt => (
                                        <button key={opt.value} onClick={() => setSelectedDifficulty(opt.value)} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${selectedDifficulty === opt.value ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}`}>
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${selectedDifficulty === opt.value ? 'bg-white/70' : opt.dot}`} />{opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={startPractice} className="w-full py-3.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white transition-all duration-200 shadow-sm hover:shadow-md">Start Practice — 15 Questions</button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // RESULTS SCREEN
    if (phase === 'results') {
        const weakest = getWeakest();
        const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
        const scoreCol = getScoreColor(score, questions.length);
        const earnedXP = score * 15;
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <div className="w-full max-w-lg mx-auto px-4 sm:px-6 py-10 space-y-5">
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="text-center space-y-1">
                        <div className="flex items-center justify-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><h1 className="text-xl font-bold text-zinc-900 dark:text-white">Practice Complete</h1></div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Here's how you did this session</p>
                    </motion.div>
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-7 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">Total Correct</p>
                        <div className={`text-6xl font-bold tabular-nums ${scoreCol.text} mb-1`}>{score}</div>
                        <div className="text-sm text-zinc-400 dark:text-zinc-500 mb-5">out of {questions.length} questions</div>
                        <AnimatedBar value={pct} colorClass={scoreCol.bar} />
                        <div className="flex items-center justify-center gap-1.5 mt-4"><Zap className="w-3.5 h-3.5 text-amber-500" /><span className="text-xs font-semibold text-amber-600 dark:text-amber-400">+{earnedXP} XP earned</span></div>
                    </motion.div>
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800"><p className="text-sm font-semibold text-zinc-900 dark:text-white">Score by Subject</p></div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {Object.entries(categoryStats).map(([cat, stats], idx) => {
                                const col = getScoreColor(stats.correct, stats.total);
                                const catCol = CATEGORY_COLORS[cat] || { pill: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300', bar: 'bg-zinc-400' };
                                const catPct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                                return (
                                    <div key={cat} className="px-5 py-4 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${catCol.pill}`}>{cat}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${col.badge}`}>{stats.correct}/{stats.total} · {catPct}%</span>
                                        </div>
                                        <AnimatedBar value={catPct} colorClass={col.bar} delay={idx * 0.07} />
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                    {weakest.category && (
                        <motion.div initial="hidden" animate="show" variants={fadeUp}>
                            <SmartRecommendation weakestCategory={weakest.category} weakestAccuracy={weakest.accuracy} onStartPractice={(cat) => { setSelectedCategory(cat); setPhase('config'); }} onOpenAIReview={onOpenAIReview} isDarkMode={isDarkMode} />
                        </motion.div>
                    )}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex gap-3 pt-1">
                        <button onClick={() => setPhase('config')} className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white transition-all duration-200 shadow-sm">Practice Again</button>
                        <button onClick={onBack} className="flex-1 py-3.5 rounded-xl font-semibold text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200">Back to Hub</button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // QUIZ IN PROGRESS
    const answeredCount = Object.keys(answers).length;
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Exit Practice</button>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">Practice Mode</span>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Question <span className="font-bold text-zinc-700 dark:text-zinc-200">{currentIndex + 1}</span> of {questions.length}</p>
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">{answeredCount}/{questions.length} answered</p>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden"><motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} className="h-full rounded-full bg-blue-500" /></div>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {questions.map((q, i) => (
                            <motion.div key={q.id} animate={{ width: i === currentIndex ? 20 : 6, backgroundColor: i === currentIndex ? '#3b82f6' : answers[q.id] ? (answers[q.id] === q.correct ? '#10b981' : '#f43f5e') : isDarkMode ? '#3f3f46' : '#d4d4d8' }} transition={{ duration: 0.25 }} className="h-1.5 rounded-full" />
                        ))}
                    </div>
                </div>
                <AnimatePresence mode="wait">
                    {currentQuestion && (
                        <motion.div key={currentQuestion.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                            <QuizEngine question={currentQuestion} questionIndex={currentIndex} totalQuestions={questions.length} selectedAnswer={answers[currentQuestion.id] || null} onAnswer={handleAnswer} showFeedback={true} showAIExplanation={true} aiExplanationText={aiText} loadingAI={loadingAI} isDarkMode={isDarkMode} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {currentQuestion && answers[currentQuestion.id] && (
                        <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.22 }} onClick={nextQuestion} className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white transition-all duration-200 shadow-sm hover:shadow-md">
                            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Practice'}<ArrowRight className="w-4 h-4" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
            <FloatingChatbot position="bottom-right" />
        </div>
    );
};

export default PracticeMode;