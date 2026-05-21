import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabase/supabaseClient';
import { ClipboardList } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// Quiz mode components
import QuizHub, { QuizMode } from './components/quiz/QuizHub';
import DailyQuiz from './components/quiz/DailyQuiz';
import PracticeMode from './components/quiz/PracticeMode';
import MockExam from './components/quiz/MockExam';
import TimedChallenge from './components/quiz/TimedChallenge';
import MistakeNotebook from './components/quiz/MistakeNotebook';

const QuizzesPage = () => {
  const { isDarkMode } = useOutletContext<any>();
  const textClass    = isDarkMode ? 'text-white'    : 'text-zinc-900';
  const subtextClass = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
  const cardBg       = isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300';

  const [mode, setMode] = useState<QuizMode>('hub');
  const [pretestChecked, setPretestChecked] = useState(false);
  const [pretestLoading, setPretestLoading] = useState(true);
  const [streakCount, setStreakCount] = useState(0);
  const [practiceCategory, setPracticeCategory] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

   useEffect(() => {
  const checkPretest = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPretestLoading(false); return; }
      const { data } = await supabase
        .from('profiles')
        .select('pretest_done, streak_count')
        .eq('id', user.id)
        .single();
      setPretestChecked(data?.pretest_done === true);
      setStreakCount(data?.streak_count || 0);
      setPretestLoading(false);
       if (searchParams.get('mode') === 'daily') {
      setMode('daily');
    }
    };
    checkPretest();
  }, []);

  const handleStartPractice = (category: string) => {
    setPracticeCategory(category);
    setMode('practice');
  };

  const handleOpenAIReview = (category: string) => {
    const event = new CustomEvent('civiquest-ai-review', {
      detail: { message: `Help me improve my ${category}. I've been struggling with this topic in my Civil Service Exam preparation. Can you explain key concepts and give me tips?` }
    });
    window.dispatchEvent(event);
  };

  const handleBackToHub = () => {
    setMode('hub');
    setPracticeCategory(null);
  };

  // LOADING
  if (pretestLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-blue-500" />
          <p className={`text-sm ${subtextClass}`}>Loading your profile…</p>
        </div>
      </div>
    );
  }

  // PRE-TEST GATE
  if (!pretestChecked) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-md mx-auto mt-12">
          <div className={`${cardBg} rounded-2xl border p-8 text-center space-y-5 shadow-sm`}>
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <ClipboardList className="w-7 h-7 text-blue-500" />
            </div>
            <div className="space-y-2">
              <h2 className={`text-xl font-bold ${textClass}`}>Diagnostic Pre-Test Required</h2>
              <p className={`text-sm leading-relaxed ${subtextClass}`}>
                Complete the pre-test first so CiviQuest can identify your strengths and weaknesses, and personalize your quizzes.
              </p>
            </div>
            <div className={`rounded-xl p-4 text-left space-y-2 ${isDarkMode ? 'bg-zinc-700/50' : 'bg-zinc-50'}`}>
              {['Identifies your weak areas', 'Personalizes your quiz order', 'Unlocks all quiz modes'].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className={`text-sm ${subtextClass}`}>{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => window.location.href = '/pretest'}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Take Pre-Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MODE ROUTER — untouched
  switch (mode) {
    case 'daily':
      return <DailyQuiz isDarkMode={isDarkMode} onBack={handleBackToHub} onStartPractice={handleStartPractice} onOpenAIReview={handleOpenAIReview} />;
    case 'practice':
      return <PracticeMode isDarkMode={isDarkMode} onBack={handleBackToHub} onOpenAIReview={handleOpenAIReview} preSelectedCategory={practiceCategory} />;
    case 'mock':
      return <MockExam isDarkMode={isDarkMode} onBack={handleBackToHub} onStartPractice={handleStartPractice} onOpenAIReview={handleOpenAIReview} />;
    case 'challenge':
      return <TimedChallenge isDarkMode={isDarkMode} onBack={handleBackToHub} />;
    case 'mistakes':
      return <MistakeNotebook isDarkMode={isDarkMode} onBack={handleBackToHub} />;
    default:
      return <QuizHub onSelectMode={setMode} isDarkMode={isDarkMode} streakCount={streakCount} />;
  }
};

export default QuizzesPage;