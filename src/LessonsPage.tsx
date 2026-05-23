import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { BookOpen, Hash, Brain, Lightbulb, ChevronRight, CheckCircle2, Circle, TrendingUp, Library, Target, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from './supabase/supabaseClient';

interface CategoryProgress {
  name: string;
  total: number;
  completed: number;
  accuracy: number;
}

const FLASHCARD_TOTALS: Record<string, number> = {
  'Verbal Ability': 50,
  'Numerical Ability': 50,
  'Analytical Ability': 50,
  'General Information': 50,
};

const CATEGORY_CONFIG: Record<string, {
  icon: React.ReactNode;
  description: string;
  accentBg: string;
  accentText: string;
  barColor: string;
  borderAccent: string;
  modules: string[];
  startLabel: string;
}> = {
  'Verbal Ability': {
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Grammar · Vocabulary · Reading Comprehension · Analogy',
    accentBg: 'bg-blue-50 dark:bg-blue-900/30',
    accentText: 'text-blue-600 dark:text-blue-400',
    barColor: 'bg-blue-500',
    borderAccent: 'border-l-blue-9  00',
    modules: ['Grammar rules', 'Vocabulary builder', 'Reading speed', 'Word analogies'],
    startLabel: 'Continue',
  },
  'Numerical Ability': {
    icon: <Hash className="w-5 h-5" />,
    description: 'Arithmetic · Algebra · Number Series · Data Interpretation',
    accentBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    barColor: 'bg-emerald-500',
    borderAccent: 'border-l-emerald-900',
    modules: ['Basic arithmetic', 'Word problems', 'Number series', 'Fractions & ratios'],
    startLabel: 'Start now',
  },
  'Analytical Ability': {
    icon: <Brain className="w-5 h-5" />,
    description: 'Patterns · Deduction · Analogies · Critical Thinking',
    accentBg: 'bg-violet-50 dark:bg-violet-900/30',
    accentText: 'text-violet-600 dark:text-violet-400',
    barColor: 'bg-violet-500',
    borderAccent: 'border-l-violet-900',
    modules: ['Pattern recognition', 'Syllogisms', 'Logical deduction', 'Critical analysis'],
    startLabel: 'Continue',
  },
  'General Information': {
    icon: <Globe className="w-5 h-5" />,
    description: 'Philippine Constitution · RA 6713 · Environmental Laws',
    accentBg: 'bg-amber-50 dark:bg-amber-900/30',
    accentText: 'text-amber-600 dark:text-amber-400',
    barColor: 'bg-amber-500',
    borderAccent: 'border-l-amber-900',
    modules: ['Constitution basics', 'Ethics across public service', 'Current events'],
    startLabel: 'Start now',
  }
};

const getStatus = (pct: number) => {
  if (pct >= 70) return { label: 'Mastered', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' };
  if (pct >= 10) return { label: 'In Progress', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' };
  return { label: 'Not Started', cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400' };
};

const LessonsPage: React.FC = () => {
  const { isDarkMode } = useOutletContext<any>();
  const navigate = useNavigate();
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([
    { name: 'Verbal Ability', total: 50, completed: 0, accuracy: 0 },
    { name: 'Numerical Ability', total: 50, completed: 0, accuracy: 0 },
    { name: 'Analytical Ability', total: 50, completed: 0, accuracy: 0 },
    { name: 'General Information', total: 50, completed: 0, accuracy: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: perf } = await supabase
          .from('performance')
          .select('accuracy_rate, total_answered, total_correct, category_id')
          .eq('user_id', user.id);

        const { data: categories } = await supabase.from('categories').select('id, name');

        const updated = Object.entries(FLASHCARD_TOTALS).map(([name, total]) => {
          const category = categories?.find(c => c.name === name);
          const perfData = perf?.find(p => p.category_id === category?.id);
          return {
            name,
            total,
            completed: Math.min(perfData?.total_answered || 0, total),
            accuracy: Math.round(perfData?.accuracy_rate || 0),
          };
        });

        setCategoryProgress(updated);
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const totalCompleted = categoryProgress.reduce((s, c) => s + c.completed, 0);
  const totalItems = categoryProgress.reduce((s, c) => s + c.total, 0);
  const overallPct = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  const avgAccuracy = categoryProgress.filter(c => c.accuracy > 0).length > 0
    ? Math.round(categoryProgress.filter(c => c.accuracy > 0).reduce((s, c) => s + c.accuracy, 0) / categoryProgress.filter(c => c.accuracy > 0).length)
    : 0;

  const recommended = [...categoryProgress].sort((a, b) => {
    if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
    return a.completed - b.completed;
  })[0];

  const textClass = isDarkMode ? 'text-white' : 'text-zinc-800';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300';
  const trackBg = isDarkMode ? 'bg-zinc-700' : 'bg-zinc-100';

  return (  
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${textClass}`}>Study Materials</h1>
        <p className={`mt-1 ${subtextClass}`}>Structured learning modules for the Civil Service Exam</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { 
            label: 'Overall progress', 
            value: `${overallPct}%`, 
            sub: `${totalCompleted} of ${totalItems} completed`,
            colorClasses: isDarkMode ? 'bg-blue-900/10 border-blue-800/30' : 'bg-blue-50/50 border-blue-100',
            icon: (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <TrendingUp className="w-6 h-6" />
              </div>
            )
          },
          { 
            label: 'Lessons done', 
            value: `${categoryProgress.filter(c => c.completed > 0).length}`, 
            sub: 'across 4 subjects',
            colorClasses: isDarkMode ? 'bg-violet-900/10 border-violet-800/30' : 'bg-violet-50/50 border-violet-100',
            icon: (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-violet-900/40 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                <Library className="w-6 h-6" />
              </div>
            )
          },
          { 
            label: 'Avg. accuracy', 
            value: avgAccuracy > 0 ? `${avgAccuracy}%` : '—', 
            sub: 'based on quizzes',
            colorClasses: isDarkMode ? 'bg-emerald-900/10 border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-100',
            icon: (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                <Target className="w-6 h-6" />
              </div>
            )
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${stat.colorClasses} rounded-xl p-5 border flex items-center justify-between gap-4`}
          >
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass} mb-1`}>{stat.label}</p>
              <p className={`text-2xl font-bold ${textClass}`}>{stat.value}</p>
              <p className={`text-xs mt-0.5 ${subtextClass}`}>{stat.sub}</p>
            </div>
            {stat.icon}
          </motion.div>
        ))}
      </div>

      {/* Recommended Banner */}
      {!loading && recommended && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate(`/lessons/${encodeURIComponent(recommended.name)}`)}
          className={`rounded-xl border cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${
            isDarkMode
              ? 'bg-amber-700/40 border-amber-600/50 hover:border-amber-800/60'
              : 'bg-amber-50 border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-0.5">
                Recommended next
              </p>
              <p className={`text-base font-bold ${textClass}`}>{recommended.name}</p>
              <p className={`text-sm ${subtextClass} mt-0.5`}>
                {recommended.accuracy > 0
                  ? `${recommended.accuracy}% accuracy — review these lessons to improve`
                  : 'Start here to build your foundation'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-500 flex-shrink-0" />
          </div>
        </motion.div>
      )}

      {/* Subject Cards */}
      <div className="space-y-5">
        <p className={`text-xs font-bold uppercase tracking-wider ${subtextClass}`}>All subjects</p>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-5 border-blue-400" />
          </div>
        ) : (
          categoryProgress.map((cat, index) => {
            const pct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
            const status = getStatus(pct);
            const cfg = CATEGORY_CONFIG[cat.name];
            const iconBg = cat.name === 'Verbal Ability'
             ? isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
              : cat.name === 'Numerical Ability'
              ? isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
              : cat.name === 'Analytical Ability'
              ? isDarkMode ? 'bg-violet-900/50 text-violet-400' : 'bg-violet-100 text-violet-600'
              : isDarkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-600';

            return (
                 <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                onClick={() => navigate(`/lessons/${encodeURIComponent(cat.name)}`)}
                className={`rounded-xl border p-5 cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
                  isDarkMode ? 'bg-gray-500/10 border-gray-500/30' : 'bg-gray-50/50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    {cfg?.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-lg font-bold ${textClass} truncate`}>{cat.name}</h3>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.cls} whitespace-nowrap`}>
                        {status.label}
                      </span>
                    </div>  
                    
                    <p className={`text-sm mb-3 truncate ${subtextClass}`}>{cfg?.description}</p>
                    
                    {/* Modules Row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(cfg?.modules || []).map((mod, mi) => {
                        const done = mi < Math.ceil((pct / 100) * (cfg?.modules.length || 4));
                        return (
                          <div
                            key={mod}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                              done
                                ? isDarkMode
                                  ? 'bg-gray-800/30 border-gray-700 text-white-300'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                                : isDarkMode
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-500'
                                : 'bg-white border-zinc-200 text-zinc-400'
                            }`}
                          >
                            {done
                              ? <CheckCircle2 className="w-3 h-3 text-blue-500" />
                              : <Circle className="w-3 h-3 text-zinc-400" />
                            }
                            {mod}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className={`flex-1 ${trackBg} rounded-full h-2 overflow-hidden`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
                          className={`h-full rounded-full ${cfg?.barColor || 'bg-gray-500'}`}
                        />
                      </div>
                      <span className={`text-xs font-bold ${textClass} w-9 text-right`}>{pct}%</span>
                    </div>
                    
                    {/* Footer */}
                    <div className="mt-2">
                      <p className={`text-xs ${subtextClass}`}>
                        {cat.completed}/{cat.total} items
                        {cat.accuracy > 0 && <span className="ml-2">· {cat.accuracy}% accuracy</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`p-2 rounded-full flex-shrink-0 ml-2 ${isDarkMode ? 'bg-gray-600/30 text-gray-400 group-hover:bg-gray-600 group-hover:text-white' : 'bg-gray-50 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-600'} transition-colors`}>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LessonsPage;