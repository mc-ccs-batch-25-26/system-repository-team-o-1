import React, { useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, RefreshCw, Trophy, Target } from 'lucide-react';
import { lessonContent, LessonItem, QuizQuestion } from '../../data/lessonContent';
import { supabase } from '../../supabase/supabaseClient';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; lightBg: string; border: string }> = {
  'Verbal Ability': { bg: 'bg-blue-500', text: 'text-blue-500', lightBg: 'bg-blue-100', border: 'border-blue-500' },
  'Quantitative Ability': { bg: 'bg-emerald-500', text: 'text-emerald-500', lightBg: 'bg-emerald-100', border: 'border-emerald-500' },
  'Logical Reasoning': { bg: 'bg-violet-500', text: 'text-violet-500', lightBg: 'bg-violet-100', border: 'border-violet-500' }
};

type Phase = 'INTRO' | 'CONTENT' | 'QUIZ' | 'RESULTS';

export const LessonContentScreen: React.FC = () => {
  const { isDarkMode } = useOutletContext<any>();
  const navigate = useNavigate();
  const { category, topic } = useParams<{ category: string, topic: string }>();

  const [phase, setPhase] = useState<Phase>('INTRO');
  
  // Content Phase State
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  
  // Quiz Phase State
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const categoryData = lessonContent.find(c => c.title === category);
  const topicData = categoryData?.topics.find(t => t.title === topic);
  const colors = CATEGORY_COLORS[category || ''] || CATEGORY_COLORS['Verbal Ability'];

  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200';
  const appBg = isDarkMode ? 'bg-zinc-900' : 'bg-zinc-50';

  if (!categoryData || !topicData) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center">
        <h1 className={`text-2xl font-bold ${textClass}`}>Topic not found</h1>
        <button onClick={() => navigate('/lessons')} className="mt-4 text-blue-500 hover:underline">
          Return to Subjects
        </button>
      </div>
    );
  }

  const items = topicData.items;
  const questions = topicData.quizQuestions;

  // AI Explanation fetch logic
  const fetchAiExplanation = async (question: string, wrongAnswer: string, correctAnswer: string) => {
    setIsAiLoading(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer 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`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [{
            role: "user",
            content: `A student answered "${wrongAnswer}" to the question "${question}". The correct answer is "${correctAnswer}". Briefly explain why the student's answer is incorrect and why the correct answer is right. Keep it simple, encouraging, and under 3 sentences.`
          }]
        })
      });
      const data = await response.json();
      setAiExplanation(data.choices[0].message.content);
    } catch (error) {
      setAiExplanation("Could not load explanation at this time. Focus on reviewing the correct answer!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuizAnswer = (option: string) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(option);
    const isCorrect = option === questions[currentQuizIndex].correctAnswer;
    
    if (isCorrect) {
      setQuizScore(s => s + 1);
    } else {
      setShowExplanation(true);
      fetchAiExplanation(
        questions[currentQuizIndex].question,
        option,
        questions[currentQuizIndex].correctAnswer
      );
    }
  };

  const nextQuizQuestion = () => {
    if (currentQuizIndex < questions.length - 1) {
      setCurrentQuizIndex(c => c + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setAiExplanation('');
    } else {
      finishLesson();
    }
  };

  const finishLesson = async () => {
    setPhase('RESULTS');
    // Save progress to Supabase or LocalStorage if needed
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Minimal logic: Insert or update performance
        const xpEarned = 50;
        await supabase.from('users').update({ xp: xpEarned }).eq('id', user.id); // pseudo-logic for XP
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`min-h-[85vh] flex flex-col ${appBg}`}>
      {/* Global Header */}
      <div className={`px-6 py-4 flex items-center border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <button 
          onClick={() => phase === 'INTRO' ? navigate(`/lessons/${encodeURIComponent(categoryData.title)}`) : setPhase('INTRO')}
          className={`p-2 -ml-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${subtextClass}`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className={`ml-2 text-xl font-bold ${textClass} flex-1 text-center pr-8`}>
          {topicData.title}
        </h1>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* --- INTRO PHASE --- */}
          {phase === 'INTRO' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className={`w-24 h-24 rounded-3xl ${colors.bg} bg-opacity-20 flex items-center justify-center`}>
                <Target className={`w-12 h-12 ${colors.text}`} />
              </div>
              <div>
                <h2 className={`text-4xl font-bold ${textClass} mb-4`}>{topicData.title}</h2>
                <p className={`text-lg ${subtextClass} max-w-2xl mx-auto`}>{topicData.description}</p>
              </div>
              
              <div className="flex gap-8 py-6">
                <div className="flex flex-col items-center">
                  <span className={`text-2xl font-bold ${textClass}`}>{items.length}</span>
                  <span className={`text-sm ${subtextClass} uppercase tracking-wider`}>Concepts</span>
                </div>
                <div className={`w-px h-12 ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`}></div>
                <div className="flex flex-col items-center">
                  <span className={`text-2xl font-bold ${textClass}`}>{questions.length}</span>
                  <span className={`text-sm ${subtextClass} uppercase tracking-wider`}>Questions</span>
                </div>
              </div>

              <button
                onClick={() => setPhase('CONTENT')}
                className={`px-12 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 ${colors.bg}`}
              >
                Start Learning
              </button>
            </motion.div>
          )}

          {/* --- CONTENT PHASE --- */}
          {phase === 'CONTENT' && items.length > 0 && (
            <motion.div 
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Progress */}
              <div className="mb-8">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className={subtextClass}>Concept {currentItemIndex + 1} of {items.length}</span>
                  <span className={colors.text}>{Math.round(((currentItemIndex + 1) / items.length) * 100)}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'} overflow-hidden`}>
                  <motion.div 
                    className={`h-full ${colors.bg}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentItemIndex + 1) / items.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Card */}
              <div className={`flex-1 ${cardBg} rounded-3xl border shadow-sm p-6 sm:p-10 flex flex-col`}>
                <div className="text-center mb-8">
                  <h2 className={`text-4xl sm:text-5xl font-extrabold ${textClass} mb-4`}>
                    {items[currentItemIndex].word}
                  </h2>
                  <p className={`text-lg sm:text-xl ${colors.text} font-medium max-w-2xl mx-auto`}>
                    {items[currentItemIndex].definition}
                  </p>
                </div>

                {/* Stacked Content Sections */}
                <div className="flex-1 flex flex-col gap-6 bg-transparent min-h-[150px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentItemIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col gap-6"
                    >
                      {/* Key Points */}
                      <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-zinc-900/50' : 'bg-zinc-50'}`}>
                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${colors.text}`}>Key Points</h3>
                        <ul className="space-y-3">
                          {items[currentItemIndex].keyPoints.slice(0, 3).map((pt, i) => (
                            <li key={i} className={`flex gap-3 text-lg leading-relaxed ${textClass}`}>
                              <CheckCircle2 className={`w-6 h-6 flex-shrink-0 ${colors.text} mt-0.5`} />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Simple Explanation */}
                      <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-zinc-900/50' : 'bg-zinc-50'}`}>
                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${colors.text}`}>Simple Explanation</h3>
                        <p className={`text-lg leading-relaxed ${textClass}`}>
                          {items[currentItemIndex].simpleExplanation}
                        </p>
                      </div>

                      {/* Example */}
                      <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${colors.text}`}>Example</h3>
                        <p className={`text-lg leading-relaxed italic ${textClass}`}>
                          "{items[currentItemIndex].example}"
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Nav Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setCurrentItemIndex(i => Math.max(0, i - 1))}
                    disabled={currentItemIndex === 0}
                    className={`flex-1 py-4 rounded-xl font-bold transition-colors border ${
                      currentItemIndex === 0
                        ? 'opacity-50 cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-700'
                        : `border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800`
                    }`}
                  >
                    Previous
                  </button>
                  {currentItemIndex < items.length - 1 ? (
                    <button
                      onClick={() => setCurrentItemIndex(i => i + 1)}
                      className={`flex-1 py-4 rounded-xl font-bold text-white transition-all hover:shadow-lg ${colors.bg}`}
                    >
                      Next Concept
                    </button>
                  ) : (
                    <button
                      onClick={() => setPhase('QUIZ')}
                      className="flex-1 py-4 rounded-xl font-bold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:scale-[1.02] transition-transform"
                    >
                      Start Quiz
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- QUIZ PHASE --- */}
          {phase === 'QUIZ' && questions.length > 0 && (
             <motion.div 
             key="quiz"
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="flex-1 flex flex-col"
           >
             <div className="mb-6">
               <div className="flex justify-between text-sm font-medium mb-2">
                 <span className={subtextClass}>Question {currentQuizIndex + 1} of {questions.length}</span>
                 <span className={colors.text}>Score: {quizScore}</span>
               </div>
               <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'} overflow-hidden`}>
                 <motion.div 
                   className={`h-full ${colors.bg}`}
                   initial={{ width: 0 }}
                   animate={{ width: `${((currentQuizIndex + 1) / questions.length) * 100}%` }}
                 />
               </div>
             </div>

             <div className={`flex-1 ${cardBg} rounded-3xl border shadow-sm p-6 sm:p-10 flex flex-col`}>
               <h3 className={`text-2xl font-bold ${textClass} mb-8`}>
                 {questions[currentQuizIndex].question}
               </h3>

               <div className="space-y-4 flex-1">
                 {questions[currentQuizIndex].options.map((opt, i) => {
                   const isSelected = selectedOption === opt;
                   const isCorrect = opt === questions[currentQuizIndex].correctAnswer;
                   const showStatus = selectedOption !== null;
                   
                   let btnStyle = `border-2 ${isDarkMode ? 'border-zinc-700 bg-zinc-800 text-white hover:border-zinc-500' : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400'}`;
                   
                   if (showStatus) {
                     if (isCorrect) {
                       btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
                     } else if (isSelected) {
                       btnStyle = 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
                     } else {
                       btnStyle = `opacity-50 border-zinc-200 dark:border-zinc-700 ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}`;
                     }
                   }

                   return (
                     <button
                       key={i}
                       onClick={() => handleQuizAnswer(opt)}
                       disabled={selectedOption !== null}
                       className={`w-full p-5 rounded-2xl text-left text-lg font-medium transition-all ${btnStyle} flex justify-between items-center`}
                     >
                       <span>{opt}</span>
                       {showStatus && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                       {showStatus && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500" />}
                     </button>
                   );
                 })}
               </div>

               <AnimatePresence>
                 {showExplanation && (
                   <motion.div
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="mt-6 overflow-hidden"
                   >
                     <div className={`p-5 rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/50`}>
                       <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                         <RefreshCw className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                         AI Explanation
                       </h4>
                       <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
                         {isAiLoading ? "Analyzing your answer..." : aiExplanation}
                       </p>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               {selectedOption && (
                 <motion.button
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   onClick={nextQuizQuestion}
                   className={`mt-8 w-full py-5 rounded-xl font-bold text-white text-lg ${colors.bg} hover:shadow-lg transition-all`}
                 >
                   {currentQuizIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                 </motion.button>
               )}
             </div>
           </motion.div>
          )}

          {/* --- RESULTS PHASE --- */}
          {phase === 'RESULTS' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className={`w-32 h-32 rounded-full ${colors.bg} bg-opacity-20 flex items-center justify-center mb-4 relative`}>
                <Trophy className={`w-16 h-16 ${colors.text}`} />
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 font-bold px-3 py-1 rounded-full text-sm shadow-md border-2 border-white dark:border-zinc-900">
                  +50 XP
                </div>
              </div>
              
              <div>
                <h2 className={`text-4xl font-bold ${textClass} mb-2`}>Lesson Complete!</h2>
                <p className={`text-xl ${subtextClass}`}>You mastered {topicData.title}</p>
              </div>
              
              <div className={`p-8 rounded-3xl ${cardBg} border shadow-sm w-full max-w-sm`}>
                <div className="text-6xl font-extrabold mb-2" style={{ color: `var(--${colors.text.split('-')[1]}-500, #3b82f6)` }}>
                  {Math.round((quizScore / questions.length) * 100)}%
                </div>
                <p className={`text-lg font-medium ${subtextClass}`}>
                  {quizScore} out of {questions.length} correct
                </p>
              </div>

              <div className="flex gap-4 w-full max-w-sm pt-4">
                <button
                  onClick={() => {
                    setPhase('INTRO');
                    setCurrentItemIndex(0);
                    setCurrentQuizIndex(0);
                    setQuizScore(0);
                    setSelectedOption(null);
                  }}
                  className={`flex-1 py-4 rounded-xl font-bold border-2 border-zinc-200 dark:border-zinc-700 ${textClass} hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors`}
                >
                  Review Again
                </button>
                <button
                  onClick={() => navigate(`/lessons/${encodeURIComponent(categoryData.title)}`)}
                  className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg ${colors.bg} hover:shadow-xl hover:-translate-y-0.5 transition-all`}
                >
                  Return to Topics
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default LessonContentScreen;
