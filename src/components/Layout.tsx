import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ProfileModal from "./ProfileModal";
import { supabase } from '../supabase/supabaseClient';
import FloatingChatbot from "./FloatingChatbot";

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
          .select('username, avatar_url, created_at, last_active_date, streak_count')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setProfileUsername(profile.username || session.user.email?.split('@')[0] || '');
          setProfileAvatarUrl(profile.avatar_url);
          setProfileCreatedAt(profile.created_at || '');

          // Streak logic
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const lastActive = profile.last_active_date;
          const currentStreak = profile.streak_count || 0;

          let newStreak = currentStreak;
          if (lastActive === today) {
            // Already logged in today — no change
          } else if (lastActive === yesterday) {
            newStreak = currentStreak + 1;
          } else {
            newStreak = 1;
          }

          await supabase.from('profiles').update({
            streak_count: newStreak,
            last_active_date: today
          }).eq('id', session.user.id);
        }
      } else {
        setCurrentUser(null);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        setCurrentUser(null);
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
      />
      <div className={`flex-1 transition-all duration-300 flex flex-col min-h-screen w-full ${
        isCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <Outlet key={profileVersion} context={{
          isDarkMode,
          currentUser,
          isMobileMenuOpen,
          setIsMobileMenuOpen,
          isUserAdmin: false
        }} />
        <div className="fixed bottom-4 right-4 z-[45]">
          <FloatingChatbot position="bottom-right" />
        </div>
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