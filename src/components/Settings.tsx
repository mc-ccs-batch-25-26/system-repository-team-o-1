import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, Moon, User, Settings as SettingsIcon } from 'lucide-react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import UserAvatar from './UserAvatar';

const Settings: React.FC = () => {
  const { isDarkMode, toggleTheme } = useOutletContext<any>();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  // Profile states
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Load from Supabase profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username || user.email?.split('@')[0] || '');
          setAvatarUrl(profile.avatar_url);
        }
      }
    };

    loadUserData();
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleClearProfileData = async () => {
    if (!currentUserId) return;
    const confirmed = window.confirm(
      'This will clear your quiz progress, performance data, and local settings. Your login account will remain active. Continue?'
    );
    if (!confirmed) return;
    
    setClearing(true);
    setClearError(null);
    try {
      // Step 1: Get user's session IDs
      const { data: sessions } = await supabase
        .from('quiz_sessions')
        .select('id')
        .eq('user_id', currentUserId);
      
      const sessionIds = sessions?.map(s => s.id) || [];

      // Step 2: Delete answers only for user's sessions
      if (sessionIds.length > 0) {
        await supabase
          .from('quiz_session_answers')
          .delete()
          .in('session_id', sessionIds);
      }

      // Step 3: Delete user's quiz sessions
      await supabase
        .from('quiz_sessions')
        .delete()
        .eq('user_id', currentUserId);

      // Step 4: Delete user's performance data
      await supabase
        .from('performance')
        .delete()
        .eq('user_id', currentUserId);

      // Step 5: Reset profile stats
      await supabase
        .from('profiles')
        .update({
          xp: 0,
          level: 1,
          pretest_done: false,
          streak_count: 0,
          last_active_date: null,
        })
        .eq('id', currentUserId);

      // Step 6: Clear local state
      localStorage.clear();
      
      // Step 7: Sign out
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error("Error clearing profile:", err);
      setClearError('Failed to clear data. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} p-4 md:p-8 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link to="/" className={`mr-4 p-2 rounded-full ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-300 text-zinc-600 hover:text-black'} transition-colors`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-6 w-6" />
              Settings
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Manage your preferences and account settings
            </p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Display Profile Section */}
          <section className={`rounded-xl border ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-white border-zinc-300'} overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-zinc-700/50' : 'border-zinc-300'}`}>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Display Profile
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <UserAvatar avatarUrl={avatarUrl} username={username || 'User'} size={48} />
                <div>
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {username || 'Not set'}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Click your avatar on the Home page to edit your profile
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Theme Section */}
          <section className={`rounded-xl border ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-white border-zinc-300'} overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-zinc-700/50' : 'border-zinc-300'}`}>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Appearance
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-medium">Theme Preference</h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isDarkMode ? "Dark mode is active" : "Light mode is active"}
                  </p>
                </div>
                <button
                  onClick={handleThemeToggle}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    isDarkMode ? 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-300'
                  }`}
                >
                  {isDarkMode ? <><Sun className="h-4 w-4" /> Switch to Light</> : <><Moon className="h-4 w-4" /> Switch to Dark</>}
                </button>
              </div>
            </div>
          </section>

          {/* Clear Data */}
          <section className={`rounded-xl border ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-white border-zinc-300'} overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-zinc-700/50' : 'border-zinc-300'}`}>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Data Management
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Clear your quiz progress, performance data, and reset your profile. Your login account will remain active.
              </p>
              {clearError && (
                <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{clearError}</p>
              )}
              <button
                onClick={handleClearProfileData}
                disabled={!currentUserId || clearing}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  isDarkMode
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                } disabled:opacity-50`}
              >
                {clearing ? 'Clearing...' : 'Clear Profile Data'}
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Settings;