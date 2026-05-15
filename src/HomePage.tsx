import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from "react-router-dom";
import { Flame, Target, TrendingUp, Award, Zap, BookOpen, Lock } from 'lucide-react';
import Footer from './components/footer/Footer';
import UserAvatar from './components/UserAvatar';
import ProfileModal from './components/ProfileModal';
import { supabase } from './supabase/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const Confetti = () => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    size: 6 + Math.random() * 6,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', x: (Math.random() - 0.5) * 150, opacity: [1, 0.8, 0.3, 0], rotate: p.rotate + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', left: p.left, top: 0, width: p.size, height: p.size * 0.6, backgroundColor: p.color, borderRadius: '2px' }}
        />
      ))}
    </div>
  );
};

function HomePage() {
  const { isDarkMode } = useOutletContext<any>();
  const navigate = useNavigate();
  const [previousLevel, setPreviousLevel] = useState(() => {
  const saved = localStorage.getItem('civiquest_previous_level');
  return saved ? parseInt(saved) : 1;
});
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentUserSession, setCurrentUserSession] = useState<string | null>(null);

  const [civiquestUser, setCiviquestUser] = useState({
    username: 'Aspirant', avatarUrl: null as string | null, xp: 0, level: 1, streak: 0, pretestDone: false, readiness: 0, created_at: '',
  });
  const [weakAreas, setWeakAreas] = useState<{ category: string; accuracy: number }[]>([]);
  const [recentQuiz, setRecentQuiz] = useState({ date: 'Not yet', score: 0, total: 0, accuracy: 0 });

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserSession(user.id);

      const [profileRes, perfRes, sessionRes] = await Promise.all([
        supabase.from('profiles').select('username, avatar_url, xp, level, pretest_done, streak_count, created_at').eq('id', user.id).single(),
        supabase.from('performance').select('accuracy_rate, category_id').eq('user_id', user.id).order('accuracy_rate', { ascending: true }),
        supabase.from('quiz_sessions').select('score, ended_at').eq('user_id', user.id).eq('is_pretest', false).order('ended_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      const { data: profile, error: profileErr } = profileRes;
      const { data: perf } = perfRes;

      // Calculate average accuracy for readiness
      const avgAccuracy = perf && perf.length > 0
        ? perf.reduce((sum: number, p: any) => sum + (p.accuracy_rate || 0), 0) / perf.length
        : 0;

      if (!profileErr && profile) {
        const xp = profile.xp || 0;
        const newLevel = profile.level || 1;
        if (newLevel > previousLevel && previousLevel > 0) {
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 2000);
        }
        setPreviousLevel(newLevel);
        localStorage.setItem('civiquest_previous_level', String(newLevel));
        setPreviousLevel(newLevel);
        setCiviquestUser({
          username: profile.username || user.email?.split('@')[0] || 'Aspirant',
          avatarUrl: profile.avatar_url || null,
          xp, level: newLevel,
          streak: profile.streak_count || 0,
          pretestDone: profile.pretest_done || false,
          readiness: profile.pretest_done 
            ? Math.round(((xp % 500) / 500) * 50 + avgAccuracy * 0.5)
            : 0,
          created_at: profile.created_at || '',
        });
      }

      if (perf && perf.length > 0) {
        const { data: categories } = await supabase.from('categories').select('id, name');
        setWeakAreas(perf.slice(0, 3).map((p: any) => ({
          category: categories?.find(c => c.id === p.category_id)?.name || 'Unknown',
          accuracy: Math.round(p.accuracy_rate || 0),
        })));
      }

      const { data: lastSession } = sessionRes;
      if (lastSession) {
        setRecentQuiz({
          date: new Date(lastSession.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: lastSession.score || 0,
          total: 10,
          accuracy: Math.min(100, Math.round(((lastSession.score || 0) / 10) * 100)),
        });
      }

      setLoading(false);
    };
    loadDashboard();
  }, []);

  const textClass = isDarkMode ? "dark-text" : "light-text";
  const borderClass = isDarkMode ? "dark-border" : "light-border";
  const cardBgClass = isDarkMode ? "dark-card-bg" : "light-card-bg";
  const secondaryTextClass = isDarkMode ? "dark-secondary-text" : "light-secondary-text";
  const topicBgClass = isDarkMode ? "dark-topic-bg" : "light-topic-bg";
  const cardHover = 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300';

  if (loading) {
    return (
      <div className="flex flex-col w-full gap-4 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${cardBgClass} rounded-2xl p-6 border ${borderClass} animate-pulse`}>
            <div className="h-6 bg-gray-300 dark:bg-zinc-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-zinc-600 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {showLevelUp && <Confetti />}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-8 py-4 bg-gradient-to-r from-blue-400/10 to-blue-400/10 text-white rounded-2xl shadow-2xl text-center backdrop-blur-md"
          >
            <p className="text-sm font-bold uppercase tracking-wider">🎉 Level Up!</p>
            <p className="text-2xl font-extrabold">Level {civiquestUser.level}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`sticky top-0 z-30 px-4 py-3 flex justify-end items-center gap-4 backdrop-blur-md border-b ${isDarkMode ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white/70 border-zinc-200'}`}>
        <button onClick={() => setIsProfileModalOpen(true)} className="hover:opacity-80 transition-opacity">
          <UserAvatar avatarUrl={civiquestUser.avatarUrl} username={civiquestUser.username} size={40} className="w-10 h-10" />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`${cardBgClass} rounded-2xl p-6 border ${borderClass} shadow-lg mx-4 mt-4 ${cardHover}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${textClass}`}>Welcome back, {civiquestUser.username}! 👋</h1>
            <p className={`${secondaryTextClass} mt-1`}>
              {civiquestUser.pretestDone ? 'Your daily quiz is ready based on your weak areas.' : 'Start with the diagnostic pre-test to personalize your review.'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-orange-500/10 rounded-xl px-4 py-3">
            <Flame className="text-orange-500 w-6 h-6" />
            <div>
              <div className={`text-xl font-bold ${textClass}`}>{civiquestUser.streak} days</div>
              <div className={`text-xs ${secondaryTextClass}`}>Current Streak</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${textClass}`}>Level {civiquestUser.level}</span>
            <span className={`text-sm ${secondaryTextClass}`}>{civiquestUser.xp % 500} / 500 XP</span>
          </div>
          <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3">
            <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(((civiquestUser.xp % 500) / 500) * 100, 100)}%` }} />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`relative overflow-hidden rounded-2xl p-6 border ${borderClass} shadow-lg mx-4 mt-4 bg-gradient-to-br from-blue-600/5 to-cyan-500/5 dark:from-blue-900/20 dark:to-cyan-900/20 ${cardHover}`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke={isDarkMode ? '#3f3f46' : '#e5e7eb'} strokeWidth="10" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#3b82f6" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - civiquestUser.readiness / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold ${textClass}`}>{civiquestUser.readiness}%</span>
              <span className={`text-xs ${secondaryTextClass}`}>Ready</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-1 text-center md:text-left">
            <h3 className={`text-xl font-bold ${textClass}`}>
              {civiquestUser.pretestDone ? 'Continue Your Review' : 'Start Your Diagnostic Pre-Test'}
            </h3>
            <p className={`text-sm ${secondaryTextClass}`}>
              {civiquestUser.pretestDone ? 'Daily adaptive quiz targets your weakest areas first.' : 'Identify your strengths and weaknesses across all exam categories.'}
            </p>
            <div className="flex gap-3 mt-2 justify-center md:justify-start">
              <button onClick={() => navigate(civiquestUser.pretestDone ? '/quizzes' : '/pretest')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all flex items-center gap-2 hover:scale-105">
                <Zap className="w-5 h-5" /> {civiquestUser.pretestDone ? 'Start Daily Quiz' : 'Take Pre-Test'}
              </button>
              <button onClick={() => navigate('/lessons')} className={`border ${borderClass} ${textClass} px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all flex items-center gap-2`}>
                <BookOpen className="w-5 h-5" /> Lessons
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="main-content flex-grow">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mx-4 mt-4">
          <div className={`${topicBgClass} rounded-2xl p-6 border ${borderClass} shadow-lg ${cardHover}`}>
            <h3 className={`text-lg font-bold ${textClass} flex items-center gap-2 mb-4`}>
              <Target className="w-5 h-5 text-red-500" /> Weak Areas
            </h3>
            {weakAreas.length === 0 ? (
              <p className={`text-sm ${secondaryTextClass}`}>Complete the pre-test and quizzes to see your weak areas.</p>
            ) : (
              weakAreas.map((area) => (
                <div key={area.category} className="mb-3 last:mb-0">
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm ${textClass}`}>{area.category}</span>
                    <span className={`text-sm font-medium ${area.accuracy < 50 ? 'text-red-500' : area.accuracy < 70 ? 'text-yellow-500' : 'text-green-500'}`}>{area.accuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${area.accuracy < 50 ? 'bg-red-500' : area.accuracy < 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(area.accuracy, 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className={`${topicBgClass} rounded-2xl p-6 border ${borderClass} shadow-lg ${cardHover}`}>
            <h3 className={`text-lg font-bold ${textClass} flex items-center gap-2 mb-4`}>
              <TrendingUp className="w-5 h-5 text-green-500" /> Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${secondaryTextClass}`}>Last Quiz</span>
                <span className={`text-sm ${textClass}`}>{recentQuiz.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${secondaryTextClass}`}>Score</span>
                <span className={`text-sm font-bold ${textClass}`}>{recentQuiz.score}/{recentQuiz.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${secondaryTextClass}`}>Accuracy</span>
                <span className={`text-sm font-bold text-green-500`}>{recentQuiz.accuracy}%</span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(recentQuiz.accuracy, 100)}%` }} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className={`${cardBgClass} rounded-2xl p-6 border ${borderClass} shadow-lg mx-4 mt-4 ${cardHover}`}>
          <h3 className={`text-lg font-bold ${textClass} flex items-center gap-2 mb-4`}>
            <Award className="w-5 h-5 text-yellow-500" /> Recent Achievements
          </h3>
          <div className="flex gap-4 flex-wrap">
            {[
              { name: 'First Quiz', unlocked: civiquestUser.pretestDone, icon: '🎯' },
              { name: '3-Day Streak', unlocked: civiquestUser.streak >= 3, icon: '🔥' },
              { name: 'Perfect Score', unlocked: false, icon: '⭐' },
              { name: '10 Quizzes', unlocked: false, icon: '📚' },
            ].map((badge) => (
              <div key={badge.name} className={`flex flex-col items-center p-3 rounded-xl border transition-all ${badge.unlocked ? `${borderClass} hover:scale-105` : 'border-dashed border-zinc-300 dark:border-zinc-600 opacity-50 grayscale'}`}>
                <span className="text-2xl">{badge.icon}</span>
                <span className={`text-xs mt-1 ${textClass} flex items-center gap-1`}>
                  {badge.name}
                  {!badge.unlocked && <Lock className="w-3 h-3" />}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <Footer isDarkMode={isDarkMode} />

      {isProfileModalOpen && currentUserSession && (
        <ProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          userId={currentUserSession}
          initialUsername={civiquestUser.username}
          initialAvatarUrl={civiquestUser.avatarUrl}
          memberSince={civiquestUser.created_at}
          onProfileUpdated={(newUsername, newAvatarUrl) => {
            setCiviquestUser((prev) => ({
              ...prev,
              username: newUsername,
              avatarUrl: newAvatarUrl
            }));
          }}
        />
      )}
    </div>
  );
}

export default HomePage;