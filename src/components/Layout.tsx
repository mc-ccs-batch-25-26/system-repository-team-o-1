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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  // Theme effect
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-bg dark' : 'light-bg';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Auth effect
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        // Fetch profile for modal
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, created_at')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setProfileUsername(profile.username || session.user.email?.split('@')[0] || '');
          setProfileAvatarUrl(profile.avatar_url);
          setProfileCreatedAt(profile.created_at || '');
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
  };

  const bgClass = isDarkMode ? "dark-bg" : "light-bg";
  const textClass = isDarkMode ? "dark-text" : "light-text";

  return (
    <div className={`min-h-screen flex ${bgClass} ${textClass}`}>
      <Sidebar
     isDarkMode={isDarkMode}
     isOpen={isMobileMenuOpen}
     setIsOpen={setIsMobileMenuOpen}
     isCollapsed={isCollapsed}
     setIsCollapsed={setIsCollapsed}
     onProfileClick={() => setIsProfileModalOpen(true)}
     avatarUrl={profileAvatarUrl}      // ADD
     username={profileUsername}        // ADD
     userEmail={currentUser?.email || ''}  // ADD
      />
      <div className={`flex-1 transition-all duration-300 flex flex-col min-h-screen w-full ${
        isCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <Outlet context={{
          isDarkMode,
          toggleTheme,
          currentUser,
          isMobileMenuOpen,
          setIsMobileMenuOpen,
          isUserAdmin: false
        }} />
        <div className="fixed bottom-4 right-4 z-[45]">
          <FloatingChatbot position="bottom-right" />
        </div>
      </div>

      {/* Profile Modal */}
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