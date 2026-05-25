import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import { MOCK_QUESTIONS, MockQuestion, shuffleArray } from '../data/mockQuestions';
import {
  CheckCircle2, Target, BarChart2, Zap, ClipboardList,
  TrendingUp, BookOpen, AlertTriangle, ArrowRight, Sparkles,
  ChevronLeft, ChevronRight, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Data (unchanged) ────────────────────────────────────────── */
const PRETEST_QUESTIONS: MockQuestion[] = [
  ...shuffleArray(MOCK_QUESTIONS['Verbal Ability'] || []).slice(0, 5),
  ...shuffleArray(MOCK_QUESTIONS['Numerical Ability'] || []).slice(0, 5),
  ...shuffleArray(MOCK_QUESTIONS['Analytical Ability'] || []).slice(0, 5),
  ...shuffleArray(MOCK_QUESTIONS['General Information'] || []).slice(0, 5),
];

/* ─── Theme tokens (matches app system) ─────────────────────────*/
const CATEGORY_META: Record<string, {
  pill: string; pillBg: string; bar: string; accent: string;
  accentRgb: string; icon: string; weakTip: string;
}> = {
  'Verbal Ability': {
    pill: '#2563eb', pillBg: 'rgba(59,130,246,0.10)',
    bar: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
    accent: '#3b82f6', accentRgb: '59,130,246',
    icon: '📖',
    weakTip: 'Practice reading comprehension passages daily. Focus on vocabulary in context, analogies, and grammar rules. Try 10 minutes of reading Philippine broadsheets to build context.',
  },
  'Numerical Ability': {
    pill: '#059669', pillBg: 'rgba(16,185,129,0.10)',
    bar: 'linear-gradient(90deg,#10b981,#34d399)',
    accent: '#10b981', accentRgb: '16,185,129',
    icon: '🔢',
    weakTip: 'Drill arithmetic fundamentals: fractions, percentages, ratios, and basic algebra. Time yourself on number series — speed matters as much as accuracy in this category.',
  },
  'Analytical Ability': {
    pill: '#7c3aed', pillBg: 'rgba(139,92,246,0.10)',
    bar: 'linear-gradient(90deg,#8b5cf6,#a78bfa)',
    accent: '#8b5cf6', accentRgb: '139,92,246',
    icon: '🧩',
    weakTip: 'Work through logic puzzles and pattern recognition exercises. Study syllogisms, data sufficiency problems, and coding-decoding questions. Consistent pattern exposure sharpens this skill fast.',
  },
  'General Information': {
    pill: '#b45309', pillBg: 'rgba(245,158,11,0.10)',
    bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
    accent: '#f59e0b', accentRgb: '245,158,11',
    icon: '🌐',
    weakTip: 'Review Philippine history, government structure, the Constitution, and current events. Make a 1-page cheat sheet for RA 6713 (Code of Conduct) — it appears frequently on the CSE.',
  },
};

const getScoreLevel = (correct: number, total: number) => {
  const pct = correct / total;
  if (pct >= 0.8) return { label: 'Strong',   color: '#10b981', bg: 'rgba(16,185,129,0.10)',  bar: 'linear-gradient(90deg,#10b981,#34d399)' };
  if (pct >= 0.6) return { label: 'Good',     color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  bar: 'linear-gradient(90deg,#3b82f6,#60a5fa)' };
  if (pct >= 0.4) return { label: 'Fair',     color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)' };
  return              { label: 'Needs Work', color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   bar: 'linear-gradient(90deg,#ef4444,#f87171)' };
};

/* ─── Main Component ──────────────────────────────────────────── */
const PretestPage = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  const question = PRETEST_QUESTIONS[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / PRETEST_QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestion === PRETEST_QUESTIONS.length - 1;
  const allAnswered = answeredCount === PRETEST_QUESTIONS.length;

  /* ── Handlers (unchanged logic) ── */
  const handleOptionSelect = (questionId: string, option: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };
  const goToNext = () => { if (currentQuestion < PRETEST_QUESTIONS.length - 1) setCurrentQuestion(p => p + 1); };
  const goToPrevious = () => { if (currentQuestion > 0) setCurrentQuestion(p => p - 1); };

  const getResults = () => {
    const cat: Record<string, { total: number; correct: number }> = {};
    PRETEST_QUESTIONS.forEach(q => {
      if (!cat[q.category]) cat[q.category] = { total: 0, correct: 0 };
      cat[q.category].total += 1;
      if (answers[q.id] === q.correct) cat[q.category].correct += 1;
    });
    return cat;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitted(true);
    setShowResults(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const categoryPerformance = getResults();
        await supabase.from('profiles').update({ pretest_done: true }).eq('id', session.user.id);
        const pretestXP = 100;
        const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', session.user.id).single();
        if (profile) {
          const newXP = (profile.xp || 0) + pretestXP;
          await supabase.from('profiles').update({ xp: newXP, level: Math.floor(newXP / 500) + 1 }).eq('id', session.user.id);
        }
        const { data: categories } = await supabase.from('categories').select('id, name');
        const pretestInserts = Object.entries(categoryPerformance).map(async ([categoryName, stats]) => {
          const category = categories?.find(c => c.name === categoryName);
          if (!category) return;
          const accuracy = (stats.correct / stats.total) * 100;
          const isWeakCategory = accuracy < 50;
          await supabase.from('pretest_results').upsert(
            { user_id: session.user.id, category_id: category.id, score: stats.correct, total_questions: stats.total, weak_category: isWeakCategory, completed_at: new Date().toISOString() },
            { onConflict: 'user_id, category_id' }
          );
        });
        await Promise.all(pretestInserts);
        const totalScore = Object.values(categoryPerformance).reduce((s, c) => s + c.correct, 0);
        await supabase.from('quiz_sessions').insert({ user_id: session.user.id, score: totalScore, is_pretest: true, is_timed: false, ended_at: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Error submitting pretest:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => { window.location.href = '/'; };

  /* ── Theme shorthand ── */
  const bg     = isDark ? '#0c0e14' : '#f4f5f9';
  const surf   = isDark ? '#13161f' : '#ffffff';
  const surf2  = isDark ? '#1e2230' : '#f7f8fc';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const tPri   = isDark ? '#f0f1f5' : '#111318';
  const tSec   = isDark ? '#6b7280' : '#6b7280';
  const divider= isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const results = showResults ? getResults() : null;
  const totalCorrect = results ? Object.values(results).reduce((s, c) => s + c.correct, 0) : 0;
  const totalPct = results ? (totalCorrect / PRETEST_QUESTIONS.length) * 100 : 0;

  /* ─────────────────────────────────────────────────────────────
     RESULTS VIEW
  ───────────────────────────────────────────────────────────── */
  if (showResults && results) {
    const weakCategories = Object.entries(results)
      .filter(([, stats]) => stats.correct / stats.total < 0.6)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));

    const strongCategories = Object.entries(results)
      .filter(([, stats]) => stats.correct / stats.total >= 0.6);

    const overallLevel = getScoreLevel(totalCorrect, PRETEST_QUESTIONS.length);

    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 48px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
              }}
            >
              <Trophy size={26} color="#fff" />
            </motion.div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: tPri, margin: '0 0 4px', letterSpacing: '-0.4px' }}>
              Pre-Test Complete!
            </h1>
            <p style={{ fontSize: 13, color: tSec, margin: 0 }}>Here's your baseline performance across all 4 areas</p>
          </div>

          {/* Score hero card */}
          <div style={{
            background: surf, border: `1px solid ${border}`, borderRadius: 20,
            padding: '24px 24px 20px', textAlign: 'center',
            boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* bg glow */}
            <div style={{
              position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
              width: 200, height: 200,
              background: `radial-gradient(circle, ${overallLevel.bg} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: tSec, margin: '0 0 10px' }}>
              Overall Score
            </p>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: 64, fontWeight: 800, color: overallLevel.color, lineHeight: 1, letterSpacing: '-2px' }}>
                {totalCorrect}
              </span>
              <span style={{ fontSize: 28, fontWeight: 600, color: tSec }}>/{PRETEST_QUESTIONS.length}</span>
            </div>
            <span style={{
              display: 'inline-block', marginTop: 8, marginBottom: 16,
              padding: '4px 14px', borderRadius: 999,
              background: overallLevel.bg, color: overallLevel.color,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            }}>
              {overallLevel.label} · {Math.round(totalPct)}%
            </span>

            {/* progress bar */}
            <div style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalPct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                style={{ height: '100%', borderRadius: 999, background: overallLevel.bar }}
              />
            </div>

            {/* XP badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 14 }}>
              <Sparkles size={13} color="#f59e0b" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>+100 XP earned</span>
            </div>
          </div>

          {/* Category breakdown */}
          <div style={{ background: surf, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden',
            boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${divider}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: tSec, margin: 0 }}>
                Category Breakdown
              </p>
            </div>
            {Object.entries(results).map(([category, stats], i, arr) => {
              const meta = CATEGORY_META[category];
              const level = getScoreLevel(stats.correct, stats.total);
              const pct = (stats.correct / stats.total) * 100;
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: '14px 18px',
                    borderBottom: i < arr.length - 1 ? `1px solid ${divider}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{meta?.icon}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
                        background: meta?.pillBg, color: meta?.pill,
                      }}>
                        {category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                        background: level.bg, color: level.color,
                      }}>
                        {level.label}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: level.color }}>
                        {stats.correct}/{stats.total}
                      </span>
                    </div>
                  </div>
                  <div style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 + i * 0.1 }}
                      style={{ height: '100%', borderRadius: 999, background: level.bar }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Weak area recommendations (new section) ── */}
          {weakCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: surf, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden',
                boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              {/* header */}
              <div style={{
                padding: '16px 18px 14px',
                borderBottom: `1px solid ${divider}`,
                background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(239,68,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <AlertTriangle size={14} color="#ef4444" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: tPri, margin: 0, lineHeight: 1.2 }}>
                    Areas to Improve
                  </p>
                  <p style={{ fontSize: 10, color: tSec, margin: 0 }}>
                    Personalized recommendations for your weak spots
                  </p>
                </div>
              </div>

              {/* Recommendation cards */}
              {weakCategories.map(([category, stats], i) => {
                const meta = CATEGORY_META[category];
                const level = getScoreLevel(stats.correct, stats.total);
                const pct = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div
                    key={category}
                    style={{
                      padding: '16px 18px',
                      borderBottom: i < weakCategories.length - 1 ? `1px solid ${divider}` : 'none',
                    }}
                  >
                    {/* Category label row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{meta?.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: meta?.pill }}>{category}</span>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                        background: level.bg, color: level.color,
                      }}>
                        {pct}% — {level.label}
                      </span>
                    </div>

                    {/* Tip card */}
                    <div style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : `rgba(${meta?.accentRgb},0.05)`,
                      border: `1px solid rgba(${meta?.accentRgb},0.15)`,
                      borderRadius: 12, padding: '12px 14px',
                      display: 'flex', gap: 10,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        background: `rgba(${meta?.accentRgb},0.12)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 1,
                      }}>
                        <Zap size={13} color={meta?.accent} />
                      </div>
                      <p style={{ fontSize: 12, color: tSec, margin: 0, lineHeight: 1.6 }}>
                        {meta?.weakTip}
                      </p>
                    </div>

                    {/* Quick action pill */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 6,
                        background: `rgba(${meta?.accentRgb},0.10)`,
                        color: meta?.accent,
                        border: `1px solid rgba(${meta?.accentRgb},0.20)`,
                      }}>
                        <Target size={10} />
                        Focus in Daily Quiz
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 6,
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        color: tSec,
                        border: `1px solid ${divider}`,
                      }}>
                        <BookOpen size={10} />
                        Practice Mode
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Strong categories shoutout */}
          {strongCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.05)',
                border: `1px solid rgba(16,185,129,0.18)`,
                borderRadius: 16, padding: '14px 16px',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: 'rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp size={15} color="#10b981" />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', margin: '0 0 3px' }}>
                  Strong in: {strongCategories.map(([c]) => c.split(' ')[0]).join(' & ')}
                </p>
                <p style={{ fontSize: 11, color: tSec, margin: 0, lineHeight: 1.5 }}>
                  Great foundation! Keep sharpening these areas while focusing your energy on the weaker categories above.
                </p>
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.4 }}
            onClick={handleContinue}
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
              background: isSubmitting ? (isDark ? '#1e2230' : '#e5e7eb') : 'linear-gradient(135deg,#3b82f6,#6366f1)',
              color: isSubmitting ? tSec : '#fff',
              fontSize: 14, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(99,102,241,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: '-0.1px',
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? 'Saving results…' : (
              <>
                Continue to Dashboard
                <ArrowRight size={15} />
              </>
            )}
          </motion.button>

          <p style={{ textAlign: 'center', fontSize: 11, color: isDark ? '#374151' : '#9ca3af', paddingBottom: 4 }}>
            Your Daily Adaptive Quiz will now prioritize your weak areas
          </p>
        </motion.div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     INTRO VIEW
  ───────────────────────────────────────────────────────────── */
  if (showIntro) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 480 }}
        >
          <div style={{
            background: surf, border: `1px solid ${border}`, borderRadius: 24,
            padding: '32px 28px',
            boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,0,0,0.08)',
            overflow: 'hidden', position: 'relative',
          }}>
            {/* Decorative glow */}
            <div style={{
              position: 'absolute', top: -60, right: -40, width: 180, height: 180,
              background: 'radial-gradient(circle,rgba(99,102,241,0.20) 0%,transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />

            {/* Icon + title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, marginBottom: 24, position: 'relative' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
              }}>
                <ClipboardList size={28} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: tPri, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                  Diagnostic Pre-Test
                </h1>
                <p style={{ fontSize: 13, color: tSec, margin: 0, lineHeight: 1.6, maxWidth: 320 }}>
                  Helps CiviQuest understand your current knowledge level across Civil Service Exam subjects — taken only once.
                </p>
              </div>
            </div>

            {/* Why take it */}
            <div style={{
              background: surf2, border: `1px solid ${border}`,
              borderRadius: 16, padding: '16px 16px 12px', marginBottom: 16,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: tSec, margin: '0 0 12px' }}>
                Why take the pre-test?
              </p>
              {[
                { icon: Target,   color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  title: 'Personalized quizzes',   desc: 'Weak areas get priority in your daily sessions' },
                { icon: BarChart2,color: '#10b981', bg: 'rgba(16,185,129,0.10)',  title: 'Track improvement',      desc: 'Compare future scores against this baseline' },
                { icon: Zap,      color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  title: 'Efficient study',        desc: 'Spend time where it impacts your score most' },
              ].map(({ icon: Icon, color, bg: ibg, title, desc }) => (
                <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: ibg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: tPri, margin: '0 0 1px' }}>{title}</p>
                    <p style={{ fontSize: 11, color: tSec, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Info pill */}
            <div style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20, textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, color: isDark ? '#a5b4fc' : '#4f46e5', margin: 0, lineHeight: 1.6 }}>
                <strong>{PRETEST_QUESTIONS.length} questions</strong> across 4 categories<br />
                <span style={{ fontSize: 11, opacity: 0.8 }}>Verbal · Numerical · Analytical · General Information</span>
              </p>
            </div>

            {/* CTA */}
            <motion.button
              onClick={() => setShowIntro(false)}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: '-0.1px',
              }}
            >
              Start Pre-Test
              <ArrowRight size={15} />
            </motion.button>

            <p style={{ textAlign: 'center', fontSize: 11, color: isDark ? '#374151' : '#9ca3af', marginTop: 12, marginBottom: 0 }}>
              You can only take this once. Answers are final after submission.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     QUESTION VIEW
  ───────────────────────────────────────────────────────────── */
  const catMeta = CATEGORY_META[question.category];

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 48px' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: tPri, margin: '0 0 3px', letterSpacing: '-0.3px' }}>
            Diagnostic Pre-Test
          </h1>
          <p style={{ fontSize: 12, color: tSec, margin: 0 }}>
            Answer all {PRETEST_QUESTIONS.length} questions to assess your baseline
          </p>
        </div>

        {/* Progress header card */}
        <div style={{
          background: surf, border: `1px solid ${border}`, borderRadius: 18,
          padding: '16px 18px',
          boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,0,0,0.05)',
        }}>
          {/* top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: tSec }}>
              Question {currentQuestion + 1} <span style={{ color: isDark ? '#374151' : '#d1d5db' }}>/</span> {PRETEST_QUESTIONS.length}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
              background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
              color: '#6366f1',
            }}>
              {answeredCount} answered
            </span>
          </div>

          {/* bar */}
          <div style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 999, height: 6, overflow: 'hidden', marginBottom: 10 }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#3b82f6,#6366f1)' }}
            />
          </div>

          {/* dot nav */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
            {PRETEST_QUESTIONS.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(i)}
                style={{
                  border: 'none', cursor: 'pointer', padding: 0,
                  borderRadius: 999, transition: 'all 0.2s',
                  width: i === currentQuestion ? 20 : 8,
                  height: 8,
                  background: i === currentQuestion
                    ? 'linear-gradient(90deg,#3b82f6,#6366f1)'
                    : answers[q.id]
                    ? '#6366f1'
                    : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: surf, border: `1px solid ${border}`, borderRadius: 20,
              padding: '22px 22px 18px',
              boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            {/* category pill */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              background: catMeta?.pillBg, color: catMeta?.pill,
              marginBottom: 14,
            }}>
              <span style={{ fontSize: 13 }}>{catMeta?.icon}</span>
              {question.category}
            </span>

            {/* question text */}
            <h3 style={{ fontSize: 15, fontWeight: 600, color: tPri, margin: '0 0 18px', lineHeight: 1.55 }}>
              {currentQuestion + 1}. {question.question}
            </h3>

            {/* options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {question.options.map((option, oi) => {
                const isSelected = answers[question.id] === option;
                const labels = ['A', 'B', 'C', 'D'];
                return (
                  <motion.button
                    key={option}
                    onClick={() => handleOptionSelect(question.id, option)}
                    disabled={submitted}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 14px',
                      borderRadius: 12, cursor: submitted ? 'default' : 'pointer',
                      border: isSelected
                        ? `1.5px solid ${catMeta?.accent}`
                        : `1px solid ${border}`,
                      background: isSelected
                        ? catMeta?.pillBg
                        : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 12,
                      boxShadow: isSelected ? `0 2px 12px rgba(${catMeta?.accentRgb},0.20)` : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected && !submitted)
                        (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)';
                    }}
                  >
                    {/* label bubble */}
                    <span style={{
                      width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                      background: isSelected ? catMeta?.accent : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      color: isSelected ? '#fff' : tSec,
                      transition: 'all 0.15s',
                    }}>
                      {labels[oi]}
                    </span>

                    <span style={{ fontSize: 13, color: isSelected ? catMeta?.pill : tPri, fontWeight: isSelected ? 600 : 400, flex: 1, lineHeight: 1.45 }}>
                      {option}
                    </span>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
                          <CheckCircle2 size={17} color={catMeta?.accent} style={{ flexShrink: 0 }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={goToPrevious}
            disabled={currentQuestion === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 10, border: 'none',
              background: currentQuestion === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              color: currentQuestion === 0 ? (isDark ? '#374151' : '#d1d5db') : tSec,
              fontSize: 13, fontWeight: 600, cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <ChevronLeft size={15} /> Previous
          </button>

          <span style={{ fontSize: 11, color: isDark ? '#374151' : '#9ca3af' }}>
            {answeredCount}/{PRETEST_QUESTIONS.length}
          </span>

          {isLastQuestion ? (
            <motion.button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '9px 20px', borderRadius: 10, border: 'none',
                background: allAnswered && !isSubmitting
                  ? 'linear-gradient(135deg,#10b981,#059669)'
                  : isDark ? '#1e2230' : '#e5e7eb',
                color: allAnswered && !isSubmitting ? '#fff' : (isDark ? '#374151' : '#9ca3af'),
                fontSize: 13, fontWeight: 700, cursor: allAnswered && !isSubmitting ? 'pointer' : 'not-allowed',
                boxShadow: allAnswered && !isSubmitting ? '0 3px 12px rgba(16,185,129,0.35)' : 'none',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {isSubmitting ? 'Submitting…' : <><CheckCircle2 size={14} /> Submit</>}
            </motion.button>
          ) : (
            <motion.button
              onClick={goToNext}
              disabled={!answers[question.id]}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '9px 20px', borderRadius: 10, border: 'none',
                background: answers[question.id]
                  ? 'linear-gradient(135deg,#3b82f6,#6366f1)'
                  : isDark ? '#1e2230' : '#e5e7eb',
                color: answers[question.id] ? '#fff' : (isDark ? '#374151' : '#9ca3af'),
                fontSize: 13, fontWeight: 700, cursor: answers[question.id] ? 'pointer' : 'not-allowed',
                boxShadow: answers[question.id] ? '0 3px 12px rgba(99,102,241,0.35)' : 'none',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              Next <ChevronRight size={14} />
            </motion.button>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: isDark ? '#374151' : '#9ca3af', paddingBottom: 4 }}>
          You cannot change answers after submission
        </p>
      </motion.div>
    </div>
  );
};

export default PretestPage;