import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Timer, Flame, Trophy, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/supabaseClient';
import { MOCK_QUESTIONS, MockQuestion, shuffleArray } from '../../data/mockQuestions';
import QuizEngine from './QuizEngine';

interface TimedChallengeProps {
  isDarkMode: boolean;
  onBack: () => void;
}

const CHALLENGE_DURATION = 5 * 60; // 5 minutes

const TimedChallenge = ({ isDarkMode, onBack }: TimedChallengeProps) => {
  const textClass = isDarkMode ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200';
  const btnPrimary = 'bg-rose-600 hover:bg-rose-700 text-white';

  const [phase, setPhase] = useState<'start' | 'challenge' | 'results'>('start');
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_DURATION);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showComboEffect, setShowComboEffect] = useState(false);
  const sessionRef = useRef<string | null>(null);

  // Personal best from localStorage
  const [personalBest, setPersonalBest] = useState<{ score: number; questions: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('civiquest_timed_challenge_best');
    if (saved) setPersonalBest(JSON.parse(saved));
  }, []);

  const currentQuestion = questions[currentIndex];

  // Timer
  useEffect(() => {
    if (phase !== 'challenge') return;
    if (timeLeft <= 0) {
      finishChallenge();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const startChallenge = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: session } = await supabase.from('quiz_sessions').insert({
        user_id: user.id,
        is_pretest: false,
        is_timed: true,
      }).select().single();
      if (session) sessionRef.current = session.id;
    }

    // Shuffle all questions — large pool for speed quiz
    const allQs = shuffleArray(Object.values(MOCK_QUESTIONS).flat());
    setQuestions(allQs);
    setPhase('challenge');
    setCurrentIndex(0);
    setAnswers({});
    setPoints(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTimeLeft(CHALLENGE_DURATION);
  };

  const handleAnswer = async (questionId: string, selected: string) => {
    if (answers[questionId]) return;
    const q = questions.find(q => q.id === questionId)!;
    const isCorrect = selected === q.correct;
    setAnswers(prev => ({ ...prev, [questionId]: selected }));

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      setCorrectCount(prev => prev + 1);

      // Points: base 100 + speed bonus + combo multiplier
      const speedBonus = Math.floor(timeLeft / 30) * 10; // More time left = more bonus
      const comboMultiplier = Math.min(newCombo, 5); // Max 5x
      const earned = (100 + speedBonus) * comboMultiplier;
      setPoints(prev => prev + earned);

      // Visual combo effect
      if (newCombo >= 3) {
        setShowComboEffect(true);
        setTimeout(() => setShowComboEffect(false), 1000);
      }
    } else {
      setCombo(0);
    }

    // Save to Supabase
    if (sessionRef.current) {
      try {
        await supabase.from('quiz_session_answers').insert({
          session_id: sessionRef.current,
          question_id: questionId,
          selected_answer: selected,
          is_correct: isCorrect,
        });
      } catch (err) {
        console.error('Failed to save answer:', err);
      }
    }

    // Auto-advance to next question
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        finishChallenge();
      }
    }, 500);
  };

  const finishChallenge = async () => {
    const questionsAttempted = Object.keys(answers).length;
    setPhase('results');

    // Check personal best
    const currentBest = personalBest;
    if (!currentBest || points > currentBest.score) {
      const newBest = { score: points, questions: questionsAttempted };
      localStorage.setItem('civiquest_timed_challenge_best', JSON.stringify(newBest));
      setPersonalBest(newBest);
    }

    // Update XP
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const earnedXP = Math.floor(points / 50);
    const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', user.id).single();
    if (profile) {
      const newXP = (profile.xp || 0) + earnedXP;
      const newLevel = Math.floor(newXP / 500) + 1;
      await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', user.id);
    }

    if (sessionRef.current) {
      await supabase.from('quiz_sessions').update({
        score: correctCount,
        ended_at: new Date().toISOString(),
      }).eq('id', sessionRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const questionsAttempted = Object.keys(answers).length;

  // START SCREEN
  if (phase === 'start') {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
        <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium ${subtextClass} hover:${textClass} transition-colors`}>
          <ArrowLeft className="w-4 h-4" /> Back to Quiz Hub
        </button>

        <div className={`${cardBg} rounded-2xl p-8 md:p-11 border shadow-sm space-y-8`}>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-rose-900/30' : 'bg-rose-50'}`}>
              <Timer className="w-7 h-7 text-rose-500" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${textClass}`}>Timed Challenge</h1>
              <p className={`text-sm mt-1 leading-relaxed ${subtextClass}`}>
                Answer as many questions as you can in 5 minutes!
              </p>
            </div>
          </div>

          <div className={`rounded-xl p-4 space-y-3 ${isDarkMode ? 'bg-zinc-800/60' : 'bg-zinc-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>Rules of the Challenge</p>
            {[
              { icon: Zap, bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50', color: 'text-yellow-500', text: 'Speed bonus — faster answers earn more points' },
              { icon: Flame, bg: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50', color: 'text-orange-500', text: 'Combo multiplier — consecutive correct answers multiply score' },
              { icon: Trophy, bg: isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50', color: 'text-amber-500', text: 'Beat your personal best!' },
            ].map(({ icon: Icon, bg, color, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`text-sm leading-relaxed ${textClass}`}>
                  {text}
                </div>
              </div>
            ))}
          </div>

          {personalBest && (
            <div className={`p-4 rounded-xl border text-center ${isDarkMode ? 'bg-amber-900/20 border-amber-700/30' : 'bg-amber-50 border-amber-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>Your Personal Best</p>
              <p className={`text-3xl font-bold text-amber-500 mt-1`}>{personalBest.score.toLocaleString()} pts</p>
              <p className={`text-xs ${subtextClass} mt-1`}>{personalBest.questions} questions in 5 min</p>
            </div>
          )}

          <button onClick={startChallenge} className={`w-full py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>
            Start Challenge
          </button>
        </div>
      </div>
    );
  }

  // RESULTS
  if (phase === 'results') {
    const isNewBest = personalBest && points >= personalBest.score;
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 space-y-5">
        <div className="text-center space-y-1">
          <h1 className={`text-2xl font-bold ${textClass}`}>
            {isNewBest ? 'New Personal Best! 🏆' : 'Challenge Over! ⏱️'}
          </h1>
          <p className={`text-sm ${subtextClass}`}>Here's your performance</p>
        </div>

        <div className={`${cardBg} rounded-2xl border p-7 text-center shadow-sm`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>Total Points</p>
          <div className="text-6xl font-bold text-rose-500 mt-2 mb-4">{points.toLocaleString()}</div>

          <div className="grid grid-cols-3 gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-2">
            <div>
              <p className={`text-2xl font-bold ${textClass}`}>{questionsAttempted}</p>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Attempted</p>
            </div>
            <div className="border-x border-zinc-200 dark:border-zinc-800">
              <p className={`text-2xl font-bold text-emerald-500`}>{correctCount}</p>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Correct</p>
            </div>
            <div>
              <p className={`text-2xl font-bold text-orange-500`}>{maxCombo}x</p>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Max Combo</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-4">+{Math.floor(points / 50)} XP earned</p>
        </div>

        {personalBest && !isNewBest && (
          <div className={`p-4 rounded-xl border text-center ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-zinc-50 border-zinc-200'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>Personal Best</p>
            <p className={`text-xl font-bold text-amber-500 mt-1`}>{personalBest.score.toLocaleString()} pts</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => setPhase('start')} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>
            Try Again
          </button>
          <button onClick={onBack} className={`flex-1 py-3.5 rounded-xl font-semibold text-sm border transition-colors ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}>
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  // CHALLENGE IN PROGRESS
  const timerPercent = (timeLeft / CHALLENGE_DURATION) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Stats bar */}
      <div className={`sticky top-4 z-10 py-3.5 px-5 rounded-2xl border shadow-sm backdrop-blur-md ${
        timeLeft < 30
          ? isDarkMode ? 'bg-red-900/80 border-red-700' : 'bg-red-50/90 border-red-200'
          : timeLeft < 60
          ? isDarkMode ? 'bg-yellow-900/80 border-yellow-700' : 'bg-yellow-50/90 border-yellow-200'
          : isDarkMode ? 'bg-zinc-800/80 border-zinc-700' : 'bg-white/90 border-zinc-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className={`p-1.5 rounded-lg border ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-700' : 'border-zinc-200 hover:bg-zinc-100'} transition-colors hidden sm:block`}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Points</p>
              <p className={`text-lg font-bold ${textClass}`}>{points.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
            <div>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${subtextClass}`}>Combo</p>
              <p className={`text-lg font-bold ${combo >= 3 ? 'text-orange-500' : textClass}`}>
                {combo > 0 ? `${combo}x` : '-'}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${
            timeLeft < 30 ? 'text-red-500 animate-pulse' : timeLeft < 60 ? 'text-yellow-600 dark:text-yellow-500' : 'text-rose-500'
          }`}>
            <Timer className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className={`w-full rounded-full h-1.5 mt-3 overflow-hidden ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
          <motion.div 
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 1, ease: 'linear' }}
            className={`h-1.5 rounded-full ${timeLeft < 60 ? 'bg-red-500' : 'bg-rose-500'}`} 
          />
        </div>
      </div>

      {/* Combo effect */}
      {showComboEffect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="text-center"
        >
          <span className="text-2xl font-black text-orange-500 drop-shadow-lg">
            🔥 {combo}x COMBO!
          </span>
        </motion.div>
      )}

      {/* Question — instant feedback, no AI explanation */}
      {currentQuestion && (
        <QuizEngine
          question={currentQuestion}
          questionIndex={currentIndex}
          totalQuestions={questions.length}
          selectedAnswer={answers[currentQuestion.id] || null}
          onAnswer={handleAnswer}
          showFeedback={true}
          showAIExplanation={false}
          aiExplanationText=""
          loadingAI={false}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default TimedChallenge;
