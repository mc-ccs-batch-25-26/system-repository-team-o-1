import React from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, Star, ChevronRight } from 'lucide-react';
import { lessonContent } from '../../data/lessonContent';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Verbal Ability': { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  'Quantitative Ability': { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
  'Logical Reasoning': { bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-500' }
};

export const TopicsListScreen: React.FC = () => {
  const { isDarkMode } = useOutletContext<any>();
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();

  const categoryData = lessonContent.find(c => c.title === category);
  const colors = CATEGORY_COLORS[category || ''] || CATEGORY_COLORS['Verbal Ability'];

  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200';

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
          <p className={`mt-1 ${subtextClass}`}>Select a topic to start learning</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categoryData.topics.map((topic, index) => {
          const hasData = topic.items.length > 0;
          
          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => hasData && navigate(`/lessons/${encodeURIComponent(categoryData.title)}/${encodeURIComponent(topic.title)}`)}
              className={`${cardBg} rounded-2xl border p-6 transition-all duration-200 
                ${hasData ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : 'opacity-75 cursor-not-allowed'}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-xl font-bold ${textClass}`}>{topic.title}</h3>
                {!hasData && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isDarkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-100 text-zinc-500'}`}>
                    Coming Soon
                  </span>
                )}
              </div>
              
              <p className={`text-sm mb-6 line-clamp-2 ${subtextClass}`}>
                {topic.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-4">
                  <div className={`text-sm font-medium ${hasData ? colors.text : subtextClass}`}>
                    {hasData ? `${topic.items.length} Items` : '0 Items'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className={`w-4 h-4 ${hasData ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'}`} />
                    <span className={`text-sm font-medium ${subtextClass}`}>
                      Difficulty: {['Beginner', 'Intermediate', 'Advanced'][index % 3]}
                    </span>
                  </div>
                </div>
                
                {hasData ? (
                  <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                ) : (
                  <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>
                    <Lock className="w-5 h-5" />
                  </div>
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
