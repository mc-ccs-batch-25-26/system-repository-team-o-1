import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, LogOut, SignalHigh, ChevronsLeft, ChevronsRight, Book, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from './UserAvatar';

interface SidebarProps {
    isDarkMode: boolean;
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    onProfileClick: () => void;
    avatarUrl: string | null;
    username: string;
    userEmail: string;
}

const navItems = [
    { path: '/',         icon: Home,       label: 'Dashboard' },
    { path: '/quizzes',  icon: Clock,      label: 'Practice'  },
    { path: '/lessons',  icon: Book,       label: 'Study'     },
    { path: '/progress', icon: SignalHigh, label: 'Progress'  },
    { path: '/settings', icon: Settings,   label: 'Settings'  },
];

const Sidebar = ({
    isDarkMode, isOpen, setIsOpen, isCollapsed, setIsCollapsed,
    onProfileClick, avatarUrl, username, userEmail,
}: SidebarProps) => {
    const location = useLocation();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setShowLogoutDialog(false);
    };

    const sidebarWidth = isCollapsed ? 'w-[60px]' : 'w-64';
    const sidebarTranslate = isOpen ? 'translate-x-0' : '-translate-x-full';

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div
                className={`
                    fixed inset-y-0 left-0 z-50 flex flex-col
                    border-r border-slate-300 dark:border-slate-700
                    transition-all duration-300
                    ${sidebarTranslate} md:translate-x-0 ${sidebarWidth}
                `}
                style={{ backgroundColor: isDarkMode ? '#18181b' : '#ffffff' }}
            >
                {/* Header */}
              <div className="h-[60px] flex items-center px-2 border-b border-slate-200 dark:border-slate-700 shrink-0">
    <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white">
            <img src="/System Logo.png" alt="CiviQuest" className="w-11 h-11 object-contain" />
        </div>
        {!isCollapsed && (
            <span className="text-lg font-bold whitespace-nowrap text-slate-900 dark:text-slate-50 tracking-tight">
                CiviQuest
            </span>
        )}
    </div>
</div>

{/* Collapse button — outside header, top-right */}
<button
    onClick={() => setIsCollapsed(!isCollapsed)}
    title={isCollapsed ? 'Expand' : 'Collapse'}
    className="absolute top-[18px] -right-3 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shadow-sm transition-all duration-200 z-10"
>
    {isCollapsed ? <ChevronsRight className="w-3.5 h-3.5" /> : <ChevronsLeft className="w-3.5 h-3.5" />}
</button>

                {/* Nav */}
                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => {
                        const isActive = item.path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                title={isCollapsed ? item.label : undefined}
                                className={`
                                    group relative flex items-center gap-3 px-2.5 py-2 rounded-xl
                                    text-sm font-medium transition-all duration-200
                                    ${isCollapsed ? 'justify-center' : ''}
                                    ${isActive
                                        ? 'bg-blue-800 text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                                    }
                                `}
                            >
                                {isActive && !isCollapsed && (
                                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white/40" />
                                )}
                                <item.icon className={`w-[18px] h-[18px] shrink-0 ${!isActive && 'group-hover:translate-x-0.5'}`} />
                                {!isCollapsed && (
                                    <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                                )}
                                {isCollapsed && (
                                    <span className="pointer-events-none absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-slate-800 dark:bg-slate-100 text-slate-50 dark:text-slate-900 opacity-0 group-hover:opacity-100 shadow-lg z-50">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className="px-2 py-2 border-t border-slate-200 dark:border-slate-700 shrink-0 space-y-0.5">
                    {!isCollapsed ? (
                        <button onClick={onProfileClick} className="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 text-left">
                            <UserAvatar avatarUrl={avatarUrl} username={username} size={32} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-50">{username}</p>
                                <p className="text-[11px] truncate text-slate-500 dark:text-slate-400">{userEmail}</p>
                            </div>
                        </button>
                    ) : (
                        <button onClick={onProfileClick} title={username} className="group relative flex justify-center w-full py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <UserAvatar avatarUrl={avatarUrl} username={username} size={30} />
                            <span className="pointer-events-none absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 dark:bg-slate-100 text-slate-50 dark:text-slate-900 opacity-0 group-hover:opacity-100 shadow-lg z-50">{username}</span>
                        </button>
                    )}
                    <button onClick={() => setShowLogoutDialog(true)} title={isCollapsed ? 'Logout' : undefined}
                        className={`group relative flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut className="w-[18px] h-[18px] shrink-0" />
                        {!isCollapsed && <span>Logout</span>}
                        {isCollapsed && <span className="pointer-events-none absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 dark:bg-slate-100 text-slate-50 dark:text-slate-900 opacity-0 group-hover:opacity-100 shadow-lg z-50">Logout</span>}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showLogoutDialog && (
                    <motion.div key="dialog-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 4 }} transition={{ duration: 0.22 }} className="w-full max-w-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0"><AlertCircle className="w-4.5 h-4.5 text-rose-500" /></div>
                                <div><h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Sign out of CiviQuest?</h3><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your progress is saved. You can sign back in anytime.</p></div>
                            </div>
                            <div className="flex gap-2.5">
                                <button onClick={() => setShowLogoutDialog(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
                                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white transition-all">Sign Out</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar; 