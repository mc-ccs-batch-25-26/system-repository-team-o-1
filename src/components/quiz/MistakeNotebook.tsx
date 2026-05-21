import { useState, useEffect } from 'react';
import { ArrowLeft, BookMarked, RefreshCw, Lightbulb, Filter, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMistakes, SavedMistake } from '../../data/mockQuestions';
import { CATEGORIES } from '../../data/mockQuestions';

interface MistakeNotebookProps {
  isDarkMode: boolean;
  onBack: () => void;
}

const MistakeNotebook = ({ isDarkMode, onBack }: MistakeNotebookProps) => {
  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300';

  const [mistakes, setMistakes] = useState<SavedMistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [retryMode, setRetryMode] = useState(false);
  const [retryIndex, setRetryIndex] = useState(0);
  const [retryAnswers, setRetryAnswers] = useState<Record<string, string>>({});
  const [retryScore, setRetryScore] = useState(0);
  const [retryFinished, setRetryFinished] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState<string | null>(null);

  useEffect(() => {
    fetchMistakes();
  }, []);

  const fetchMistakes = () => {
    setLoading(true);
    const data = getMistakes();
    setMistakes(data);
    setLoading(false);
  };

  const getAIExplanation = async (mistake: SavedMistake) => {
    if (aiExplanations[mistake.id]) return;
    setLoadingAI(mistake.id);
    try {
      const apiKey = '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';
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CiviQuest'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [{
            role: 'system',
            content: 'You are a Civil Service Exam tutor. Explain in 2-3 sentences why the answer is correct and why the user\'s choice was wrong. Be concise and helpful.'
          }, {
            role: 'user',
            content: `Question: ${mistake.question_text}\nOptions: ${mistake.options.join(', ')}\nCorrect answer: ${mistake.correct_answer}\nMy wrong answer: ${mistake.selected_answer}\nPlease explain.`
          }]
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || `The correct answer is "${mistake.correct_answer}".`;
      setAiExplanations(prev => ({ ...prev, [mistake.id]: text }));
    } catch {
      setAiExplanations(prev => ({ ...prev, [mistake.id]: `The correct answer is "${mistake.correct_answer}". Review this topic to improve.` }));
    } finally {
      setLoadingAI(null);
    }
  };

  const filteredMistakes = filterCategory === 'All'
    ? mistakes
    : mistakes.filter(m => m.category_name === filterCategory);

  // Retry mode
  const startRetry = () => {
    if (filteredMistakes.length === 0) return;
    setRetryMode(true);
    setRetryIndex(0);
    setRetryAnswers({});
    setRetryScore(0);
    setRetryFinished(false);
  };

  const handleRetryAnswer = (questionId: string, selected: string) => {
    if (retryAnswers[questionId]) return;
    const mistake = filteredMistakes[retryIndex];
    const isCorrect = selected === mistake.correct_answer;
    setRetryAnswers(prev => ({ ...prev, [questionId]: selected }));
    if (isCorrect) setRetryScore(prev => prev + 1);
  };

  const nextRetryQuestion = () => {
    if (retryIndex < filteredMistakes.length - 1) {
      setRetryIndex(prev => prev + 1);
    } else {
      setRetryFinished(true);
    }
  };

  // Category counts
  const categoryCounts: Record<string, number> = {};
  mistakes.forEach(m => {
    categoryCounts[m.category_name] = (categoryCounts[m.category_name] || 0) + 1;
  });

  // RETRY MODE
  if (retryMode) {
    if (retryFinished) {
      return (
        <div className="w-full max-w-md mx-auto px-4 py-8 space-y-5">
          <div className="text-center space-y-1">
            <h1 className={`text-2xl font-bold ${textClass}`}>Retry Complete! 💪</h1>
            <p className={`text-sm ${subtextClass}`}>Here's how you improved</p>
          </div>

          <div className={`${cardBg} rounded-2xl border p-7 text-center shadow-sm`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>Retry Score</p>
            <div className="text-6xl font-bold text-emerald-500 mt-2 mb-2">{retryScore}<span className={`text-2xl ${subtextClass}`}>/{filteredMistakes.length}</span></div>
            <p className={`text-sm font-medium ${subtextClass}`}>Previously Wrong → Now Correct</p>
            
            <div className={`w-full rounded-full h-2.5 overflow-hidden mt-5 ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(retryScore / filteredMistakes.length) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-2.5 rounded-full bg-emerald-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setRetryMode(false); }} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors`}>
              Back to Notebook
            </button>
            <button onClick={onBack} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm border transition-colors ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}>
              Back to Hub
            </button>
          </div>
        </div>
      );
    }

    const currentMistake = filteredMistakes[retryIndex];
    const answered = retryAnswers[currentMistake.question_id] !== undefined;

    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
        <button onClick={() => setRetryMode(false)} className={`flex items-center gap-2 text-sm font-medium ${subtextClass} hover:${textClass} transition-colors`}>
          <ArrowLeft className="w-4 h-4" /> Exit Retry
        </button>

        <div className="space-y-2">
          <div className={`flex justify-between text-xs font-medium ${subtextClass}`}>
            <span>Retrying {retryIndex + 1} of {filteredMistakes.length}</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isDarkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
              Retry Mode
            </span>
          </div>
          <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`}>
            <motion.div
              animate={{ width: `${((retryIndex + 1) / filteredMistakes.length) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full bg-emerald-500"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentMistake.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`${cardBg} rounded-2xl p-6 md:p-8 border shadow-sm`}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {currentMistake.category_name}
              </span>
            </div>
            <h3 className={`text-lg md:text-xl font-semibold mt-2 mb-8 ${textClass} leading-relaxed`}>
              {retryIndex + 1}. {currentMistake.question_text}
            </h3>

            <div className="space-y-3">
              {currentMistake.options.map(option => {
                const isSelected = retryAnswers[currentMistake.question_id] === option;
                const isCorrect = option === currentMistake.correct_answer;
                const showResult = answered;

                return (
                  <button
                    key={option}
                    onClick={() => handleRetryAnswer(currentMistake.question_id, option)}
                    disabled={answered}
                    className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                      showResult && isCorrect
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20'
                        : showResult && isSelected && !isCorrect
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                        : `border-zinc-300 dark:border-zinc-700 ${!answered ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800' : ''}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`${textClass} ${showResult && isCorrect ? 'font-medium text-emerald-700 dark:text-emerald-300' : ''} ${showResult && isSelected && !isCorrect ? 'text-red-700 dark:text-red-300' : ''}`}>
                        {option}
                      </span>
                      {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {answered && (
          <div className="pt-2">
            <button onClick={nextRetryQuestion} className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors`}>
              {retryIndex < filteredMistakes.length - 1 ? 'Next Question' : 'Finish Retry'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // MAIN NOTEBOOK VIEW
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button onClick={onBack} className={`flex items-center gap-2 text-sm ${subtextClass} hover:${textClass} transition-colors`}>
        <ArrowLeft className="w-4 h-4" /> Back to Quiz Hub
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-3xl font-bold ${textClass} flex items-center gap-2`}>
            <BookMarked className="w-8 h-8 text-emerald-500" />
            Mistake Notebook
          </h1>
          <p className={`mt-1 ${subtextClass}`}>Review and retry your past wrong answers</p>
        </div>

        {filteredMistakes.length > 0 && (
          <button
            onClick={startRetry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Retry All ({filteredMistakes.length})
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {['All', ...CATEGORIES].map(cat => {
          const count = cat === 'All' ? mistakes.length : (categoryCounts[cat] || 0);
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                filterCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : `${isDarkMode ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800'}`
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredMistakes.length === 0 && (
        <div className={`${cardBg} rounded-2xl p-12 border text-center`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${subtextClass}`} />
          <h3 className={`text-lg font-semibold ${textClass}`}>No mistakes yet!</h3>
          <p className={`mt-2 ${subtextClass}`}>
            {filterCategory === 'All'
              ? 'Take some quizzes and any wrong answers will appear here for review.'
              : `No wrong answers in ${filterCategory}. Try another category.`
            }
          </p>
        </div>
      )}

      {/* Mistake list */}
      {!loading && filteredMistakes.length > 0 && (
        <div className="space-y-3">
          {filteredMistakes.map((mistake, index) => {
            const isExpanded = expandedId === mistake.id;
            return (
              <motion.div
                key={mistake.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`${cardBg} rounded-xl border overflow-hidden transition-all`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : mistake.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${textClass} line-clamp-2`}>{mistake.question_text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                          {mistake.category_name}
                        </span>
                        <span className={`text-xs ${subtextClass}`}>
                          {new Date(mistake.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`px-5 pb-5 pt-3 border-t ${isDarkMode ? 'border-zinc-700/50' : 'border-zinc-300'}`}>
                        <div className="space-y-2 mb-4">
                          <div className={`flex items-start gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-red-900/10' : 'bg-red-50/50'}`}>
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass} block mb-0.5`}>Your answer</span>
                              <span className="text-red-600 dark:text-red-400 font-medium text-sm">{mistake.selected_answer}</span>
                            </div>
                          </div>
                          <div className={`flex items-start gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-emerald-900/10' : 'bg-emerald-50/50'}`}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass} block mb-0.5`}>Correct answer</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">{mistake.correct_answer}</span>
                            </div>
                          </div>
                        </div>

                        {/* AI Explanation */}
                        {aiExplanations[mistake.id] ? (
                          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/10 border border-blue-800/30' : 'bg-blue-50/50 border border-blue-100'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">AI Explanation</span>
                            </div>
                            <p className={`text-sm leading-relaxed ${textClass}`}>{aiExplanations[mistake.id]}</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => getAIExplanation(mistake)}
                            disabled={loadingAI === mistake.id}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                              isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                            }`}
                          >
                            {loadingAI === mistake.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                Generating explanation...
                              </>
                            ) : (
                              <>
                                <Lightbulb className="w-4 h-4 text-blue-500" />
                                Get AI Explanation
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MistakeNotebook;