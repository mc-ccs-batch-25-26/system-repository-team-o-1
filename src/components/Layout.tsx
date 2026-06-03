import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ProfileModal from "./ProfileModal";
import { supabase } from '../supabase/supabaseClient';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [profileUsername, setProfileUsername] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileCreatedAt, setProfileCreatedAt] = useState('');
  const [profileVersion, setProfileVersion] = useState(0);

  const isDarkMode = true;

  useEffect(() => {
    document.body.className = 'dark-bg dark';
    document.documentElement.style.backgroundColor = '#09090b'; 
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
         .select('username, avatar_url, created_at, role, last_active_at, streak_count, daily_xp, weekly_xp, monthly_xp, last_xp_reset')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setProfileUsername(profile.username || session.user.email?.split('@')[0] || '');
          setProfileAvatarUrl(profile.avatar_url);
          setProfileCreatedAt(profile.created_at || '');
          setIsAdmin(profile.role === 'admin' || profile.role === 'super_admin');

          // Skip streak/XP logic for admins
          if (profile.role !== 'admin' && profile.role !== 'super_admin') {
            
            // Get current UTC time from database (single source of truth)
            const { data: dbTime } = await supabase.rpc('get_current_utc_time');
            const now = dbTime ? new Date(dbTime) : new Date();
            
            // Calculate UTC-based date strings
            const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const yesterdayUTC = new Date(todayUTC.getTime() - 86400000);
            
            // Format as YYYY-MM-DD in UTC
            const todayStr = todayUTC.toISOString().split('T')[0];
            const yesterdayStr = yesterdayUTC.toISOString().split('T')[0];
            
            // Parse user's last active date (from database)
            const lastActive = profile.last_active_at;
            const lastActiveDate = lastActive ? new Date(lastActive) : null;
            const lastActiveStr = lastActiveDate 
              ? new Date(Date.UTC(lastActiveDate.getUTCFullYear(), lastActiveDate.getUTCMonth(), lastActiveDate.getUTCDate())).toISOString().split('T')[0]
              : null;
            
            const currentStreak = profile.streak_count || 0;

            // XP reset logic using UTC
            const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
            const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

            const lastReset = profile.last_xp_reset ? new Date(profile.last_xp_reset) : null;
            const needsDailyReset = !lastReset || lastReset.toISOString().split('T')[0] !== todayStr;
            const needsWeeklyReset = !lastReset || lastReset < weekStart;
            const needsMonthlyReset = !lastReset || lastReset < monthStart;

            const updates: any = {};
            if (needsDailyReset) updates.daily_xp = 0;
            if (needsWeeklyReset) updates.weekly_xp = 0;
            if (needsMonthlyReset) updates.monthly_xp = 0;

            if (Object.keys(updates).length > 0) {
              updates.last_xp_reset = now.toISOString();
              await supabase.from('profiles').update(updates).eq('id', session.user.id);
            }

            // Calculate streak using UTC dates
            let newStreak = currentStreak;
            if (lastActiveStr === todayStr) {
              // Already logged in today — no change
            } else if (lastActiveStr === yesterdayStr) {
              // Consecutive day — increment
              newStreak = currentStreak + 1;
            } else {
              // Streak broken — reset
              newStreak = 1;
            }

            await supabase.from('profiles').update({
              streak_count: newStreak,
              last_active_at: todayStr
            }).eq('id', session.user.id);
          }
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleProfileUpdated = (newUsername: string, newAvatarUrl: string | null) => {
    setProfileUsername(newUsername);
    setProfileAvatarUrl(newAvatarUrl);
    setProfileVersion(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar
        isDarkMode={isDarkMode}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onProfileClick={() => setIsProfileModalOpen(true)}
        avatarUrl={profileAvatarUrl}
        username={profileUsername}
        userEmail={currentUser?.email || ''}
        isAdmin={isAdmin}
      />
      <div className={`flex-1 transition-all duration-300 flex flex-col min-h-screen w-full ${
        isCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <Outlet key={profileVersion} context={{
          isDarkMode,
          currentUser,
          isMobileMenuOpen,
          setIsMobileMenuOpen,
          isUserAdmin: isAdmin
        }} />
      </div>

      {isProfileModalOpen && currentUser && (
        <ProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          userId={currentUser.id}
          initialUsername={profileUsername}
          initialAvatarUrl={profileAvatarUrl}
          memberSince={profileCreatedAt}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
};

export default Layout;