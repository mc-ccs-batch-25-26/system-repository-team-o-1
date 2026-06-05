import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from "react-router-dom";
import { Target, TrendingUp, Award, Zap, BookOpen, Lock, CheckCircle2 } from 'lucide-react';
import Footer from './components/footer/Footer';
import ProfileModal from './components/ProfileModal';
import { supabase } from './supabase/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingChatbot from './components/FloatingChatbot';

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};
const staggerContainer = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const Confetti = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const pieces = Array.from({ length: 60 }, (_, i) => ({
        id: i, color: colors[i % colors.length],
        left: `${Math.random() * 100}%`, delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1.5, size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
    }));
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map(p => (
                <motion.div key={p.id}
                    initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
                    animate={{ y: '110vh', x: (Math.random() - 0.5) * 150, opacity: [1, 0.8, 0.3, 0], rotate: p.rotate + 360 }}
                    transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
                    style={{ position: 'absolute', left: p.left, top: 0, width: p.size, height: p.size * 0.6, backgroundColor: p.color, borderRadius: '2px' }}
                />
            ))}
        </div>
    );
};

const Shimmer = ({ className }: { className?: string }) => (
    <div className={`relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800/60 ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
    </div>
);

const ProgressBar = ({ value, colorClass, height = 'h-1.5' }: { value: number; colorClass: string; height?: string }) => (
    <div className={`w-full ${height} rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden`}>
        <motion.div className={`h-full rounded-full ${colorClass}`}
            initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
    </div>
);

const ReadinessRing = ({ value, isDarkMode }: { value: number; isDarkMode: boolean }) => {
    const r = 42; const circumference = 2 * Math.PI * r;
    const ringColor = value >= 80 ? '#10b981' : value >= 60 ? '#3b82f6' : value >= 40 ? '#f59e0b' : '#f43f5e';
    const textColor = value >= 80 ? 'text-emerald-500' : value >= 60 ? 'text-blue-500' : value >= 40 ? 'text-amber-500' : 'text-rose-500';
    return (
        <div className="relative w-32 h-32 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke={isDarkMode ? '#27272a' : '#f4f4f5'} strokeWidth="9" />
                <motion.circle cx="50" cy="50" r={r} fill="none" stroke={ringColor} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold tabular-nums ${textColor}`}>{value}%</span>
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Ready</span>
            </div>
        </div>
    );
};

const quizTypeLabel = (t: string) =>
    ({ daily: 'Daily Quiz', timed: 'Timed Challenge', mock: 'Mock Exam', practice: 'Practice Mode' }[t] ?? 'Recent Quiz');

const accuracyColor = (pct: number) =>
    pct >= 70 ? { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' }
    : pct >= 40 ? { text: 'text-amber-600 dark:text-amber-400',   bar: 'bg-amber-500',   badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' }
    :             { text: 'text-rose-600 dark:text-rose-400',     bar: 'bg-rose-500',    badge: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' };

const weakColor = (pct: number) =>
    pct < 50 ? { text: 'text-rose-500', bar: 'bg-rose-500' }
    : pct < 70 ? { text: 'text-amber-500', bar: 'bg-amber-500' }
    :            { text: 'text-emerald-500', bar: 'bg-emerald-500' };

const readinessMessage = (score: number, done: boolean) => {
    if (!done) return 'Complete the diagnostic pre-test to see your personalised exam readiness score.';
    if (score >= 80) return "You're well-prepared for the CSC exam. Keep maintaining your streak!";
    if (score >= 60) return "Great progress — focus on your weak areas to push past 80%.";
    if (score >= 40) return "Keep practicing daily. Consistent sessions build real results.";
    return "Start with daily quizzes to build your knowledge base steadily.";
};

function HomePage() {
    const { isDarkMode } = useOutletContext<any>();
    const navigate = useNavigate();

    const [previousLevel, setPreviousLevel] = useState<number | null>(() => {
    const saved = localStorage.getItem('civiquest_previous_level');
    return saved ? parseInt(saved) : null;
   });
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentUserSession, setCurrentUserSession] = useState<string | null>(null);

    const [civiquestUser, setCiviquestUser] = useState({
        username: 'Aspirant', avatarUrl: null as string | null,
        xp: 0, level: 1, streak: 0, pretestDone: false, readiness: 0, created_at: '',
    });
    const [weakAreas, setWeakAreas] = useState<{ category: string; accuracy: number }[]>([]);
    const [recentQuiz, setRecentQuiz] = useState({ date: 'Not yet', score: 0, total: 0, accuracy: 0, quizType: '' });
    const [recentBadges, setRecentBadges] = useState<any[]>([]);

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }
            setCurrentUserSession(user.id);

            const [profileRes, perfRes, sessionRes, mockRes, categoriesRes, badgesRes] = await Promise.all([
               supabase.from('profiles').select('username, avatar_url, xp, level, pretest_done, streak_count, created_at').eq('id', user.id).maybeSingle(),
               supabase.from('performance').select('accuracy_rate, category_id').eq('user_id', user.id).order('accuracy_rate', { ascending: true }),
               supabase.from('quiz_sessions').select('score, total_questions, quiz_type, ended_at').eq('user_id', user.id).eq('is_pretest', false).not('ended_at', 'is', null).order('ended_at', { ascending: false }).limit(1).maybeSingle(),
               supabase.from('quiz_sessions').select('score, total_questions').eq('user_id', user.id).eq('quiz_type', 'mock').order('ended_at', { ascending: false }).limit(1).maybeSingle(),
               supabase.from('categories').select('id, name'),
               supabase.from('user_badges').select('badge_id, badge_name, earned_at').eq('user_id', user.id).order('earned_at', { ascending: false }).limit(4),
      ]);

            const { data: profile, error: profileErr } = profileRes;
            const { data: perf } = perfRes;
            const { data: lastSession } = sessionRes;
            const { data: lastMock } = mockRes;
            const { data: categories } = categoriesRes;
            const { data: badges } = badgesRes;

            const avgAccuracy = perf && perf.length > 0
                ? perf.reduce((sum: number, p: any) => sum + (p.accuracy_rate || 0), 0) / perf.length : 0;
            const mockScore = lastMock && lastMock.total_questions > 0
                ? (lastMock.score / lastMock.total_questions) * 100 : 0;
            const categoriesCovered = perf?.length || 0;
            const weakAreasCount = perf ? perf.filter((p: any) => (p.accuracy_rate || 0) < 70).length : 4;
            const weakAreasImproved = categoriesCovered > 0 ? Math.max(0, 4 - weakAreasCount) : 0;

            if (!profileErr && profile) {
             const xp = profile.xp || 0;
             const newLevel = profile.level || 1;
             const savedLevel = localStorage.getItem('civiquest_previous_level');
    
    // Only show level-up if we have a saved level AND it's different
           if (savedLevel && newLevel > parseInt(savedLevel)) {
         setShowLevelUp(true);
         setTimeout(() => setShowLevelUp(false), 2000);
       }
    
    // Always save the current level
         setPreviousLevel(newLevel);
         localStorage.setItem('civiquest_previous_level', String(newLevel));
    
         const readiness = profile.pretest_done
         ? Math.round((mockScore * 0.4) + (avgAccuracy * 0.3) + (weakAreasImproved / 4) * 15 + (Math.min(categoriesCovered, 4) / 4) * 10 + (profile.pretest_done ? 5 : 0))
         : 0;
          setCiviquestUser({
            username: profile.username || user.email?.split('@')[0] || 'Aspirant',
            avatarUrl: profile.avatar_url || null,
            xp, level: newLevel,
            streak: profile.streak_count || 0,
            pretestDone: profile.pretest_done || false,
            readiness, created_at: profile.created_at || '',
        });
     }

            let weakData: { category: string; accuracy: number }[] = [];
            if (profile?.pretest_done) {
                const { data: pretestResults } = await supabase.from('pretest_results').select('score, total_questions, category_id').eq('user_id', user.id);
                if (pretestResults && pretestResults.length > 0) {
                    weakData = pretestResults.map((item: any) => {
                        const category = categories?.find((c: any) => c.id === item.category_id);
                        const perfData = perf?.find((p: any) => p.category_id === item.category_id);
                        const accuracy = perfData ? Math.round(perfData.accuracy_rate || 0) : Math.round((item.score / item.total_questions) * 100);
                        return { category: category?.name || 'Unknown', accuracy };
                    }).filter(item => item.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
                }
            }
           if (weakData.length === 0 && perf && perf.length > 0) {
              weakData = perf
             .filter((p: any) => (p.total_answered || 0) >= 5 && (p.accuracy_rate || 0) < 70)
             .slice(0, 3)
             .map((p: any) => ({
             category: categories?.find((c: any) => c.id === p.category_id)?.name || 'Unknown',
             accuracy: Math.round(p.accuracy_rate || 0),
          }));
            }
            setWeakAreas(weakData);

            if (lastSession) {
                const totalQ = lastSession.total_questions || 0;
                setRecentQuiz({
                    date: lastSession.ended_at ? new Date(lastSession.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'In progress',
                    score: lastSession.score || 0, total: totalQ,
                    accuracy: totalQ > 0 ? Math.min(100, Math.round(((lastSession.score || 0) / totalQ) * 100)) : 0,
                    quizType: quizTypeLabel(lastSession.quiz_type || ''),
                });
            }

            setLoading(false);
            if (badges) {
            const deduped = badges.filter((badge, index, self) => {
             if (badge.badge_id?.startsWith('streak')) {
            const streakBadges = self.filter((b: any) => b.badge_id?.startsWith('streak'));
            const highestStreak = streakBadges.sort((a: any, b: any) => {
                const aNum = parseInt(a.badge_id?.replace('streak_', '') || '0');
                const bNum = parseInt(b.badge_id?.replace('streak_', '') || '0');
                return bNum - aNum;
            })[0];
            return badge.badge_id === highestStreak.badge_id;
          }
            return true;
        });
           setRecentBadges(deduped.slice(0, 4));
     }

        };
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <style>{`@keyframes shimmer{to{transform:translateX(200%)}}`}</style>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-5">
                    <Shimmer className="h-36" /><Shimmer className="h-44" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><Shimmer className="h-48" /><Shimmer className="h-48" /></div>
                    <Shimmer className="h-32" />
                </div>
            </div>
        );
    }

    const xpIntoLevel = civiquestUser.xp % 500;
    const xpProgress = (xpIntoLevel / 500) * 100;
    const recentColor = accuracyColor(recentQuiz.accuracy);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <style>{`@keyframes shimmer{to{transform:translateX(200%)}}`}</style>
            {showLevelUp && <Confetti />}
            <AnimatePresence>
                {showLevelUp && (
                    <motion.div initial={{ opacity: 0, y: -40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-7 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl text-center backdrop-blur-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-0.5">Level Up!</p>
                        <p className="text-xl font-extrabold text-zinc-900 dark:text-white">Level {civiquestUser.level} 🎉</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div initial="hidden" animate="show" variants={staggerContainer} className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-5">

                {/* Welcome + XP card */}
                <motion.div variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 pt-6 pb-5">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Dashboard</p>
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Welcome back, {civiquestUser.username}!</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                {civiquestUser.pretestDone ? 'Your daily quiz is ready based on your weak areas.' : 'Start with the diagnostic pre-test to personalise your review.'}
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-300 uppercase tracking-wide">Streak</span>
                            <div className="flex items-center gap-1.5">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                                    const isFilled = i < (civiquestUser.streak % 7 || (civiquestUser.streak > 0 ? 7 : 0));
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-0.5">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isFilled ? 'text-white shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                                                style={isFilled ? { background: 'linear-gradient(135deg, #c03c0c 0%, #cc6d01 50%, #f1c02b 100%)' } : {}}>
                                                {isFilled ? <CheckCircle2 className="w-4 h-4" /> : day}
                                            </div>
                                            <span className="text-[9px] text-zinc-400 dark:text-zinc-400">{day}</span>
                                        </div>
                                    );  
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="px-6 pb-5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-semibold text-zinc-600 dark:text-zinc-400">Level {civiquestUser.level}</span>
                            <span className="tabular-nums text-zinc-400 dark:text-zinc-500">{xpIntoLevel.toLocaleString()} / 500 XP</span>
                        </div>
                        <ProgressBar value={xpProgress} colorClass="bg-blue-500" height="h-2" />
                    </div>
                </motion.div>

                {/* Exam Readiness */}
                <motion.div variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
                        <ReadinessRing value={civiquestUser.readiness} isDarkMode={isDarkMode} />
                        <div className="flex-1 text-center sm:text-left space-y-3">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Exam Readiness</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed max-w-sm">{readinessMessage(civiquestUser.readiness, civiquestUser.pretestDone)}</p>
                            <div className="flex gap-2.5 justify-center sm:justify-start flex-wrap">
                                <button onClick={() => navigate(civiquestUser.pretestDone ? '/quizzes?mode=daily' : '/pretest')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white transition-all duration-200 shadow-sm hover:shadow-md"><Zap className="w-4 h-4" />{civiquestUser.pretestDone ? 'Start Daily Quiz' : 'Take Pre-Test'}</button>
                                <button onClick={() => navigate('/lessons')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200"><BookOpen className="w-4 h-4" />Lessons</button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Weak Areas + Recent Quizzes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <motion.div variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800"><Target className="w-4 h-4 text-rose-500" /><h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Weak Areas</h3></div>
                        <div className="p-5">
                            {weakAreas.length === 0 ? (
                                <div className="flex flex-col items-center py-6 text-center gap-2">
                                    {civiquestUser.pretestDone ? <><CheckCircle2 className="w-7 h-7 text-emerald-500" /><p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">All weak areas resolved!</p></> : <><Target className="w-7 h-7 text-zinc-300 dark:text-zinc-600" /><p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Complete the pre-test</p></>}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {weakAreas.map((area) => {
                                        const col = weakColor(area.accuracy);
                                        return (
                                            <div key={area.category} className="space-y-1.5">
                                                <div className="flex items-center justify-between"><span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{area.category}</span><span className={`text-xs font-bold tabular-nums ${col.text}`}>{area.accuracy}%</span></div>
                                                <ProgressBar value={area.accuracy} colorClass={col.bar} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800"><TrendingUp className="w-4 h-4 text-emerald-500" /><h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Quizzes</h3></div>
                        <div className="p-5">
                            {recentQuiz.total === 0 ? (
                                <div className="flex flex-col items-center py-6 text-center gap-2"><TrendingUp className="w-7 h-7 text-zinc-300 dark:text-zinc-600" /><p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No quizzes yet</p></div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between"><span className="text-xs text-zinc-400 dark:text-zinc-500">Last Quiz</span><div className="text-right"><p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{recentQuiz.quizType || 'Quiz'}</p>{recentQuiz.date !== 'Not yet' && <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{recentQuiz.date}</p>}</div></div>
                                    <div className="flex items-center justify-between"><span className="text-xs text-zinc-400 dark:text-zinc-500">Score</span><span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">{recentQuiz.score}{recentQuiz.total > 0 && <span className="font-normal text-zinc-400">/{recentQuiz.total}</span>}</span></div>
                                    <div className="flex items-center justify-between"><span className="text-xs text-zinc-400 dark:text-zinc-500">Accuracy</span><span className={`text-xs font-bold px-2 py-0.5 rounded-md ${recentColor.badge}`}>{recentQuiz.accuracy}%</span></div>
                                    <ProgressBar value={recentQuiz.accuracy} colorClass={recentColor.bar} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Recent Achievements */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
           <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800"><Award className="w-4 h-4 text-amber-500" /><h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Achievements</h3></div>
            <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentBadges.length > 0 ? recentBadges.map((badge: any) => {
                const badgeIcon = badge.badge_id?.includes('streak') ? '🔥' :
                    badge.badge_id?.includes('perfect') ? '⭐' :
                    badge.badge_id?.includes('quiz') || badge.badge_id?.includes('pretest') ? '📚' :
                    badge.badge_id?.includes('night') ? '🌙' :
                    badge.badge_id?.includes('early') ? '🌅' :
                    badge.badge_id?.includes('level') ? '📈' :
                    badge.badge_id?.includes('battle') ? '⚔️' : '🏅';
                return (
                    <motion.div key={badge.badge_id} whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border text-center border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                        <span className="text-2xl">{badgeIcon}</span>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{badge.badge_name || badge.badge_id}</p>
                    </motion.div>
                );
            }) : (
                <div className="col-span-4 flex flex-col items-center py-4 text-center gap-2">
                    <Award className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Complete quizzes to earn badges!</p>
                </div>
            )}
        </div>
         </div>
       </motion.div>
      </motion.div>

            <Footer isDarkMode={isDarkMode} />
            {isProfileModalOpen && currentUserSession && (
                <ProfileModal onClose={() => setIsProfileModalOpen(false)} userId={currentUserSession}
                    initialUsername={civiquestUser.username} initialAvatarUrl={civiquestUser.avatarUrl}
                    memberSince={civiquestUser.created_at}
                    onProfileUpdated={(newUsername, newAvatarUrl) => { setCiviquestUser(prev => ({ ...prev, username: newUsername, avatarUrl: newAvatarUrl })); }} />
            )}

            <FloatingChatbot position="bottom-right" />
        </div>
    );
}

export default HomePage;