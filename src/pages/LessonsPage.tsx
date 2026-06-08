import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    BookOpen, Hash, Brain, Lightbulb, ChevronRight,
    CheckCircle2, Circle, TrendingUp, Library, Target, Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase/supabaseClient';

/* ─── types ──────────────────────────────────────────────────────────────── */
interface CategoryProgress {
    name: string;
    total: number;
    completed: number;
    accuracy: number;
}

/* ─── design tokens ──────────────────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/* ─── constants ──────────────────────────────────────────────────────────── */
const FLASHCARD_TOTALS: Record<string, number> = {
    'Verbal Ability': 50,
    'Numerical Ability': 50,
    'Analytical Ability': 50,
    'General Information': 50,
};

const CATEGORY_CONFIG: Record<string, {
    icon: React.ReactNode;
    description: string;
    iconBg: string;
    iconText: string;
    barColor: string;
    pillBg: string;
    pillText: string;
    modules: string[];
}> = {
    'Verbal Ability': {
        icon: <BookOpen className="w-5 h-5" />,
        description: 'Grammar · Vocabulary · Reading Comprehension · Analogy',
        iconBg: 'bg-sky-100 dark:bg-sky-900/30',
        iconText: 'text-sky-600 dark:text-sky-400',
        barColor: 'bg-sky-500',
        pillBg: 'bg-sky-50 dark:bg-sky-900/20',
        pillText: 'text-sky-600 dark:text-sky-400',
        modules: ['Grammar rules', 'Vocabulary builder', 'Reading speed', 'Word analogies'],
    },
    'Numerical Ability': {
        icon: <Hash className="w-5 h-5" />,
        description: 'Arithmetic · Algebra · Number Series · Data Interpretation',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        barColor: 'bg-emerald-500',
        pillBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        pillText: 'text-emerald-600 dark:text-emerald-400',
        modules: ['Basic arithmetic', 'Word problems', 'Number series', 'Fractions & ratios'],
    },
    'Analytical Ability': {
        icon: <Brain className="w-5 h-5" />,
        description: 'Patterns · Deduction · Analogies · Critical Thinking',
        iconBg: 'bg-violet-100 dark:bg-violet-900/30',
        iconText: 'text-violet-600 dark:text-violet-400',
        barColor: 'bg-violet-500',
        pillBg: 'bg-violet-50 dark:bg-violet-900/20',
        pillText: 'text-violet-600 dark:text-violet-400',
        modules: ['Pattern recognition', 'Syllogisms', 'Logical deduction', 'Critical analysis'],
    },
    'General Information': {
        icon: <Globe className="w-5 h-5" />,
        description: 'Philippine Constitution · RA 6713 · Environmental Laws',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconText: 'text-amber-600 dark:text-amber-400',
        barColor: 'bg-amber-500',
        pillBg: 'bg-amber-50 dark:bg-amber-900/20',
        pillText: 'text-amber-600 dark:text-amber-400',
        modules: ['Constitution basics', 'Ethics & public service', 'Current events'],
    },
};

/* ─── helpers ────────────────────────────────────────────────────────────── */
const getStatus = (pct: number): { label: string; cls: string } => {
    if (pct >= 70) return { label: 'Mastered',    cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' };
    if (pct >= 10) return { label: 'In Progress', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'         };
    return                 { label: 'Not Started', cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'               };
};

/* ─── shimmer ────────────────────────────────────────────────────────────── */
const Shimmer = ({ className }: { className?: string }) => (
    <div className={`relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
    </div>
);

/* ─── animated bar ───────────────────────────────────────────────────────── */
const Bar = ({ value, colorClass, delay = 0 }: { value: number; colorClass: string; delay?: number }) => (
    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <motion.div
            className={`h-full rounded-full ${colorClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(value, 100)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
        />
    </div>
);

/* ══════════════════════════════════════════════════════════════════════════ */
const LessonsPage: React.FC = () => {
    const { isDarkMode } = useOutletContext<any>();
    const navigate = useNavigate();

    const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([
        { name: 'Verbal Ability',      total: 50, completed: 0, accuracy: 0 },
        { name: 'Numerical Ability',   total: 50, completed: 0, accuracy: 0 },
        { name: 'Analytical Ability',  total: 50, completed: 0, accuracy: 0 },
        { name: 'General Information', total: 50, completed: 0, accuracy: 0 },
    ]);
    const [loading, setLoading] = useState(true);

    /* ── data fetch (unchanged logic) ───────────────────────────────────── */
    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { setLoading(false); return; }

                const { data: lessonProgress } = await supabase
                    .from('lesson_progress')
                    .select('category_id, topic_id, score, total_questions')
                    .eq('user_id', user.id);

                const { data: categories } = await supabase.from('categories').select('id, name');

                const updated = Object.entries(FLASHCARD_TOTALS).map(([name, total]) => {
                    const category    = categories?.find(c => c.name === name);
                    const catProgress = lessonProgress?.filter(p => p.category_id === category?.id) || [];
                    const completedTopics = catProgress.length;
                    const totalScore  = catProgress.reduce((s, p) => s + (p.score || 0), 0);
                    const totalQ      = catProgress.reduce((s, p) => s + (p.total_questions || 0), 0);
                    const accuracy    = totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0;
                    const completedItems = Math.min(completedTopics * 10, total);
                    return { name, total, completed: completedItems, accuracy };
                });

                setCategoryProgress(updated);
            } catch (err) {
                console.error('Error fetching lesson progress:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, []);

    /* ── derived stats ───────────────────────────────────────────────────── */
    const totalCompleted = categoryProgress.reduce((s, c) => s + c.completed, 0);
    const totalItems     = categoryProgress.reduce((s, c) => s + c.total, 0);
    const overallPct     = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
    const withAccuracy   = categoryProgress.filter(c => c.accuracy > 0);
    const avgAccuracy    = withAccuracy.length > 0
        ? Math.round(withAccuracy.reduce((s, c) => s + c.accuracy, 0) / withAccuracy.length) : 0;
    const subjectsDone   = categoryProgress.filter(c => c.completed > 0).length;


    /* ══════════════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <style>{`@keyframes shimmer{to{transform:translateX(200%)}}`}</style>

            <motion.div
                initial="hidden" animate="show" variants={stagger}
                className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6"
            >
                {/* ── Page header ─────────────────────────────────────────── */}
                <motion.div variants={fadeUp}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Study</p>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Study Materials</h1>
                    <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                        Structured learning modules for the Civil Service Exam
                    </p>
                </motion.div>

                {/* ── Stats row ───────────────────────────────────────────── */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <Shimmer key={i} className="h-24" />)}
                    </div>
                ) : (
                    <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                label: 'Overall Progress',
                                value: `${overallPct}%`,
                                sub: `${totalCompleted} of ${totalItems} completed`,
                                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                                icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
                            },
                            {
                                label: 'Subjects Active',
                                value: String(subjectsDone),
                                sub: 'across 4 subjects',
                                iconBg: 'bg-violet-100 dark:bg-violet-900/30',
                                icon: <Library className="w-5 h-5 text-violet-500" />,
                            },
                            {
                                label: 'Avg. Accuracy',
                                value: avgAccuracy > 0 ? `${avgAccuracy}%` : '—',
                                sub: 'based on lesson quizzes',
                                iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                                icon: <Target className="w-5 h-5 text-emerald-500" />,
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                className="group flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300"
                            >
                                <div className={`p-3 rounded-xl ${stat.iconBg} transition-transform duration-300 group-hover:scale-110 shrink-0`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{stat.label}</p>
                                    <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-0.5 leading-none">{stat.value}</p>
                                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{stat.sub}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* ── Subject cards ────────────────────────────────────────── */}
                <motion.div variants={fadeUp} className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">All Subjects</p>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-40" />)}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {categoryProgress.map((cat, index) => {
                                const pct    = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
                                const status = getStatus(pct);
                                const cfg    = CATEGORY_CONFIG[cat.name];

                                return (
                                    <motion.button
                                        key={cat.name}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 + index * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                        onClick={() => navigate(`/lessons/${encodeURIComponent(cat.name)}`)}
                                        className="w-full text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-all duration-200 overflow-hidden group"
                                    >
                                        {/* card body */}
                                        <div className="p-5">
                                            <div className="flex items-start gap-4">

                                                {/* icon */}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg?.iconBg} ${cfg?.iconText} transition-transform duration-300 group-hover:scale-110`}>
                                                    {cfg?.icon}
                                                </div>

                                                {/* content */}
                                                <div className="flex-1 min-w-0 space-y-3">

                                                    {/* title row */}
                                                    <div className="flex items-center justify-between gap-3">
                                                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{cat.name}</h3>
                                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${status.cls}`}>
                                                            {status.label}
                                                        </span>
                                                    </div>

                                                    {/* description */}
                                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{cfg?.description}</p>

                                                    {/* module chips */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(cfg?.modules || []).map((mod, mi) => {
                                                            const done = mi < Math.ceil((pct / 100) * (cfg?.modules.length || 4));
                                                            return (
                                                                <span
                                                                    key={mod}
                                                                    className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg border transition-colors ${
                                                                        done
                                                                            ? `${cfg?.pillBg} ${cfg?.pillText} border-transparent`
                                                                            : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700'
                                                                    }`}
                                                                >
                                                                    {done
                                                                        ? <CheckCircle2 className="w-2.5 h-2.5" />
                                                                        : <Circle className="w-2.5 h-2.5" />
                                                                    }
                                                                    {mod}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* progress bar */}
                                                    <div className="space-y-1.5">
                                                        <Bar value={pct} colorClass={cfg?.barColor || 'bg-zinc-400'} delay={0.1 + index * 0.07} />
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                                                {cat.completed}/{cat.total} items
                                                                {cat.accuracy > 0 && (
                                                                    <span className="ml-2">· {cat.accuracy}% accuracy</span>
                                                                )}
                                                            </p>
                                                            <span className={`text-xs font-bold tabular-nums ${cfg?.iconText}`}>{pct}%</span>
                                                        </div>
                                                    </div>
                                                </div>      

                                                {/* chevron */}
                                                <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 shrink-0 mt-0.5 transition-colors duration-200 translate-x-0 group-hover:translate-x-0.5" />
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default LessonsPage;