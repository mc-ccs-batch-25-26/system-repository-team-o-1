import { TrendingDown, BookOpen, MessageSquare, ArrowRight } from 'lucide-react';

interface SmartRecommendationProps {
  weakestCategory: string;
  weakestAccuracy: number;
  onStartPractice: (category: string) => void;
  onOpenAIReview: (category: string) => void;
  isDarkMode: boolean;
}

const SmartRecommendation = ({
  weakestCategory,
  weakestAccuracy,
  onStartPractice,
  onOpenAIReview,
  isDarkMode,
}: SmartRecommendationProps) => {
  const cardBg = isDarkMode
    ? 'bg-amber-900/10 border-amber-700/30'
    : 'bg-amber-50/50 border-amber-200/50';
  const textClass = isDarkMode ? 'text-amber-50' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-amber-200/70' : 'text-zinc-600';

  return (
    <div className={`${cardBg} rounded-2xl p-6 border shadow-sm`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <TrendingDown className="w-5 h-5 text-amber-500" />
        </div>
        <h3 className={`text-lg font-bold ${textClass}`}>Smart Recommendation</h3>
      </div>

      <div className="mb-4">
        <p className={`text-sm ${subtextClass}`}>Your weakest area:</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xl font-bold ${textClass}`}>{weakestCategory}</span>
          <span className="text-sm font-semibold text-red-500">({Math.round(weakestAccuracy)}%)</span>
        </div>
      </div>

      <div className="space-y-2 mt-6 pt-5 border-t border-amber-500/10">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${subtextClass} mb-2`}>Recommended Action</p>

        <button
          onClick={() => onStartPractice(weakestCategory)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
            isDarkMode
              ? 'bg-amber-900/20 border-amber-700/50 hover:bg-amber-900/40 text-amber-100'
              : 'bg-white border-amber-200 hover:bg-amber-50 text-zinc-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span className={`text-sm font-semibold`}>
              Practice {weakestCategory}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-500/50" />
        </button>

        <button
          onClick={() => onOpenAIReview(weakestCategory)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
            isDarkMode
              ? 'bg-amber-900/20 border-amber-700/50 hover:bg-amber-900/40 text-amber-100'
              : 'bg-white border-amber-200 hover:bg-amber-50 text-zinc-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            <span className={`text-sm font-semibold`}>
              AI Review Session
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-500/50" />
        </button>
      </div>
    </div>
  );
};

export default SmartRecommendation;
