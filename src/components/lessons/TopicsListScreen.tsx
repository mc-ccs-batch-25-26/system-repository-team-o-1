import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Lock, Star, ChevronRight, CheckCircle2, BookOpen, Trophy } from 'lucide-react';
import { lessonContent } from '../../data/lessonContent';
import { supabase } from '../../supabase/supabaseClient';

const CATEGORY_COLORS: Record<string, {
    gradient: string; accent: string; accentSoft: string; accentText: string;
    accentDark: string; border: string; pillBg: string; pillText: string;
}> = {
    'Verbal Ability': {
        gradient: 'from-blue-600 to-indigo-600', accent: 'bg-blue-500', accentSoft: 'bg-blue-500/10',
        accentText: 'text-blue-500', accentDark: 'dark:text-blue-400', border: 'border-blue-500/20',
        pillBg: 'bg-blue-500/10 dark:bg-blue-500/20', pillText: 'text-blue-700 dark:text-blue-300',
    },
    'Numerical Ability': {
        gradient: 'from-emerald-500 to-teal-600', accent: 'bg-emerald-500', accentSoft: 'bg-emerald-500/10',
        accentText: 'text-emerald-500', accentDark: 'dark:text-emerald-400', border: 'border-emerald-500/20',
        pillBg: 'bg-emerald-500/10 dark:bg-emerald-500/20', pillText: 'text-emerald-700 dark:text-emerald-300',
    },
    'Analytical Ability': {
        gradient: 'from-violet-600 to-purple-700', accent: 'bg-violet-500', accentSoft: 'bg-violet-500/10',
        accentText: 'text-violet-500', accentDark: 'dark:text-violet-400', border: 'border-violet-500/20',
        pillBg: 'bg-violet-500/10 dark:bg-violet-500/20', pillText: 'text-violet-700 dark:text-violet-300',
    },
    'General Information': {
        gradient: 'from-amber-500 to-orange-500', accent: 'bg-amber-500', accentSoft: 'bg-amber-500/10',
        accentText: 'text-amber-500', accentDark: 'dark:text-amber-400', border: 'border-amber-500/20',
        pillBg: 'bg-amber-500/10 dark:bg-amber-500/20', pillText: 'text-amber-700 dark:text-amber-300',
    },
};

const DIFFICULTY_MAP: Record<number, { label: string; color: string; darkColor: string; stars: number }> = {
    0: { label: 'Beginner', color: 'text-emerald-600', darkColor: 'dark:text-emerald-400', stars: 1 },
    1: { label: 'Intermediate', color: 'text-amber-600', darkColor: 'dark:text-amber-400', stars: 2 },
    2: { label: 'Advanced', color: 'text-rose-600', darkColor: 'dark:text-rose-400', stars: 3 },
};

const StarBadge: React.FC<{ count: number; filled: boolean }> = ({ count, filled }) => (
    <div className="flex items-center gap-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
            <Star key={i} className={`w-3 h-3 transition-colors ${i < count ? (filled ? 'text-amber-400 fill-amber-400' : 'text-amber-400 fill-amber-400/30') : 'text-zinc-300 dark:text-zinc-600'}`} />
        ))}
    </div>
);

export const TopicsListScreen: React.FC = () => {
    const { isDarkMode } = useOutletContext<any>();
    const navigate = useNavigate();
    const { category } = useParams<{ category: string }>();

    const categoryData = lessonContent.find((c) => c.title === category);
    const colors = CATEGORY_COLORS[category || ''] || CATEGORY_COLORS['Verbal Ability'];
    const [completedTopics, setCompletedTopics] = useState<string[]>([]);

    useEffect(() => {
        const fetchCompleted = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: progress } = await supabase.from('lesson_progress').select('topic_id').eq('user_id', user.id).eq('status', 'completed');
                if (progress) setCompletedTopics(progress.map((p) => p.topic_id));
            }
        };
        fetchCompleted();
    }, [category]);

    const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
    const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
    const pageBase = isDarkMode ? 'bg-zinc-950' : 'bg-slate-50';
    const cardBase = isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/90 border-zinc-200';

    if (!categoryData) {
        return (
            <div className={`min-h-screen ${pageBase} flex flex-col items-center justify-center gap-4 px-4`}>
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}><BookOpen className={`w-10 h-10 ${subtextClass}`} /></div>
                <h1 className={`text-2xl font-bold ${textClass}`}>Category not found</h1>
                <p className={subtextClass}>We couldn't locate that subject in our library.</p>
                <button onClick={() => navigate('/lessons')} className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 active:scale-95">Return to Subjects</button>
            </div>
        );
    }

    const topics = categoryData.topics;
    const completedCount = topics.filter((t) => completedTopics.includes(t.id)).length;

    const cardVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] } }),
    };

    return (
        <div className={`min-h-screen ${pageBase} transition-colors duration-300`}>
            <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="flex items-start gap-4">
                    <button onClick={() => navigate('/lessons')}
                        className={`mt-1 p-2 rounded-xl border transition-all duration-200 flex-shrink-0 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'} active:scale-95`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors.pillBg} ${colors.pillText}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${colors.accent}`} />Subject
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">{categoryData.title}</h1>
                        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Complete each topic in order to unlock the next one</p>
                    </div>
                </motion.div>

                {/* Topic Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topics.map((topic, index) => {
                        const hasData = topic.items.length > 0;
                        const isCompleted = completedTopics.includes(topic.id);
                        const previousCompleted = index === 0 || completedTopics.includes(topics[index - 1]?.id);
                        const isUnlocked = hasData && (index === 0 || previousCompleted || isCompleted);
                        const difficultyLevel = index <= 1 ? 0 : index <= 3 ? 1 : 2;
                        const diff = DIFFICULTY_MAP[difficultyLevel];

                        const cardStyle = isCompleted
                            ? isDarkMode ? 'bg-emerald-950/40 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'
                            : !isUnlocked
                            ? isDarkMode ? 'bg-zinc-900/50 border-zinc-800 opacity-55' : 'bg-zinc-50 border-zinc-200 opacity-60'
                            : cardBase;

                        return (
                            <motion.div key={topic.id} custom={index} variants={cardVariants} initial="hidden" animate="visible"
                                onClick={() => isUnlocked && navigate(`/lessons/${encodeURIComponent(categoryData.title)}/${encodeURIComponent(topic.title)}`)}
                                className={`relative group rounded-2xl border overflow-hidden ${cardStyle} ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'} transition-all duration-200 ${isUnlocked && !isCompleted ? 'hover:shadow-lg hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700' : ''} ${isCompleted ? 'hover:shadow-md hover:-translate-y-0.5' : ''}`}>
                                {isUnlocked && !isCompleted && <div className={`absolute top-0 left-0 right-0 h-0.5 ${colors.accent} opacity-70`} />}
                                {isCompleted && <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {isCompleted ? (
                                                <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                                            ) : (
                                                <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isUnlocked ? `${colors.accentSoft} ${colors.accentText}` : isDarkMode ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-zinc-400'}`}>{index + 1}</div>
                                            )}
                                            <h3 className={`text-base font-semibold leading-snug ${textClass} ${!isUnlocked && !isCompleted ? 'opacity-60' : ''}`}>{topic.title}</h3>
                                        </div>
                                        {!hasData && <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>Soon</span>}
                                        {!isUnlocked && hasData && !isCompleted && <div className={`flex-shrink-0 p-1.5 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}><Lock className="w-4 h-4 text-zinc-400" /></div>}
                                        {isCompleted && <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Done ✓</span>}
                                    </div>
                                    <p className={`text-sm leading-relaxed line-clamp-2 mb-4 pl-10 ${subtextClass} ${!isUnlocked && !isCompleted ? 'opacity-60' : ''}`}>{topic.description}</p>
                                    <div className="flex items-center justify-between pl-10">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${isUnlocked ? `${colors.pillBg} ${colors.pillText}` : isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}>{hasData ? `${topic.items.length} items` : '0 items'}</span>
                                            <div className="flex items-center gap-1.5"><StarBadge count={diff.stars} filled={isUnlocked || isCompleted} /><span className={`text-xs font-medium ${diff.color} ${diff.darkColor}`}>{diff.label}</span></div>
                                        </div>
                                        {isUnlocked && !isCompleted && <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15 }} className={`flex items-center gap-1 text-xs font-semibold ${colors.accentText} ${colors.accentDark}`}>Start<ChevronRight className="w-4 h-4" /></motion.div>}
                                        {isCompleted && <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15 }} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Review<ChevronRight className="w-4 h-4" /></motion.div>}
                                        {!isUnlocked && <span className={`text-xs font-medium ${subtextClass} opacity-60`}>Locked</span>}
                                    </div>
                                </div>
                                {isUnlocked && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-2xl" />}
                            </motion.div>
                        );
                    })}
                </div>

                {/* All complete footer */}
                <AnimatePresence>
                    {completedCount === topics.length && topics.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            className={`flex items-center gap-4 p-5 rounded-2xl border ${isDarkMode ? 'bg-amber-950/30 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="p-2.5 rounded-xl bg-amber-500/10"><Trophy className="w-6 h-6 text-amber-500" /></div>
                            <div><p className={`text-sm font-bold ${textClass}`}>Subject complete!</p><p className={`text-xs mt-0.5 ${subtextClass}`}>You've mastered all topics in {categoryData.title}. Keep going!</p></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TopicsListScreen;  