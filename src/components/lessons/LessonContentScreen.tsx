import React, { useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ChevronDown,
  CheckCircle2, XCircle, RefreshCw, Trophy,
  Target, BookOpen, HelpCircle, Sparkles, Zap,
} from 'lucide-react';
import { lessonContent } from '../../data/lessonContent';
import { supabase } from '../../supabase/supabaseClient';

/* ─────────────────────────────────────────────
   CATEGORY PALETTE — mirrors TopicsListScreen
───────────────────────────────────────────── */
const CATEGORY_COLORS: Record<
  string,
  {
    accent: string;
    accentHover: string;
    accentSoft: string;
    accentText: string;
    accentDark: string;
    accentBorder: string;
    dot: string;
    pillBg: string;
    pillText: string;
    heroBg: string;
    heroBgDark: string;
    heroText: string;
    heroTextDark: string;
  }
> = {
  'Verbal Ability': {
    accent: 'bg-blue-500',
    accentHover: 'hover:bg-blue-600',
    accentSoft: 'bg-blue-500/10',
    accentText: 'text-blue-600',
    accentDark: 'dark:text-blue-400',
    accentBorder: 'border-blue-500',
    dot: 'bg-blue-500',
    pillBg: 'bg-blue-50 dark:bg-blue-500/15',
    pillText: 'text-blue-700 dark:text-blue-300',
    heroBg: 'bg-blue-50',
    heroBgDark: 'dark:bg-blue-900/20',
    heroText: 'text-blue-900',
    heroTextDark: 'dark:text-blue-100',
  },
  'Numerical Ability': {
    accent: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-600',
    accentSoft: 'bg-emerald-500/10',
    accentText: 'text-emerald-600',
    accentDark: 'dark:text-emerald-400',
    accentBorder: 'border-emerald-500',
    dot: 'bg-emerald-500',
    pillBg: 'bg-emerald-50 dark:bg-emerald-500/15',
    pillText: 'text-emerald-700 dark:text-emerald-300',
    heroBg: 'bg-emerald-50',
    heroBgDark: 'dark:bg-emerald-900/20',
    heroText: 'text-emerald-900',
    heroTextDark: 'dark:text-emerald-100',
  },
  'Analytical Ability': {
    accent: 'bg-violet-500',
    accentHover: 'hover:bg-violet-600',
    accentSoft: 'bg-violet-500/10',
    accentText: 'text-violet-600',
    accentDark: 'dark:text-violet-400',
    accentBorder: 'border-violet-500',
    dot: 'bg-violet-500',
    pillBg: 'bg-violet-50 dark:bg-violet-500/15',
    pillText: 'text-violet-700 dark:text-violet-300',
    heroBg: 'bg-violet-50',
    heroBgDark: 'dark:bg-violet-900/20',
    heroText: 'text-violet-900',
    heroTextDark: 'dark:text-violet-100',
  },
  'General Information': {
    accent: 'bg-amber-500',
    accentHover: 'hover:bg-amber-600',
    accentSoft: 'bg-amber-500/10',
    accentText: 'text-amber-600',
    accentDark: 'dark:text-amber-400',
    accentBorder: 'border-amber-500',
    dot: 'bg-amber-500',
    pillBg: 'bg-amber-50 dark:bg-amber-500/15',
    pillText: 'text-amber-700 dark:text-amber-300',
    heroBg: 'bg-amber-50',
    heroBgDark: 'dark:bg-amber-900/20',
    heroText: 'text-amber-900',
    heroTextDark: 'dark:text-amber-100',
  },
};

/* ─────────────────────────────────────────────
   PHASE STEPPER CONFIG
───────────────────────────────────────────── */
type Phase = 'INTRO' | 'CONTENT' | 'QUIZ' | 'RESULTS';
const PHASE_STEPS: { key: Phase; label: string; icon: React.ElementType }[] = [
  { key: 'INTRO',   label: 'Overview', icon: Target     },
  { key: 'CONTENT', label: 'Learn',    icon: BookOpen   },
  { key: 'QUIZ',    label: 'Quiz',     icon: HelpCircle },
  { key: 'RESULTS', label: 'Results',  icon: Trophy     },
];

/* ─────────────────────────────────────────────
   SCORE RING — SVG circular progress
───────────────────────────────────────────── */
const ScoreRing: React.FC<{ percent: number; size?: number; stroke?: number }> = ({
  percent, size = 120, stroke = 10,
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
        className="stroke-zinc-200 dark:stroke-zinc-700" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
        strokeLinecap="round"
        className="stroke-blue-500"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  );
};

/* ─────────────────────────────────────────────
   OPTION LABEL MAP — A B C D
───────────────────────────────────────────── */
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

/* ─────────────────────────────────────────────
   MINI PROGRESS BAR
───────────────────────────────────────────── */
const ThinBar: React.FC<{ percent: number; accentClass: string }> = ({ percent, accentClass }) => (
  <div className="w-full h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
    <motion.div
      className={`h-full rounded-full ${accentClass}`}
      initial={{ width: 0 }}
      animate={{ width: `${percent}%` }}
      transition={{ type: 'spring', stiffness: 100, damping: 18 }}
    />
  </div>
);

/* ─────────────────────────────────────────────
   ACCORDION ITEM
───────────────────────────────────────────── */
interface AccordionItemProps {
  label: string;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  accentText: string;
  accentDark: string;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  label, badge, isOpen, onToggle, isDarkMode, accentText, accentDark, children,
}) => (
  <div className={`rounded-xl border overflow-hidden transition-all duration-200
    ${isDarkMode
      ? isOpen ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-900/60 border-zinc-800'
      : isOpen ? 'bg-white border-zinc-200' : 'bg-zinc-50 border-zinc-200'
    }`}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 text-left group"
    >
      <span className={`text-sm font-semibold transition-colors
        ${isOpen
          ? `${accentText} ${accentDark}`
          : isDarkMode ? 'text-zinc-300 group-hover:text-zinc-100' : 'text-zinc-600 group-hover:text-zinc-900'
        }`}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${isDarkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}
          >
            {badge}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200
            ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}
            ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`px-4 pb-4 pt-2 border-t
            ${isDarkMode ? 'border-zinc-700' : 'border-zinc-100'}`}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export const LessonContentScreen: React.FC = () => {
  const { isDarkMode } = useOutletContext<any>();
  const navigate = useNavigate();
  const { category, topic } = useParams<{ category: string; topic: string }>();

  /* ── all state preserved exactly ── */
  const [phase, setPhase]                     = useState<Phase>('INTRO');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption]   = useState<string | null>(null);
  const [quizScore, setQuizScore]             = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiExplanation, setAiExplanation]     = useState<string>('');
  const [isAiLoading, setIsAiLoading]         = useState(false);
  const [expandedSection, setExpandedSection] =
    useState<'keyPoints' | 'simpleExplanation' | 'example' | null>(null);

  const categoryData = lessonContent.find((c) => c.title === category);
  const topicData    = categoryData?.topics.find((t) => t.title === topic);
  const colors = CATEGORY_COLORS[category || ''] || CATEGORY_COLORS['Verbal Ability'];

  /* ── theme tokens ── */
  const textClass    = isDarkMode ? 'text-white'     : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400'  : 'text-zinc-500';
  const cardBg       = isDarkMode
    ? 'bg-zinc-900 border-zinc-800'
    : 'bg-white border-zinc-200';
  const pageBg       = isDarkMode ? 'bg-zinc-950' : 'bg-slate-50';

  /* ── not-found guard (logic unchanged) ── */
  if (!categoryData || !topicData) {
    return (
      <div className={`min-h-screen ${pageBg} flex flex-col items-center justify-center gap-4 px-4`}>
        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
          <BookOpen className={`w-10 h-10 ${subtextClass}`} />
        </div>
        <h1 className={`text-2xl font-bold ${textClass}`}>Topic not found</h1>
        <button
          onClick={() => navigate('/lessons')}
          className="px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 active:scale-95 transition-all"
        >
          Return to Subjects
        </button>
      </div>
    );
  }

  const items     = topicData.items;
  const questions = topicData.quizQuestions;

  /* ── all handlers preserved exactly ── */
  const fetchAiExplanation = async (
    question: string, wrongAnswer: string, correctAnswer: string,
  ) => {
    setIsAiLoading(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
          messages: [{
            role: 'user',
            content: `A student answered "${wrongAnswer}" to the question "${question}". The correct answer is "${correctAnswer}". Briefly explain why the student's answer is incorrect and why the correct answer is right. Keep it simple, encouraging, and under 3 sentences.`,
          }],
        }),
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
      setQuizScore((s) => s + 1);
    } else {
      setShowExplanation(true);
      fetchAiExplanation(
        questions[currentQuizIndex].question,
        option,
        questions[currentQuizIndex].correctAnswer,
      );
    }
  };

  const nextQuizQuestion = () => {
    if (currentQuizIndex < questions.length - 1) {
      setCurrentQuizIndex((c) => c + 1);
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
        const { data: profile } = await supabase
          .from('profiles').select('xp').eq('id', user.id).maybeSingle();
        if (profile) {
          const earnedXP = quizScore * 10 + 10;
          const newXP    = (profile.xp || 0) + earnedXP;
          const newLevel = Math.floor(newXP / 500) + 1;
          await supabase.from('profiles')
            .update({ xp: newXP, level: newLevel }).eq('id', user.id);
        }

        const { data: categories } = await supabase.from('categories').select('id, name');
        const categoryId = categories?.find((c) => c.name === categoryData?.title)?.id;

        if (categoryId) {
          const { data: existing } = await supabase
            .from('lesson_progress')
            .select('score, total_questions')
            .eq('user_id', user.id)
            .eq('category_id', categoryId)
            .eq('topic_id', topicData.id)
            .maybeSingle();

          const prevScore = existing?.score || 0;
          const prevTotal = existing?.total_questions || 0;

          await supabase.from('lesson_progress').upsert({
            user_id: user.id,
            category_id: categoryId,
            topic_id: topicData.id,
            status: 'completed',
            score: prevScore + quizScore,
            total_questions: prevTotal + questions.length,
            completed_at: new Date().toISOString(),
          }, { onConflict: 'user_id, category_id, topic_id' });
        }
      }
    } catch (e) {
      console.error('Error finishing lesson:', e);
    }
  };

  const toggleSection = (section: 'keyPoints' | 'simpleExplanation' | 'example') => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const resetLesson = () => {
    setPhase('INTRO');
    setCurrentItemIndex(0);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setAiExplanation('');
    setExpandedSection(null);
  };

  /* ── computed values ── */
  const earnedXP     = quizScore * 10 + 10;
  const scorePercent = questions.length > 0
    ? Math.round((quizScore / questions.length) * 100)
    : 0;
  const contentProgress =
    Math.round(((currentItemIndex + 1) / Math.max(items.length, 1)) * 100);
  const quizProgress =
    Math.round(((currentQuizIndex + 1) / Math.max(questions.length, 1)) * 100);

  const activePhaseIndex = PHASE_STEPS.findIndex((s) => s.key === phase);

  
  const handleBack = () => {
    if (phase === 'INTRO') {
      navigate(`/lessons/${encodeURIComponent(categoryData.title)}`);
    } else {
      setPhase('INTRO');
    }
  };

  return (
    <div className={`min-h-screen ${pageBg} transition-colors duration-300`}>

      {/* ═══════════════════════════════════════
          TOP HEADER BAR
      ═══════════════════════════════════════ */}
      <div className={`sticky top-0 z-10 backdrop-blur-sm border-b
        ${isDarkMode
          ? 'bg-zinc-950/90 border-zinc-800'
          : 'bg-slate-50/90 border-zinc-200'
        }`}
      >
        <div className="w-full max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Back */}
          <button
            onClick={handleBack}
            className={`p-2 rounded-xl border transition-all duration-200 flex-shrink-0
              ${isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              } active:scale-95`}
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Category pill */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0
            ${colors.pillBg} ${colors.pillText}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {category}
          </span>

          {/* Phase stepper — desktop */}
          <div className="hidden sm:flex items-center gap-1 flex-1 justify-center">
            {PHASE_STEPS.map((step, i) => {
              const isActive = i === activePhaseIndex;
              const isDone   = i < activePhaseIndex;
              return (
                <React.Fragment key={step.key}>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all
                    ${isActive
                      ? `${colors.pillBg} ${colors.pillText}`
                      : isDone
                      ? isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                      : isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    {isDone
                      ? <CheckCircle2 className="w-3.5 h-3.5" />
                      : <step.icon className="w-3.5 h-3.5" />
                    }
                    {step.label}
                  </div>
                  {i < PHASE_STEPS.length - 1 && (
                    <ChevronRight className={`w-3 h-3 flex-shrink-0
                      ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Topic title — truncated */}
          <span className={`sm:hidden flex-1 text-sm font-semibold truncate text-center ${textClass}`}>
            {topicData.title}
          </span>

          {/* XP chip */}
          <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0
            ${isDarkMode ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}
          >
            <Zap className="w-3 h-3" />
            +{earnedXP} XP
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          PHASE CONTENT
      ═══════════════════════════════════════ */}
      <div className="w-full max-w-2xl mx-auto flex flex-col px-9 pb-10">
        <AnimatePresence mode="wait">

          {/* ──────────────────────────────────
              INTRO PHASE
          ────────────────────────────────── */}
          {phase === 'INTRO' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center pt-10"
            >
              <div className={`w-full ${cardBg} border rounded-2xl overflow-hidden shadow-sm`}>

                {/* Hero banner */}
                <div className={`px-8 pt-8 pb-6 text-center
                  ${colors.heroBg} ${colors.heroBgDark}`}
                >
                  <div className={`inline-flex p-4 rounded-2xl mb-4
                    ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}
                  >
                    <Target className={`w-10 h-10 ${colors.accentText} ${colors.accentDark}`} />
                  </div>
                  <h2 className={`text-2xl font-bold mb-2
                    ${colors.heroText} ${colors.heroTextDark}`}
                  >
                    {topicData.title}
                  </h2>
                  <p className={`text-sm leading-relaxed max-w-xs mx-auto
                    ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}
                  >
                    {topicData.description}
                  </p>
                </div>

                {/* Stats row */}
                <div className={`grid grid-cols-2 divide-x
                  ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}
                >
                  {[
                    { label: 'Concepts to learn', value: items.length, icon: BookOpen },
                    { label: 'Quiz questions',     value: questions.length, icon: HelpCircle },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex flex-col items-center py-5 gap-1">
                      <Icon className={`w-4 h-4 mb-1 ${subtextClass}`} />
                      <span className={`text-3xl font-bold tabular-nums ${textClass}`}>{value}</span>
                      <span className={`text-xs ${subtextClass}`}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* What you'll learn note */}
                <div className={`mx-5 mb-5 p-4 rounded-xl flex gap-3 items-start
                  ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}
                >
                  <Sparkles className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.accentText} ${colors.accentDark}`} />
                  <p className={`text-xs leading-relaxed ${subtextClass}`}>
                    Work through the concepts at your own pace, then test your
                    knowledge with the quiz. Earn XP for every correct answer!
                  </p>
                </div>

                {/* CTA */}
                <div className="px-5 pb-6">
                  <button
                    onClick={() => setPhase('CONTENT')}
                    className={`w-full py-3.5 rounded-xl text-white font-bold text-sm
                      shadow-sm transition-all duration-200 active:scale-[0.98]
                      ${colors.accent} ${colors.accentHover}`}
                  >
                    Start Learning
                    <ChevronRight className="w-4 h-4 inline ml-1.5 -mt-0.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ──────────────────────────────────
              CONTENT PHASE
          ────────────────────────────────── */}
          {phase === 'CONTENT' && items.length > 0 && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col pt-6"
            >
              {/* Progress row */}
              <div className="mb-4 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold ${subtextClass}`}>
                    Concept {currentItemIndex + 1} of {items.length}
                  </span>
                  <span className={`text-xs font-bold tabular-nums ${colors.accentText} ${colors.accentDark}`}>
                    {contentProgress}%
                  </span>
                </div>
                <ThinBar percent={contentProgress} accentClass={colors.accent} />
              </div>

              {/* Card */}
              <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentItemIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Hero word band */}
                    <div className={`px-6 pt-6 pb-5 text-center
                      ${colors.heroBg} ${colors.heroBgDark}`}
                    >
                      {items[currentItemIndex].difficulty && (
                        <div className="mb-3">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full
                            ${colors.pillBg} ${colors.pillText}`}
                          >
                            {items[currentItemIndex].difficulty}
                          </span>
                        </div>
                      )}
                      <h2 className={`text-4xl sm:text-5xl font-bold tracking-tight mb-1
                        ${colors.heroText} ${colors.heroTextDark}`}
                      >
                        {items[currentItemIndex].word}
                      </h2>
                    </div>

                    {/* Definition block */}
                    <div className="px-6 py-5">
                      <p className={`text-sm sm:text-base leading-relaxed text-center font-medium
                        ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}
                      >
                        {items[currentItemIndex].definition}
                      </p>
                    </div>

                    {/* Accordions */}
                    <div className={`px-5 pb-5 flex flex-col gap-2 border-t
                      ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}
                    >
                      <div className="pt-4 flex flex-col gap-2">
                        <AccordionItem
                          label="Key points"
                          badge={`${items[currentItemIndex].keyPoints?.length ?? 0}`}
                          isOpen={expandedSection === 'keyPoints'}
                          onToggle={() => toggleSection('keyPoints')}
                          isDarkMode={isDarkMode}
                          accentText={colors.accentText}
                          accentDark={colors.accentDark}
                        >
                          <ul className="space-y-2.5 pt-1">
                            {items[currentItemIndex].keyPoints?.slice(0, 3).map((pt, i) => (
                              <li
                                key={i}
                                className={`flex gap-3 text-sm leading-relaxed
                                  ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2 ${colors.dot}`} />
                                {pt}
                              </li>
                            ))}
                          </ul>
                        </AccordionItem>

                        <AccordionItem
                          label="Simple explanation"
                          isOpen={expandedSection === 'simpleExplanation'}
                          onToggle={() => toggleSection('simpleExplanation')}
                          isDarkMode={isDarkMode}
                          accentText={colors.accentText}
                          accentDark={colors.accentDark}
                        >
                          <p className={`text-sm leading-relaxed
                            ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}
                          >
                            {items[currentItemIndex].simpleExplanation}
                          </p>
                        </AccordionItem>

                        <AccordionItem
                          label="Example sentence"
                          isOpen={expandedSection === 'example'}
                          onToggle={() => toggleSection('example')}
                          isDarkMode={isDarkMode}
                          accentText={colors.accentText}
                          accentDark={colors.accentDark}
                        >
                          <p className={`text-sm leading-relaxed italic
                            ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}
                          >
                            "{items[currentItemIndex].example}"
                          </p>
                        </AccordionItem>
                      </div>
                    </div>

                    {/* Nav buttons */}
                    <div className={`flex gap-3 px-5 pb-5 border-t pt-4
                      ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}
                    >
                      <button
                        onClick={() => {
                          setCurrentItemIndex((i) => Math.max(0, i - 1));
                          setExpandedSection(null);
                        }}
                        disabled={currentItemIndex === 0}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl
                          text-sm font-semibold border transition-all duration-200 active:scale-[0.98]
                          ${currentItemIndex === 0
                            ? 'opacity-30 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400'
                            : isDarkMode
                            ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                            : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          }`}
                      >
                        <ChevronLeft className="w-4 h-4" /> Prev
                      </button>

                      {currentItemIndex < items.length - 1 ? (
                        <button
                          onClick={() => {
                            setCurrentItemIndex((i) => i + 1);
                            setExpandedSection(null);
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl
                            text-sm font-bold text-white transition-all duration-200 active:scale-[0.98]
                            ${colors.accent} ${colors.accentHover}`}
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setPhase('QUIZ')}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                            text-sm font-bold text-white transition-all duration-200 active:scale-[0.98]
                            ${colors.accent} ${colors.accentHover}`}
                        >
                          <HelpCircle className="w-4 h-4" />
                          Take Quiz
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ──────────────────────────────────
              QUIZ PHASE
          ────────────────────────────────── */}
          {phase === 'QUIZ' && questions.length > 0 && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col pt-6"
            >
              {/* Progress row */}
              <div className="mb-4 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold ${subtextClass}`}>
                    Question {currentQuizIndex + 1} of {questions.length}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold
                    ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {quizScore} correct
                  </span>
                </div>
                <ThinBar percent={quizProgress} accentClass={colors.accent} />
              </div>

              {/* Quiz card */}
              <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>
                {/* Question */}
                <div className="px-6 py-6">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1
                    rounded-full mb-4 ${colors.pillBg} ${colors.pillText}`}
                  >
                    <HelpCircle className="w-3 h-3" />
                    Question {currentQuizIndex + 1}
                  </div>
                  <h3 className={`text-lg sm:text-xl font-bold leading-snug ${textClass}`}>
                    {questions[currentQuizIndex].question}
                  </h3>
                </div>

                {/* Options */}
                <div className={`px-5 pb-2 flex flex-col gap-2.5 border-t
                  ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}
                >
                  <div className="pt-4 flex flex-col gap-2.5">
                    {questions[currentQuizIndex].options.map((opt, i) => {
                      const isSelected = selectedOption === opt;
                      const isCorrect  = opt === questions[currentQuizIndex].correctAnswer;
                      const answered   = selectedOption !== null;

                      let optStyle: string;
                      if (!answered) {
                        optStyle = isDarkMode
                          ? 'border-zinc-700 bg-zinc-800/50 text-white hover:border-zinc-500 hover:bg-zinc-800'
                          : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50';
                      } else if (isCorrect) {
                        optStyle = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/25 text-emerald-800 dark:text-emerald-200';
                      } else if (isSelected) {
                        optStyle = 'border-red-400 bg-red-50 dark:bg-red-900/25 text-red-800 dark:text-red-200';
                      } else {
                        optStyle = `opacity-40 cursor-not-allowed ${
                          isDarkMode
                            ? 'border-zinc-700 bg-zinc-800/30 text-zinc-400'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                        }`;
                      }

                      return (
                        <motion.button
                          key={i}
                          whileHover={!answered ? { scale: 1.01 } : {}}
                          whileTap={!answered ? { scale: 0.99 } : {}}
                          onClick={() => handleQuizAnswer(opt)}
                          disabled={answered}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left
                            text-sm font-medium border-2 transition-all duration-150 ${optStyle}`}
                        >
                          {/* Letter label */}
                          <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center
                            justify-center text-xs font-bold
                            ${answered && isCorrect
                              ? 'bg-emerald-500 text-white'
                              : answered && isSelected && !isCorrect
                              ? 'bg-red-500 text-white'
                              : isDarkMode
                              ? 'bg-zinc-700 text-zinc-300'
                              : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {answered && isCorrect
                              ? <CheckCircle2 className="w-4 h-4" />
                              : answered && isSelected && !isCorrect
                              ? <XCircle className="w-4 h-4" />
                              : OPTION_LABELS[i]
                            }
                          </span>
                          <span className="flex-1 leading-snug">{opt}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* AI explanation */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden px-5"
                    >
                      <div className={`my-4 p-4 rounded-xl border
                        ${isDarkMode
                          ? 'bg-blue-900/20 border-blue-800/40'
                          : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw
                            className={`w-3.5 h-3.5 text-blue-500
                              ${isAiLoading ? 'animate-spin' : ''}`}
                          />
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            AI Explanation
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed
                          ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}
                        >
                          {isAiLoading ? 'Analyzing your answer…' : aiExplanation}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Next CTA */}
                <div className="px-5 pb-5">
                  <AnimatePresence>
                    {selectedOption && (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={nextQuizQuestion}
                        className={`w-full py-3.5 rounded-xl font-bold text-white text-sm
                          transition-all duration-200 active:scale-[0.98]
                          ${colors.accent} ${colors.accentHover}`}
                      >
                        {currentQuizIndex < questions.length - 1
                          ? 'Next Question'
                          : 'View Results'}
                        <ChevronRight className="w-4 h-4 inline ml-1.5 -mt-0.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* ──────────────────────────────────
              RESULTS PHASE
          ────────────────────────────────── */}
          {phase === 'RESULTS' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center pt-10"
            >
              <div className={`w-full ${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>

                {/* Score hero */}
                <div className={`flex flex-col items-center px-8 pt-8 pb-6
                  ${colors.heroBg} ${colors.heroBgDark}`}
                >
                  <div className="relative mb-4">
                    <ScoreRing percent={scorePercent} size={128} stroke={10} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-extrabold tabular-nums
                        ${colors.accentText} ${colors.accentDark}`}
                      >
                        {scorePercent}%
                      </span>
                    </div>
                  </div>

                  <h2 className={`text-2xl font-bold mb-1
                    ${colors.heroText} ${colors.heroTextDark}`}
                  >
                    {scorePercent >= 80
                      ? 'Excellent work!'
                      : scorePercent >= 50
                      ? 'Good effort!'
                      : 'Keep practicing!'}
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {quizScore} of {questions.length} questions correct
                  </p>
                </div>

                {/* Stats strip */}
                <div className={`grid grid-cols-3 divide-x
                  ${isDarkMode ? 'divide-zinc-800 border-t border-zinc-800' : 'divide-zinc-100 border-t border-zinc-100'}`}
                >
                  {[
                    { label: 'Correct',  value: quizScore,                    color: 'text-emerald-500' },
                    { label: 'Missed',   value: questions.length - quizScore, color: 'text-red-500'     },
                    { label: 'XP Earned', value: `+${earnedXP}`,              color: 'text-amber-500'  },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex flex-col items-center py-5 gap-0.5">
                      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
                      <span className={`text-xs ${subtextClass}`}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Topic summary */}
                <div className={`mx-5 my-4 p-4 rounded-xl flex gap-3 items-center
                  ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}
                >
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${colors.accentSoft}`}>
                    <Trophy className={`w-5 h-5 ${colors.accentText} ${colors.accentDark}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${textClass}`}>{topicData.title}</p>
                    <p className={`text-xs ${subtextClass}`}>
                      {category} · Lesson completed
                    </p>
                  </div>
                </div>

                {/* CTA row */}
                <div className="flex gap-3 px-5 pb-6">
                  <button
                    onClick={resetLesson}
                    className={`flex-1 py-3.5 rounded-xl font-semibold text-sm border
                      transition-all duration-200 active:scale-[0.98]
                      ${isDarkMode
                        ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                      }`}
                  >
                    Review Again
                  </button>
                  <button
                    onClick={() => navigate(`/lessons/${encodeURIComponent(categoryData.title)}`)}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm text-white
                      transition-all duration-200 active:scale-[0.98]
                      ${colors.accent} ${colors.accentHover}`}
                  >
                    All Topics
                    <ChevronRight className="w-4 h-4 inline ml-1.5 -mt-0.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default LessonContentScreen;