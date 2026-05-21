import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, LogOut, GraduationCap, Clock, TrendingUp, ChevronsLeft, ChevronsRight, Book } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';
import { useState } from 'react';
import UserAvatar from './UserAvatar';

interface SidebarProps {
  isDarkMode: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  onProfileClick: () => void;
  avatarUrl: string | null;
  username: string;
  userEmail: string;
}

const Sidebar = ({ isDarkMode, isOpen, setIsOpen, isCollapsed, setIsCollapsed, onProfileClick, avatarUrl, username, userEmail }: SidebarProps) => {
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowLogoutDialog(false);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/quizzes', icon: Clock, label: 'Practice' },
    { path: '/lessons', icon: Book, label: 'Study' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const sidebarBg = isDarkMode ? 'bg-zinc-900 border-r border-zinc-800' : 'bg-white border-r border-zinc-200';
  const textColor = isDarkMode ? 'text-zinc-200' : 'text-zinc-600';
  const activeItemBg = 'bg-blue-900 text-white';
  const hoverItemBg = isDarkMode ? 'hover:bg-zinc-800/50 hover:text-white' : 'hover:bg-zinc-100 hover:text-black';
  const iconColor = isDarkMode ? 'text-white' : 'text-black';

  return (
    <>
      {isOpen && !isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${sidebarBg} flex flex-col`}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-3">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <GraduationCap className={`w-7 h-7 ${iconColor}`} />
            </div>
            <h1 className={`text-xl font-bold tracking-tight whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-black'}`}>
              CiviQuest
            </h1>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-black'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`group flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative
                  ${isCollapsed ? 'justify-center' : ''}
                  ${isActive 
                    ? `${activeItemBg} before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-full before:bg-white` 
                    : `${textColor} ${hoverItemBg}`
                  }`}
              >
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                    isActive ? 'text-current' : 'text-zinc-400 group-hover:text-current group-hover:translate-x-0.5'
                  }`}
                />
                {!isCollapsed && <span className="ml-3 whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        {!isCollapsed && (
          <div className={`px-3 py-3 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <button 
              onClick={onProfileClick}
              className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
            >
              <UserAvatar 
                avatarUrl={avatarUrl}
                username={username}
                size={36} 
              />
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {username}
                </p>
                <p className={`text-xs truncate ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {userEmail}
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Logout */}
        <div className={`p-3 flex-shrink-0 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            onClick={() => setShowLogoutDialog(true)}
            title={isCollapsed ? 'Logout' : undefined}
            className={`flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200
              text-red-400 hover:bg-red-500/10 hover:text-red-500
              ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`w-80 rounded-2xl p-6 shadow-2xl border ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Confirm Logout
            </h3>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Are you sure you want to logout?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;