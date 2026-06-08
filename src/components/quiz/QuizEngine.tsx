import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Lightbulb, BookOpen } from 'lucide-react';
import { MockQuestion } from '../../data/mockQuestions';

interface QuizEngineProps {
  question: MockQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onAnswer: (questionId: string, selected: string) => void;
  showFeedback: boolean;        
  showAIExplanation: boolean;   
  aiExplanationText: string;
  loadingAI: boolean;
  isDarkMode: boolean;
}

const CATEGORY_COLORS: Record<string, { pill: string }> = {
'Verbal Ability':       { pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
'Numerical Ability':    { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
'Analytical Ability':   { pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
'General Information':  { pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

const QuizEngine = ({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswer,
  showFeedback,
  showAIExplanation,
  aiExplanationText,
  loadingAI,
  isDarkMode,
}: QuizEngineProps) => {
  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const cardBg = isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200';
  const answered = selectedAnswer !== null;

  const catCol = CATEGORY_COLORS[question.category] || { pill: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className={`${cardBg} rounded-2xl p-6 md:p-8 border shadow-sm space-y-6`}
      >
        {/* Category & Difficulty badges */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catCol.pill}`}>
            {question.category}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            question.difficulty === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
            question.difficulty === 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {question.difficulty === 1 ? 'Easy' : question.difficulty === 2 ? 'Medium' : 'Hard'}
          </span>
        </div>

        {/* Question text */}
        <h3 className={`text-base md:text-lg font-semibold leading-relaxed ${textClass}`}>
          {questionIndex + 1}. {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === question.correct;
            const showResult = answered && showFeedback;

            return (
              <motion.button
                key={option} 
                whileHover={!answered ? { scale: 1.01 } : {}}
                whileTap={!answered ? { scale: 0.99 } : {}}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                onClick={() => !answered && onAnswer(question.id, option)}
                disabled={answered}
                className={`w-full text-left px-5 py-4 rounded-xl border text-sm transition-all duration-200 ${
                  showResult && isCorrect
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200'
                    : showResult && isSelected && !isCorrect
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    : !showFeedback && isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 ring-1 ring-blue-500'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 ring-1 ring-blue-500'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium leading-relaxed pr-4">{option}</span>
                  {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* AI Explanation */}
        <AnimatePresence>
          {showAIExplanation && answered && showFeedback && selectedAnswer !== question.correct && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className={`w-4 h-4 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>AI Explanation</span>
                </div>
                {loadingAI ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-500" />
                    <p className={`text-sm ${isDarkMode ? 'text-amber-500/70' : 'text-amber-700/70'}`}>Generating explanation...</p>
                  </div>
                ) : (
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-amber-100' : 'text-amber-900'}`}>{aiExplanationText}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Source / Reference Proof */}
        {answered && showFeedback && question.source && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-xl text-sm border flex items-start gap-3 ${
              isDarkMode ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}
          >
            <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest text-[10px] mb-1">
                Reference / Source
              </p>
              <p>{question.source}</p>
              {question.source_type && (
                <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                  {question.source_type.replace('_', ' ')}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default QuizEngine;
