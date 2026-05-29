import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { supabase } from '../supabase/supabaseClient';

const AdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

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
          .select('username, avatar_url')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setProfileUsername(profile.username || 'Admin');
          setProfileAvatarUrl(profile.avatar_url);
        }
      }
    };
    checkSession();
  }, []);

  return (
    <div className="min-h-screen flex">
      <AdminSidebar
        isDarkMode={isDarkMode}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onProfileClick={() => {}}
        avatarUrl={profileAvatarUrl}
        username={profileUsername}
        userEmail={currentUser?.email || ''}
      />
      <div className={`flex-1 transition-all duration-300 flex flex-col min-h-screen w-full ${
        isCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <Outlet context={{ isDarkMode, currentUser }} />
      </div>
    </div>
  );
};

export default AdminLayout;