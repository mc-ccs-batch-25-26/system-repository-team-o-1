import { motion } from 'framer-motion';
import { Zap, BookOpen, FileText, Timer, BookMarked, ArrowRight, Flame, Trophy} from 'lucide-react';

export type QuizMode = 'hub' | 'daily' | 'practice' | 'mock' | 'challenge' | 'mistakes';

interface QuizHubProps {
  onSelectMode: (mode: QuizMode) => void;
  isDarkMode: boolean;
  streakCount: number;
}

const QuizHub = ({ onSelectMode, isDarkMode, streakCount }: QuizHubProps) => {
  const bg         = isDarkMode ? 'bg-zinc-950'     : 'bg-[#f7f8fc]';
  const cardBg     = isDarkMode ? 'bg-zinc-900'     : 'bg-white';
  const borderCol  = isDarkMode ? 'border-zinc-800' : 'border-zinc-200/80';
  const textPri    = isDarkMode ? 'text-white'      : 'text-zinc-900';
  const textSec    = isDarkMode ? 'text-zinc-400'   : 'text-zinc-500';
  const pillBg     = isDarkMode ? 'bg-white/[0.06] text-zinc-400' : 'bg-zinc-100 text-zinc-500';
  const hoverRing  = isDarkMode ? 'hover:border-white/[0.14]' : 'hover:border-zinc-300';
  const arrowHover = isDarkMode ? 'group-hover:bg-white/[0.06]' : 'group-hover:bg-zinc-100';

  // ── Hero (Daily Adaptive) ──────────────────────────────────────────────────
  const hero = {
    id: 'daily' as QuizMode,
    title: 'Daily Adaptive Quiz',
    description: 'Personalized training that targets your weak areas with AI-powered explanations.',
    icon: Zap,
    features: ['20 XP / correct', 'AI explanations', 'Streak rewards'],
  };
  // ── Secondary modes (2×2 grid) ────────────────────────────────────────────
  const secondaryModes = [
    {
      id:          'practice' as QuizMode,
      title:       'Practice',
      description: 'Pick your subject and difficulty — no pressure.',
      icon:        BookOpen,
      accent:      { light: '#3b82f6', dark: '#60a5fa' },
      iconBg:      isDarkMode ? 'bg-blue-500/15' : 'bg-blue-50',
      iconColor:   isDarkMode ? 'text-blue-400'  : 'text-blue-600',
      badge:       '15 XP / correct',
      features:    ['Instant feedback', 'Category filter'],
    },
    {
      id:          'mock' as QuizMode,
      title:       'Mock Exam',
      description: 'Simulate real Civil Service Exam conditions.',
      icon:        FileText,
      accent:      { light: '#8b5cf6', dark: '#a78bfa' },
      iconBg:      isDarkMode ? 'bg-violet-500/15' : 'bg-violet-50',
      iconColor:   isDarkMode ? 'text-violet-400'  : 'text-violet-600',
      badge:       '10 XP / correct',
      features:    ['Exam pacing', 'Full report'],
    },
    {
      id:          'challenge' as QuizMode,
      title:       'Timed Challenge',
      description: 'Speed quiz — answer as many as you can in 5 minutes.',
      icon:        Timer,
      accent:      { light: '#ef4444', dark: '#f87171' },
      iconBg:      isDarkMode ? 'bg-red-500/15' : 'bg-red-50',
      iconColor:   isDarkMode ? 'text-red-400'  : 'text-red-600',
      badge:       '10 XP / correct',
      features:    ['Speed bonus', 'Combo multiplier'],
    },
    {
      id:          'mistakes' as QuizMode,
      title:       'Mistake Notebook',
      description: 'Review and retry every question you got wrong.',
      icon:        BookMarked,
      accent:      { light: '#10b981', dark: '#34d399' },
      iconBg:      isDarkMode ? 'bg-emerald-500/15' : 'bg-emerald-50',
      iconColor:   isDarkMode ? 'text-emerald-400'  : 'text-emerald-600',
      badge:       'Review only',
      features:    ['AI explanations', 'Retry wrongs'],
    },
  ];

  return (
    <div className={`min-h-screen ${bg} w-full`}>
      <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-9">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3">
          
            <div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Practice</p>
              <h1 className={`text-2xl font-bold tracking-tight ${textPri}`}>Quiz Hub</h1>
              <p className={`text-xs ${textSec}`}>Sharpen your Civil Service Exam skills</p>
            </div>
          </div>

          {/* Streak pill */}
          {streakCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                isDarkMode
                  ? 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20'
                  : 'bg-orange-50 text-orange-600 ring-1 ring-orange-200'
              }`}
            >
              <Flame className="w-3 h-3" />
              {streakCount}-day streak — keep it going!
            </motion.div>
          )}
        </motion.div>

        {/* ── Hero Card (Daily Adaptive) ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
      <button
  onClick={() => onSelectMode(hero.id)}
  className={`
    w-full text-left rounded-2xl border overflow-hidden group
    transition-all duration-100 relative
    bg-gradient-to-br from-blue-800 to-blue-950
    active:scale-[0.99]
  `}
>
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Text & Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-lg font-bold text-white">{hero.title}</h2>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-blue-600 shadow-sm bg-white"
                    >
                      RECOMMEND
                    </span>
                  </div>
                  <p className="text-sm mt-1 leading-snug text-blue-50">{hero.description}</p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {hero.features.map(f => (
                      <span key={f} className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-white/20 text-white shadow-sm ring-1 ring-white/30">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 p-2 rounded-full flex items-center justify-center bg-white/20">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </button>
        </motion.div>

        {/* ── Divider label ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-1"
        >
          <span className={`text-[10px] font-bold uppercase tracking-widest ${textSec}`}>
            Other Modes
          </span>
        </motion.div>

        {/* ── 2×2 Grid (secondary modes) ───────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {secondaryModes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              onClick={() => onSelectMode(mode.id)}
              className={`
                w-full text-left rounded-2xl border p-4 group
                transition-all duration-200
                ${cardBg} ${borderCol} ${hoverRing}
                hover:shadow-lg active:scale-[0.98]
                ${isDarkMode ? 'hover:shadow-black/30' : 'hover:shadow-zinc-200/80'}
              `}
            >
              {/* Icon row */}
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${mode.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                  <mode.icon className={`w-5 h-5 ${mode.iconColor}`} />
                </div>
                {mode.badge && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isDarkMode ? 'bg-white/[0.06] text-zinc-400' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {mode.badge}
                  </span>
                )}
              </div>

              {/* Title + desc */}
              <h3 className={`text-sm font-bold ${textPri} leading-tight`}>{mode.title}</h3>
              <p className={`text-xs mt-1 leading-snug ${textSec}`}>{mode.description}</p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-1 mt-3">
                {mode.features.map(f => (
                  <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded ${pillBg}`}>
                    {f}
                  </span>
                ))}
              </div>

              {/* Arrow */}
              <div className="flex justify-end mt-3">
                <ArrowRight className={`w-9 h-6 ${textSec} group-hover:translate-x-0.5 transition-transform`} />
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── Footer tip ────────────────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className={`text-center text-[11px] ${textSec} flex items-center justify-center gap-1.5 pb-2`}
        >
          <Trophy className="w-3 h-3" />
          Complete quizzes daily to build your streak and earn bonus XP
        </motion.p>

      </div>
    </div>
  );
};

export default QuizHub;
