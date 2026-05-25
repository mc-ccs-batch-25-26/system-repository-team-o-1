import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import AnalyticsGraph from '../components/AnalyticsGraph';
import { getCategoryPerformanceData, CategoryPerformance } from '../firebase/analyticsService';
import { supabase } from '../supabase/supabaseClient';
import { Lightbulb, Zap, Flame, Timer, FileText, TrendingUp, TrendingDown, Award, BookOpen, Clock, Target, ChevronDown} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── tiny design tokens ─────────────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (i: number) => ({ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: i * 0.06 } } });

/* ─── helpers ────────────────────────────────────────────────────────────── */
const getQuizTypeLabel = (type: string) => {
    const map: Record<string, string> = {
        daily: 'Daily Quiz',
        timed: 'Timed Challenge',
        mock:  'Mock Exam',
        practice: 'Practice Mode',
    };
    return map[type] ?? 'Quiz';
};

const quizTypeMeta: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    daily:    { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-600 dark:text-amber-400',  icon: <Zap    className="w-4 h-4" /> },
    timed:    { bg: 'bg-rose-100 dark:bg-rose-900/30',    text: 'text-rose-600 dark:text-rose-400',    icon: <Timer  className="w-4 h-4" /> },
    mock:     { bg: 'bg-violet-100 dark:bg-violet-900/30',text: 'text-violet-600 dark:text-violet-400',icon: <FileText className="w-4 h-4" /> },
    practice: { bg: 'bg-sky-100 dark:bg-sky-900/30',      text: 'text-sky-600 dark:text-sky-400',      icon: <BookOpen className="w-4 h-4" /> },
};
const fallbackMeta = { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500', icon: <Target className="w-4 h-4" /> };

const scoreColor = (pct: number) =>
    pct >= 70 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-rose-500';

const scoreBadge = (pct: number) =>
    pct >= 70
        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
        : pct >= 40
        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400';

const accuracyBar = (pct: number) =>
    pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-rose-500';

/* ─── skeleton shimmer ───────────────────────────────────────────────────── */
const Shimmer = ({ className }: { className?: string }) => (
    <div className={`relative overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
    </div>
);

/* ─── stat card ──────────────────────────────────────────────────────────── */
interface StatCardProps {
    label: string;
    value: string;
    iconBg: string;
    icon: React.ReactNode;
    delay?: number;
}
const StatCard = ({ label, value, iconBg, icon, delay = 0 }: StatCardProps) => (
    <motion.div
        variants={fadeUp}
        className="group flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300"
    >
        <div className={`p-3 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">{label}</p>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-0.5 leading-none">{value}</p>
        </div>
    </motion.div>
);

/* ─── section wrapper ────────────────────────────────────────────────────── */
const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <motion.div
        variants={fadeUp}
        className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm ${className}`}
    >
        {children}
    </motion.div>
);

/* ─── animated progress bar ──────────────────────────────────────────────── */
const ProgressBar = ({ value, colorClass }: { value: number; colorClass: string }) => (
    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <motion.div
            className={`h-full rounded-full ${colorClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(value, 100)}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const ProgressPage = () => {
    const { isDarkMode } = useOutletContext<any>();
    const [categoryData, setCategoryData]   = useState<CategoryPerformance[]>([]);
    const [loading, setLoading]             = useState(true);
    const [xpTotal, setXpTotal]             = useState(0);
    const [streakDays, setStreakDays]       = useState(0);
    const [userLevel, setUserLevel]         = useState(1);
    const [quizHistory, setQuizHistory]     = useState<any[]>([]);
    const [showAllHistory, setShowAllHistory] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getCategoryPerformanceData();
            const sortedData = [...data].sort((a, b) => b.regularAccuracy - a.regularAccuracy);
            setCategoryData(sortedData);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('xp, level, streak_count')
                        .eq('id', user.id)
                        .single();
                    if (profile) {
                        setXpTotal(profile.xp || 0);
                        setUserLevel(profile.level || 1);
                        setStreakDays(profile.streak_count || 0);
                    }

                    const { data: sessions } = await supabase
                        .from('quiz_sessions')
                        .select('score, total_questions, quiz_type, ended_at')
                        .eq('user_id', user.id)
                        .eq('is_pretest', false)
                        .not('ended_at', 'is', null)
                        .order('ended_at', { ascending: false })
                        .limit(showAllHistory ? 50 : 5);

                    if (sessions) setQuizHistory(sessions);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            }

            setLoading(false);
        };
        fetchData();
    }, [showAllHistory]);

    const sorted   = [...categoryData].sort((a, b) => a.regularAccuracy - b.regularAccuracy);
    const weakest  = sorted[0];
    const strongest = sorted[sorted.length - 1];
    const hasSubjects = categoryData.filter(c => c.lessonCompleted > 0 || c.quizTotal > 0).length > 0;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* shimmer keyframe */}
            <style>{`@keyframes shimmer{to{transform:translateX(200%)}}`}</style>

            <div className="flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-7">

                {/* ── Page header ─────────────────────────────────────────── */}
                <motion.div initial="hidden" animate="show" variants={fadeUp}>
                    <p className="text-xs font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-2">Dashboard</p>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        Your Progress
                    </h1>
                    <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
                        Track your quiz performance, lesson completion, and learning momentum across all subjects.
                    </p>
                </motion.div>

                {/* ── Stat cards ──────────────────────────────────────────── */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <Shimmer key={i} className="h-24" />)}
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                        initial="hidden"
                        animate="show"
                        variants={stagger(1)}
                    >
                        <StatCard
                            label="Total XP"
                            value={xpTotal.toLocaleString()}
                            iconBg="bg-amber-100 dark:bg-amber-900/30"
                            icon={<Zap className="w-5 h-5 text-amber-500" />}
                        />
                        <StatCard
                            label="Current Streak"
                            value={`${streakDays} day${streakDays !== 1 ? 's' : ''}`}
                            iconBg="bg-orange-100 dark:bg-orange-900/30"
                            icon={<Flame className="w-5 h-5 text-orange-500" />}
                        />
                        <StatCard
                            label="Level"
                            value={String(userLevel)}
                            iconBg="bg-blue-100 dark:bg-blue-900/30"
                            icon={<Award className="w-5 h-5 text-blue-500" />}
                        />
                    </motion.div>
                )}

                {/* ── Adaptive Insights ───────────────────────────────────── */}
                <AnimatePresence>
                    {!loading && categoryData.length > 0 && weakest && strongest && (
                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={fadeUp}
                            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden"
                        >
                            {/* header strip */}
                            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                                <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                </span>
                                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Adaptive Insights</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-800">
                                {/* Weakest */}
                                <div className="p-5 bg-white dark:bg-zinc-900">
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                                        <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide">Needs Work</p>
                                    </div>
                                    <p className="font-semibold text-zinc-900 dark:text-white text-base">{weakest.categoryName}</p>
                                    <div className="mt-2.5 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-rose-400"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${weakest.regularAccuracy}%` }}
                                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-rose-500 tabular-nums">{weakest.regularAccuracy}%</span>
                                    </div>
                                </div>

                                {/* Strongest */}
                                <div className="p-5 bg-white dark:bg-zinc-900">
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                        <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">Top Subject</p>
                                    </div>
                                    <p className="font-semibold text-zinc-900 dark:text-white text-base">{strongest.categoryName}</p>
                                    <div className="mt-2.5 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-emerald-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${strongest.regularAccuracy}%` }}
                                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-emerald-500 tabular-nums">{strongest.regularAccuracy}%</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Quiz Performance Overview ────────────────────────────── */}
                <motion.div initial="hidden" animate="show" variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Quiz Performance</h2>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                            Accuracy across all quiz types (Daily, Practice, Timed)
                        </p>
                    </div>
                    <div className="p-6">
                        <AnalyticsGraph isDarkMode={isDarkMode} />
                    </div>
                </motion.div>

              
                 {/* ── Subject Overview ────────────────────────────────────── */}
<Section>
    <div className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Subject Overview</h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            Topics completed per subject
        </p>
    </div>

    <div className="p-6">
        {loading ? (
            <div className="space-y-5">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-36 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
                        <div className="flex-1 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    </div>
                ))}
            </div>
        ) : (
            <div className="space-y-5">
                {['Verbal Ability', 'Numerical Ability', 'Analytical Ability', 'General Information'].map((catName, idx) => {
                    const category = categoryData.find(c => c.categoryName === catName);
                    const completed = category?.lessonCompleted || 0;
                    const total = category?.lessonTotal || 0;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                    // Same color logic as AnalyticsGraph
                    const barColor = pct >= 70 
                        ? (isDarkMode ? 'rgba(52, 211, 153, 0.85)' : 'rgba(16, 185, 129, 0.85)')
                        : pct >= 40 
                        ? (isDarkMode ? 'rgba(251, 191, 36, 0.85)' : 'rgba(245, 158, 11, 0.85)')
                        : (isDarkMode ? 'rgba(251, 113, 133, 0.85)' : 'rgba(244, 63, 94, 0.82)');

                    return (
                        <motion.div
                            key={catName}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="flex items-center gap-4"
                        >
                            {/* Category label — same width as AnalyticsGraph y-axis */}
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 w-36 shrink-0 text-right">
                                {catName}
                            </span>

                            {/* Bar — same height and style as AnalyticsGraph */}
                            <div className="flex-1 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-md"
                                    style={{ backgroundColor: barColor }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(pct, 100)}%` }}
                                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 + idx * 0.05 }}
                                />
                            </div>

                           <div className="text-right shrink-0">
    <span className="text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
        {completed}/{total} <span className="text-[13px] font-medium text-emerald-500">Topics</span>
    </span>
</div>
                        </motion.div>
                    );
                })}
            </div>
        )}
    </div>
</Section>

                {/* ── Quiz History ─────────────────────────────────────────── */}
                <motion.div initial="hidden" animate="show" variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div>
                            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Quiz History</h2>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Your recent attempts and scores</p>
                        </div>

                        {quizHistory.length >= 5 && (
                            <button
                                onClick={() => setShowAllHistory(!showAllHistory)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200"
                            >
                                {showAllHistory ? 'Show Less' : 'View All'}
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllHistory ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                    </div>

                    <div className="p-6">
                        {quizHistory.length === 0 ? (
                            <EmptyState
                                icon={<Target className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />}
                                title="No quiz history yet"
                                description="Start a quiz to see your attempts and scores here."
                            />
                        ) : (
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {quizHistory.map((quiz, index) => {
                                        const totalQ    = quiz.total_questions || 0;
                                        const accuracy  = totalQ > 0 ? Math.round((quiz.score / totalQ) * 100) : 0;
                                        const quizType  = quiz.quiz_type || '';
                                        const meta      = quizTypeMeta[quizType] ?? fallbackMeta;
                                        const quizDate  = quiz.ended_at
                                            ? new Date(quiz.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : 'In progress';

                                        return (
                                            <motion.div
                                                key={index}
                                                layout
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                                transition={{ delay: index * 0.03, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                                className="group flex items-center justify-between px-4 py-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-200 cursor-default"
                                            >
                                                {/* left: icon + meta */}
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                                                        <span className={meta.text}>{meta.icon}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                                                                {getQuizTypeLabel(quizType)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <Clock className="w-3 h-3 text-zinc-400" />
                                                            <p className="text-xs text-zinc-400 dark:text-zinc-500">{quizDate}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* right: score */}
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                                        {quiz.score}<span className="font-normal text-zinc-400">/{totalQ > 0 ? totalQ : '?'}</span>
                                                    </p>
                                                    {totalQ > 0 && (
                                                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${scoreBadge(accuracy)}`}>
                                                            {accuracy}%
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

/* ─── empty state ────────────────────────────────────────────────────────── */
const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 mb-4">
            {icon}
        </div>
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{title}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">{description}</p>
    </div>
);

export default ProgressPage;