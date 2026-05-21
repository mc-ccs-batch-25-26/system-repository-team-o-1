import React, { useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, XCircle, RefreshCw, Trophy, Target } from 'lucide-react';
import { lessonContent } from '../../data/lessonContent';
import { supabase } from '../../supabase/supabaseClient';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; lightBg: string; border: string; chip: string; chipText: string }> = {
  'Verbal Ability': {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50',
    border: 'border-blue-500',
    chip: 'bg-blue-50 dark:bg-blue-950/40',
    chipText: 'text-blue-600 dark:text-blue-400',
  },
  'Quantitative Ability': {
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-500',
    chip: 'bg-emerald-50 dark:bg-emerald-950/40',
    chipText: 'text-emerald-600 dark:text-emerald-400',
  },
  'Logical Reasoning': {
    bg: 'bg-violet-500',
    text: 'text-violet-600',
    lightBg: 'bg-violet-50',
    border: 'border-violet-500',
    chip: 'bg-violet-50 dark:bg-violet-950/40',
    chipText: 'text-violet-600 dark:text-violet-400',
  },
};

type Phase = 'INTRO' | 'CONTENT' | 'QUIZ' | 'RESULTS';

export const LessonContentScreen: React.FC = () => {
  const { isDarkMode } = useOutletContext<any>();
  const navigate = useNavigate();
  const { category, topic } = useParams<{ category: string; topic: string }>();

  const [phase, setPhase] = useState<Phase>('INTRO');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'keyPoints' | 'simpleExplanation' | 'example' | null>(null);

  const categoryData = lessonContent.find(c => c.title === category);
  const topicData = categoryData?.topics.find(t => t.title === topic);
  const colors = CATEGORY_COLORS[category || ''] || CATEGORY_COLORS['Verbal Ability'];

  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300';
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
    } catch {
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
      fetchAiExplanation(questions[currentQuizIndex].question, option, questions[currentQuizIndex].correctAnswer);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
        if (profile) {
          const newXP = (profile.xp || 0) + 50;
          const newLevel = Math.floor(newXP / 500) + 1;
          await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', user.id);
        }
        await supabase.from('quiz_sessions').insert({
          user_id: user.id,
          score: quizScore,
          is_pretest: false,
          is_timed: false,
          ended_at: new Date().toISOString(),
        });
        const { data: categories } = await supabase.from('categories').select('id, name');
        const categoryId = categories?.find(c => c.name === categoryData?.title)?.id;
        if (categoryId) {
          const { data: existing } = await supabase.from('performance')
            .select('total_answered, total_correct')
            .eq('user_id', user.id)
            .eq('category_id', categoryId)
            .maybeSingle();
          const newTotal = (existing?.total_answered || 0) + questions.length;
          const newCorrect = (existing?.total_correct || 0) + quizScore;
          await supabase.from('performance').upsert({
            user_id: user.id,
            category_id: categoryId,
            accuracy_rate: (newCorrect / newTotal) * 100,
            total_answered: newTotal,
            total_correct: newCorrect,
          }, { onConflict: 'user_id, category_id' });
        }
      }
    } catch (e) {
      console.error('Error finishing lesson:', e);
    }
  };

  const toggleSection = (section: 'keyPoints' | 'simpleExplanation' | 'example') => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <div className={`min-h-[85vh] flex flex-col ${appBg}`}>
      {/* ── Header ── */}
      <div className={`px-4 py-3 flex items-center border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-300'}`}>
        <button
          onClick={() => phase === 'INTRO' ? navigate(`/lessons/${encodeURIComponent(categoryData.title)}`) : setPhase('INTRO')}
          className={`p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${subtextClass}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className={`ml-2 text-base font-semibold ${textClass} flex-1 text-center pr-7`}>
          {category}
        </h1>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {phase === 'INTRO' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8 px-6 py-10"
            >
              <div className={`w-20 h-20 rounded-2xl ${colors.lightBg} flex items-center justify-center`}>
                <Target className={`w-10 h-10 ${colors.text}`} />
              </div>
              <div>
                <h2 className={`text-3xl font-bold ${textClass} mb-3`}>{topicData.title}</h2>
                <p className={`text-base ${subtextClass} max-w-sm mx-auto leading-relaxed`}>{topicData.description}</p>
              </div>
              <div className="flex gap-10 py-4">
                <div className="flex flex-col items-center">
                  <span className={`text-3xl font-bold ${textClass}`}>{items.length}</span>
                  <span className={`text-xs ${subtextClass} uppercase tracking-wider mt-1`}>Concepts</span>
                </div>
                <div className={`w-px h-10 self-center ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
                <div className="flex flex-col items-center">
                  <span className={`text-3xl font-bold ${textClass}`}>{questions.length}</span>
                  <span className={`text-xs ${subtextClass} uppercase tracking-wider mt-1`}>Questions</span>
                </div>
              </div>
              <button
                onClick={() => setPhase('CONTENT')}
                className={`px-10 py-3.5 rounded-xl text-white font-semibold text-base shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 ${colors.bg}`}
              >
                Start Learning
              </button>
            </motion.div>
          )}

          {/* ── CONTENT (REDESIGNED) ── */}
          {phase === 'CONTENT' && items.length > 0 && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="flex-1 flex flex-col"
            >
              {/* Progress */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex justify-between text-xs font-medium mb-2">
                  <span className={subtextClass}>Concept {currentItemIndex + 1} of {items.length}</span>
                  <span className={colors.text}>{Math.round(((currentItemIndex + 1) / items.length) * 100)}%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'} overflow-hidden`}>
                  <motion.div
                    className={`h-full rounded-full ${colors.bg}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentItemIndex + 1) / items.length) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>

              {/* ── HERO: Topic + Meaning ── */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItemIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col"
                >
                  {/* Category chip + word */}
                  <div className={`mx-4 mt-3 rounded-2xl border px-5 pt-6 pb-5 ${cardBg}`}>
                    {/* Difficulty chip */}
                    <div className="flex justify-center mb-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${colors.chip} ${colors.chipText} tracking-wide`}>
                        {items[currentItemIndex].difficulty ?? 'Beginner'}
                      </span>
                    </div>

                    {/* Topic word — the HERO */}
                    <h2 className={`text-4xl sm:text-5xl font-bold text-center ${textClass} leading-none tracking-tight mb-3`}>
                      {items[currentItemIndex].word}
                    </h2>

                    {/* Meaning — prominent tinted card */}
                    <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-zinc-700/50' : colors.lightBg}`}>
                      <p className={`text-base sm:text-lg leading-relaxed font-medium ${textClass}`}>
                        {items[currentItemIndex].definition}
                      </p>
                    </div>
                  </div>

                  {/* ── Learn More Accordions ── */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-semibold uppercase tracking-widest ${subtextClass}`}>Learn more</span>
                      <div className={`flex-1 h-px ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Key Points */}
                      <AccordionItem
                        label="Key points"
                        badge={`${items[currentItemIndex].keyPoints?.length ?? 0} points`}
                        isOpen={expandedSection === 'keyPoints'}
                        onToggle={() => toggleSection('keyPoints')}
                        isDarkMode={isDarkMode}
                        colors={colors}
                      >
                        <ul className="space-y-2.5">
                          {items[currentItemIndex].keyPoints?.slice(0, 3).map((pt, i) => (
                            <li key={i} className={`flex gap-2.5 text-sm leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2 ${colors.bg}`} />
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </AccordionItem>

                      {/* Simple Explanation */}
                      <AccordionItem
                        label="Simple explanation"
                        isOpen={expandedSection === 'simpleExplanation'}
                        onToggle={() => toggleSection('simpleExplanation')}
                        isDarkMode={isDarkMode}
                        colors={colors}
                      >
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                          {items[currentItemIndex].simpleExplanation}
                        </p>
                      </AccordionItem>

                      {/* Example */}
                      <AccordionItem
                        label="Example sentence"
                        isOpen={expandedSection === 'example'}
                        onToggle={() => toggleSection('example')}
                        isDarkMode={isDarkMode}
                        colors={colors}
                      >
                        <p className={`text-sm leading-relaxed italic ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                          "{items[currentItemIndex].example}"
                        </p>
                      </AccordionItem>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* ── Nav buttons ── */}
              <div className={`mt-6 px-4 py-4 flex gap-3 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-300'}`}>
                <button
                  onClick={() => { setCurrentItemIndex(i => Math.max(0, i - 1)); setExpandedSection(null); }}
                  disabled={currentItemIndex === 0}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm border transition-colors ${
                    currentItemIndex === 0
                      ? 'opacity-40 cursor-not-allowed border-zinc-300 dark:border-zinc-700 text-zinc-400'
                      : `border-zinc-300 dark:border-zinc-600 ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-700 hover:bg-zinc-50'}`
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                {currentItemIndex < items.length - 1 ? (
                  <button
                    onClick={() => { setCurrentItemIndex(i => i + 1); setExpandedSection(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm text-white transition-all ${colors.bg} hover:shadow-md hover:-translate-y-0.5`}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setPhase('QUIZ')}
                    className="flex-1 flex items-center justify-center py-3 rounded-xl font-semibold text-sm text-white bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-600 transition-colors"
                  >
                    Start Quiz →
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── QUIZ ── (unchanged logic, minor polish) */}
          {phase === 'QUIZ' && questions.length > 0 && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col px-4 py-4"
            >
              <div className="mb-5">
                <div className="flex justify-between text-xs font-medium mb-2">
                  <span className={subtextClass}>Question {currentQuizIndex + 1} of {questions.length}</span>
                  <span className={colors.text}>Score: {quizScore}</span>
                </div>
                <div className={`w-full h-1.5 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'} overflow-hidden`}>
                  <motion.div
                    className={`h-full rounded-full ${colors.bg}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuizIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className={`flex-1 ${cardBg} rounded-2xl border shadow-sm p-5 sm:p-8 flex flex-col`}>
                <h3 className={`text-xl font-bold ${textClass} mb-7 leading-snug`}>
                  {questions[currentQuizIndex].question}
                </h3>

                <div className="space-y-3 flex-1">
                  {questions[currentQuizIndex].options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === questions[currentQuizIndex].correctAnswer;
                    const showStatus = selectedOption !== null;

                    let btnStyle = `border ${isDarkMode ? 'border-zinc-700 bg-zinc-900/50 text-white hover:border-zinc-3000' : 'border-zinc-400 bg-white text-zinc-900 hover:border-zinc-300'}`;
                    if (showStatus) {
                      if (isCorrect) btnStyle = 'border border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
                      else if (isSelected) btnStyle = 'border border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                      else btnStyle = `opacity-40 border ${isDarkMode ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-300 bg-zinc-50'}`;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleQuizAnswer(opt)}
                        disabled={selectedOption !== null}
                        className={`w-full px-5 py-4 rounded-xl text-left text-sm font-medium transition-all ${btnStyle} flex justify-between items-center`}
                      >
                        <span>{opt}</span>
                        {showStatus && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                        {showStatus && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-5 overflow-hidden"
                    >
                      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-1.5 text-sm">
                          <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                          AI Explanation
                        </h4>
                        <p className="text-blue-900 dark:text-blue-100 leading-relaxed text-sm">
                          {isAiLoading ? "Analyzing your answer…" : aiExplanation}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedOption && (
                  <motion.button
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={nextQuizQuestion}
                    className={`mt-6 w-full py-4 rounded-xl font-bold text-white text-base ${colors.bg} hover:shadow-lg transition-all`}
                  >
                    {currentQuizIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {phase === 'RESULTS' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8 px-6"
            >
              <div className={`w-28 h-28 rounded-full ${colors.lightBg} flex items-center justify-center relative`}>
                <Trophy className={`w-14 h-14 ${colors.text}`} />
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 font-bold px-2.5 py-0.5 rounded-full text-xs shadow border-2 border-white dark:border-zinc-900">
                  +50 XP
                </div>
              </div>

              <div>
                <h2 className={`text-3xl font-bold ${textClass} mb-1`}>Lesson Complete!</h2>
                <p className={`text-base ${subtextClass}`}>You mastered {topicData.title}</p>
              </div>

              <div className={`p-7 rounded-2xl ${cardBg} border shadow-sm w-full max-w-xs`}>
                <div className={`text-6xl font-extrabold mb-1 ${colors.text}`}>
                  {Math.round((quizScore / questions.length) * 100)}%
                </div>
                <p className={`text-base font-medium ${subtextClass}`}>
                  {quizScore} out of {questions.length} correct
                </p>
              </div>

              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={() => { setPhase('INTRO'); setCurrentItemIndex(0); setCurrentQuizIndex(0); setQuizScore(0); setSelectedOption(null); }}
                  className={`flex-1 py-3.5 rounded-xl font-semibold text-sm border ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-400 text-zinc-700 hover:bg-zinc-50'} transition-colors`}
                >
                  Review Again
                </button>
                <button
                  onClick={() => navigate(`/lessons/${encodeURIComponent(categoryData.title)}`)}
                  className={`flex-1 py-3.5 rounded-xl font-semibold text-sm text-white ${colors.bg} hover:shadow-md hover:-translate-y-0.5 transition-all`}
                >
                  All Topics
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

/* ── Reusable Accordion Item ── */
interface AccordionItemProps {
  label: string;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  colors: { text: string };
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ label, badge, isOpen, onToggle, isDarkMode, colors, children }) => {
  const rowBg = isDarkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-zinc-50 border-zinc-300';
  const openBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300';

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${isOpen ? openBg : rowBg}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>{label}</span>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
              {badge}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 pt-1 border-t ${isDarkMode ? 'border-zinc-700' : 'border-zinc-300'}`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonContentScreen;