import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, Star, ChevronRight, CheckCircle2 } from 'lucide-react';
import { lessonContent } from '../../data/lessonContent';
import { supabase } from '../../supabase/supabaseClient';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Verbal Ability': { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  'Numerical Ability': { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
  'Analytical Ability': { bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-500' },
  'General Information': { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' }
};

const DIFFICULTY_MAP: Record<number, { label: string; color: string; darkColor: string }> = {
  0: { label: 'Beginner', color: 'text-green-600', darkColor: 'dark:text-green-400' },
  1: { label: 'Intermediate', color: 'text-yellow-600', darkColor: 'dark:text-yellow-400' },
  2: { label: 'Advanced', color: 'text-red-600', darkColor: 'dark:text-red-400' },
};

export const TopicsListScreen: React.FC = () => {
  const { isDarkMode } = useOutletContext<any>();
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();

  const categoryData = lessonContent.find(c => c.title === category);
  const colors = CATEGORY_COLORS[category || ''] || CATEGORY_COLORS['Verbal Ability'];

  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  useEffect(() => {
    const fetchCompleted = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progress } = await supabase
          .from('lesson_progress')
          .select('topic_id')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (progress) {
          setCompletedTopics(progress.map(p => p.topic_id));
        }
      }
    };
    fetchCompleted();
  }, [category]);

  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300';

  if (!categoryData) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        <h1 className={`text-2xl font-bold ${textClass}`}>Category not found</h1>
        <button onClick={() => navigate('/lessons')} className="mt-4 text-blue-500 hover:underline">
          Return to Subjects
        </button>
      </div>
    );
  }

  const topics = categoryData.topics;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/lessons')}
          className={`p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${subtextClass}`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className={`text-3xl font-bold ${textClass}`}>{categoryData.title}</h1>
          <p className={`mt-1 ${subtextClass}`}>Complete each topic in order to unlock the next one</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((topic, index) => {
          const hasData = topic.items.length > 0;
          const isCompleted = completedTopics.includes(topic.id);
          const previousCompleted = index === 0 || completedTopics.includes(topics[index - 1]?.id);
          const isUnlocked = hasData && (index === 0 || previousCompleted || isCompleted);

          const difficultyLevel = index <= 1 ? 0 : index <= 3 ? 1 : 2;
          const diff = DIFFICULTY_MAP[difficultyLevel];

          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => isUnlocked && navigate(`/lessons/${encodeURIComponent(categoryData.title)}/${encodeURIComponent(topic.title)}`)}
              className={`${cardBg} rounded-2xl border p-6 transition-all duration-200 relative overflow-hidden
                ${isUnlocked ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : 'opacity-60 cursor-not-allowed'}
              `}
            >
              {/* Completed badge */}
              {isCompleted && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-xl font-bold ${textClass} ${!isUnlocked && !isCompleted ? 'pr-8' : ''}`}>{topic.title}</h3>
                {!hasData && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isDarkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-100 text-zinc-500'}`}>
                    Coming Soon
                  </span>
                )}
                {!isUnlocked && hasData && !isCompleted && (
                  <Lock className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                )}
              </div>
              
              <p className={`text-sm mb-6 line-clamp-2 ${subtextClass}`}>
                {topic.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-4">
                  <div className={`text-sm font-medium ${isUnlocked ? colors.text : subtextClass}`}>
                    {hasData ? `${topic.items.length} Items` : '0 Items'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className={`w-4 h-4 ${isCompleted ? 'text-amber-400 fill-amber-400' : isUnlocked ? 'text-amber-400' : 'text-zinc-300'}`} />
                    <span className={`text-sm font-medium ${diff.color} ${diff.darkColor}`}>
                      {diff.label}
                    </span>
                  </div>
                </div>
                
                {isCompleted ? (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    Completed ✓
                  </span>
                ) : isUnlocked ? (
                  <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                ) : (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                    Locked
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicsListScreen;