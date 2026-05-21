import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import AnalyticsGraph from '../components/AnalyticsGraph';
import { getCategoryPerformanceData, CategoryPerformance } from '../firebase/analyticsService';
import { supabase } from '../supabase/supabaseClient';
import { Lightbulb, Zap, Flame, TrendingUp, TrendingDown, Award } from 'lucide-react';

const ProgressPage = () => {
    const { isDarkMode } = useOutletContext<any>();
    const [categoryData, setCategoryData] = useState<CategoryPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [xpTotal, setXpTotal] = useState(0);
    const [streakDays, setStreakDays] = useState(0);
    const [userLevel, setUserLevel] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // Fetch category performance
            const data = await getCategoryPerformanceData();
            const sortedData = [...data].sort((a, b) => b.accuracy - a.accuracy);
            setCategoryData(sortedData);

            // Fetch user XP and streak
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
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    const sorted = [...categoryData].sort((a, b) => a.accuracy - b.accuracy);
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];

    const cardBgClass = isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-300";
    const textClass = isDarkMode ? "text-white" : "text-zinc-900";
    const secondaryTextClass = isDarkMode ? "text-zinc-400" : "text-zinc-500";
    const barBg = isDarkMode ? "bg-zinc-800" : "bg-zinc-100";

    return (
        <div className="flex flex-col w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className={`text-3xl font-bold ${textClass}`}>Your Learning Progress</h1>
                <p className={`mt-2 ${secondaryTextClass}`}>
                    Track your accuracy and performance across all subjects.
                </p>
            </div>

            {/* XP & Streak Widget */}
            {!loading && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border ${cardBgClass} shadow-sm flex items-center gap-3`}>
                        <div className="p-2.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                            <Zap className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className={`text-xs ${secondaryTextClass}`}>Total XP</p>
                            <p className={`text-xl font-bold ${textClass}`}>{xpTotal.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${cardBgClass} shadow-sm flex items-center gap-3`}>
                        <div className="p-2.5 rounded-full bg-orange-100 dark:bg-orange-900/30">
                            <Flame className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className={`text-xs ${secondaryTextClass}`}>Current Streak</p>
                            <p className={`text-xl font-bold ${textClass}`}>{streakDays} day{streakDays !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${cardBgClass} shadow-sm flex items-center gap-3`}>
                        <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <Award className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className={`text-xs ${secondaryTextClass}`}>Level</p>
                            <p className={`text-xl font-bold ${textClass}`}>{userLevel}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Adaptive Insights */}
            {!loading && categoryData.length > 0 && weakest && strongest && (
                <div className={`p-6 rounded-xl border ${cardBgClass} shadow-sm`}>
                    <h2 className={`text-lg font-semibold mb-4 ${textClass} flex items-center gap-2`}>
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        Adaptive Insights
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingDown className="w-4 h-4 text-red-500" />
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Weakest Area</p>
                            </div>
                            <p className={`text-lg font-bold ${textClass}`}>{weakest.categoryName}</p>
                            <p className="text-sm text-red-500">{weakest.accuracy}% accuracy</p>
                        </div>
                        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Strongest Area</p>
                            </div>
                            <p className={`text-lg font-bold ${textClass}`}>{strongest.categoryName}</p>
                            <p className="text-sm text-emerald-500">{strongest.accuracy}% accuracy</p>
                        </div>
                    </div>
                    <p className={`text-sm ${secondaryTextClass}`}>
                        💡 <span className="font-medium">Recommendation:</span> Focus on{' '}
                        <span className="font-semibold text-red-500">{weakest.categoryName}</span> — 
                        your lowest performing category. Use flashcards and practice quizzes to improve.
                    </p>
                </div>
            )}

            {/* Performance Overview */}
            <div className={`p-6 rounded-xl border ${cardBgClass} shadow-sm`}>
                <h2 className={`text-xl font-semibold mb-6 ${textClass}`}>Performance Overview</h2>
                <AnalyticsGraph isDarkMode={isDarkMode} />
            </div>

            {/* Subject Breakdown */}
            <div className={`p-6 rounded-xl border ${cardBgClass} shadow-sm`}>
                <h2 className={`text-xl font-semibold mb-6 ${textClass}`}>Subject Breakdown</h2>

                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : categoryData.length === 0 ? (
                    <div className={`text-center py-8 ${secondaryTextClass}`}>
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No quiz data available yet. Take some quizzes to see your subject breakdown!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {categoryData.map((category) => (
                            <div key={category.categoryId} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className={`font-medium ${textClass}`}>{category.categoryName}</h3>
                                        <p className={`text-sm ${secondaryTextClass}`}>
                                            {category.totalCorrect} of {category.totalAnswered} correct
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${textClass}`}>
                                            {category.accuracy}%
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            category.accuracy >= 90 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            category.accuracy >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            category.accuracy >= 40 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {category.accuracy >= 90 ? 'Mastered' : 
                                             category.accuracy >= 70 ? 'Proficient' : 
                                             category.accuracy >= 40 ? 'Developing' : 'Needs Work'}
                                        </span>
                                    </div>
                                </div>
                                <div className={`w-full h-3 rounded-full overflow-hidden ${barBg}`}>
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            category.accuracy >= 70 ? 'bg-emerald-500' :
                                            category.accuracy >= 40 ? 'bg-blue-500' :
                                            'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(Math.max(category.accuracy, 0), 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressPage;