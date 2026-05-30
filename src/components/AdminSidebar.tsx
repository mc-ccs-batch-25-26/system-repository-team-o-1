import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronsLeft, ChevronsRight, Shield, Users, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from './UserAvatar';

interface AdminSidebarProps {
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

const adminNavItems = [
    { path: '/admin',       icon: Shield,  label: 'Dashboard' },
    { path: '/admin/users', icon: Users,   label: 'Users'  },
];

/* ─── tiny helpers ──────────────────────────────────────────── */
const cx = (...classes: (string | false | undefined)[]) =>
    classes.filter(Boolean).join(' ');

const AdminSidebar = ({
    isDarkMode, isOpen, setIsOpen, isCollapsed, setIsCollapsed,
    onProfileClick, avatarUrl, username, userEmail,
}: AdminSidebarProps) => {
    const location = useLocation();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setShowLogoutDialog(false);
    };

    /* ── spring variants ─────────────────────────────── */
    const sidebarVariants = {
        expanded:  { width: 256 },
        collapsed: { width: 68  },
    };

    const labelVariants = {
        visible: { opacity: 1, x: 0,   transition: { duration: 0.2, delay: 0.05 } },
        hidden:  { opacity: 0, x: -8,  transition: { duration: 0.15 } },
    };

    return (
        <>
            {/* ── Mobile overlay ─────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-40 md:hidden"
                        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ── Sidebar shell ──────────────────────────────────── */}
            <motion.aside
                variants={sidebarVariants}
                animate={isCollapsed ? 'collapsed' : 'expanded'}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className={cx(
                    'fixed inset-y-0 left-0 z-50 flex flex-col',
                    'border-r',
                    isDarkMode
                        ? 'border-white/[0.06] bg-[#0f0f12]'
                        : 'border-slate-200/80 bg-white',
                    !isOpen && '-translate-x-full md:translate-x-0',
                    'transition-transform duration-300 md:transition-none',
                )}
                style={{
                    boxShadow: isDarkMode
                        ? '4px 0 32px rgba(0,0,0,0.45), 1px 0 0 rgba(255,255,255,0.03)'
                        : '4px 0 24px rgba(0,0,0,0.07)',
                }}
            >

                {/* ── Subtle top-edge gradient accent ── */}
                <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                        background: 'linear-gradient(90deg, transparent, #f59e0b66, transparent)',
                    }}
                />

                {/* ── Logo header ────────────────────────────────── */}
                <div className={cx(
                    'relative h-[62px] flex items-center shrink-0 border-b overflow-hidden',
                    isDarkMode ? 'border-white/[0.05]' : 'border-slate-100',
                    isCollapsed ? 'justify-center px-0' : 'px-4',
                )}>
                    {/* Background glow */}
                    {!isCollapsed && (
                        <div
                            className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{
                                background: 'radial-gradient(ellipse at 0% 50%, #ffcc75 0%, transparent 65%)',
                            }}
                        />
                    )}

                    <motion.div
                        className="flex items-center gap-3 overflow-hidden"
                        layout
                    >
                        {/* Logo mark */}
                        <div className={cx(
                            'relative shrink-0 flex items-center justify-center rounded-xl',
                            'w-9 h-9',
                            isDarkMode
                                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 ring-1 ring-amber-500/30'
                                : 'bg-gradient-to-br from-amber-50 to-amber-100 ring-1 ring-amber-200',
                        )}>
                            <img
                                src="/System Logo.png"
                                alt="CiviQuest"
                                className="w-10 h-10 object-contain"
                            />
                        </div>

                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    variants={labelVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    className="flex flex-col leading-none overflow-hidden"
                                >
                                    <span className={cx(
                                        'text-[15px] font-bold tracking-tight whitespace-nowrap',
                                        isDarkMode ? 'text-white' : 'text-slate-900',
                                    )}>
                                        CiviQuest
                                    </span>
                                    <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-500 whitespace-nowrap mt-0.5">
                                        Admin
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* ── Collapse toggle ─────────────────────────────── */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className={cx(
                        'absolute top-[18px] -right-3.5 z-20',
                        'w-7 h-7 rounded-full flex items-center justify-center',
                        'border shadow-md transition-all duration-200',
                        'hover:scale-110 active:scale-95',
                        isDarkMode
                            ? 'bg-[#1a1a20] border-white/10 text-slate-400 hover:text-amber-400 hover:border-amber-500/40'
                            : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-300',
                    )}
                >
                    {isCollapsed
                        ? <ChevronsRight className="w-3.5 h-3.5" />
                        : <ChevronsLeft  className="w-3.5 h-3.5" />
                    }
                </button>

                {/* ── Admin role badge ────────────────────────────── */}
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 pt-4 pb-2"
                        >
                            <div className={cx(
                                'text-[10px] font-bold uppercase tracking-widest',
                                isDarkMode
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200',
                            )}>
                            
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Nav section label ───────────────────────────── */}
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cx(
                                'px-4 pb-1 text-[9px] font-bold uppercase tracking-[0.14em]',
                            )}
                        >
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* ── Nav items ───────────────────────────────────── */}
                <nav className={cx(
                    'flex-1 overflow-y-auto overflow-x-hidden py-1',
                    isCollapsed ? 'px-2' : 'px-3',
                    'space-y-0.5',
                )}>
                    {adminNavItems.map((item, i) => {
                        const isActive = location.pathname === item.path;

                        return (
                            <motion.div
                                key={item.path}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.25 }}
                            >
                                <Link
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    title={isCollapsed ? item.label : undefined}
                                    className={cx(
                                        'group relative flex items-center rounded-xl',
                                        'text-sm font-medium transition-all duration-200',
                                        isCollapsed
                                            ? 'justify-center w-full h-11'
                                            : 'gap-3 px-3 py-2.5',
                                        isActive
                                            ? isDarkMode
                                                ? 'bg-amber-500/15 text-amber-300'
                                                : 'bg-amber-50 text-amber-700'
                                            : isDarkMode
                                                ? 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
                                    )}
                                    style={isActive ? {
                                        boxShadow: isDarkMode
                                            ? 'inset 0 0 0 1px rgba(245,158,11,0.2)'
                                            : 'inset 0 0 0 1px rgba(245,158,11,0.25)',
                                    } : {}}
                                >
                                    {/* Active left accent bar */}
                                    {isActive && !isCollapsed && (
                                        <span
                                            className="absolute left-0 inset-y-2 w-0.5 rounded-full bg-amber-500"
                                        />
                                    )}

                                    {/* Active dot for collapsed */}
                                    {isActive && isCollapsed && (
                                        <span className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    )}

                                    <div className={cx(
                                        'flex items-center justify-center shrink-0 rounded-lg transition-all duration-200',
                                        isCollapsed ? 'w-9 h-9' : 'w-7 h-7',
                                        isActive
                                            ? isDarkMode
                                                ? 'bg-amber-500/20 text-amber-400'
                                                : 'bg-amber-100 text-amber-600'
                                            : 'group-hover:scale-105',
                                    )}>
                                        <item.icon className="w-[17px] h-[17px]" />
                                    </div>

                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.div
                                                variants={labelVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="flex-1 min-w-0"
                                            >
                                                <p className="whitespace-nowrap font-semibold leading-tight">
                                                    {item.label}
                                                </p>
                                                <p className={cx(
                                                    'text-[10px] font-normal leading-tight whitespace-nowrap',
                                                    isActive
                                                        ? isDarkMode ? 'text-amber-500/70' : 'text-amber-500/80'
                                                        : isDarkMode ? 'text-slate-600' : 'text-slate-400',
                                                )}>
                                                   
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Collapsed tooltip */}
                                    {isCollapsed && (
                                        <span className={cx(
                                            'pointer-events-none absolute left-full ml-3 z-50',
                                            'px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap',
                                            'shadow-xl opacity-0 group-hover:opacity-100',
                                            'transition-opacity duration-150',
                                            isDarkMode
                                                ? 'bg-[#1e1e26] text-white border border-white/10'
                                                : 'bg-slate-900 text-white',
                                        )}>
                                            {item.label}
                                            <span className={cx(
                                                'absolute left-[-4px] top-1/2 -translate-y-1/2',
                                                'w-2 h-2 rotate-45',
                                                isDarkMode ? 'bg-[#1e1e26]' : 'bg-slate-900',
                                            )} />
                                        </span>
                                    )}
                                </Link>
                            </motion.div>
                        );
                    })}
                </nav>

                {/* ── Bottom: user + logout ────────────────────────── */}
                <div className={cx(
                    'shrink-0 border-t',
                    isDarkMode ? 'border-white/[0.05]' : 'border-slate-100',
                    isCollapsed ? 'px-2 py-3' : 'px-3 py-3',
                    'space-y-1',
                )}>
                    {/* User card */}
                    {!isCollapsed ? (
                        <motion.button
                            onClick={onProfileClick}
                            whileHover={{ scale: 1.005 }}
                            whileTap={{ scale: 0.995 }}
                            className={cx(
                                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left',
                                'transition-all duration-200',
                                isDarkMode
                                    ? 'hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]'
                                    : 'hover:bg-slate-50 border border-transparent hover:border-slate-200',
                            )}
                        >
                            <div className="relative">
                                <UserAvatar avatarUrl={avatarUrl} username={username} size={34} />
                                <span
                                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2"
                                    style={{ borderColor: isDarkMode ? '#0f0f12' : '#ffffff' }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cx(
                                    'text-[13px] font-semibold truncate leading-tight',
                                    isDarkMode ? 'text-slate-100' : 'text-slate-900',
                                )}>{username}</p>
                                <p className={cx(
                                    'text-[10px] truncate leading-tight mt-0.5',
                                    isDarkMode ? 'text-slate-600' : 'text-slate-400',
                                )}>{userEmail}</p>
                            </div>
                        </motion.button>
                    ) : (
                        <button
                            onClick={onProfileClick}
                            title={username}
                            className={cx(
                                'group relative flex justify-center w-full py-2 rounded-xl',
                                'transition-all duration-200',
                                isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50',
                            )}
                        >
                            <div className="relative">
                                <UserAvatar avatarUrl={avatarUrl} username={username} size={30} />
                                <span
                                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2"
                                    style={{ borderColor: isDarkMode ? '#0f0f12' : '#ffffff' }}
                                />
                            </div>
                            <span className={cx(
                                'pointer-events-none absolute left-full ml-3 z-50',
                                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap',
                                'shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                                isDarkMode
                                    ? 'bg-[#1e1e26] text-white border border-white/10'
                                    : 'bg-slate-900 text-white',
                            )}>
                                {username}
                            </span>
                        </button>
                    )}

                    {/* Logout */}
                    <button
                        onClick={() => setShowLogoutDialog(true)}
                        title={isCollapsed ? 'Sign out' : undefined}
                        className={cx(
                            'group relative flex items-center w-full rounded-xl',
                            'text-sm font-medium transition-all duration-200',
                            isCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5',
                            isDarkMode
                                ? 'text-slate-600 hover:text-rose-400 hover:bg-rose-500/[0.08]'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50',
                        )}
                    >
                        <LogOut className="w-[17px] h-[17px] shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.span
                                    variants={labelVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                >
                                    Sign out
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {isCollapsed && (
                            <span className={cx(
                                'pointer-events-none absolute left-full ml-3 z-50',
                                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap',
                                'shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                                isDarkMode
                                    ? 'bg-[#1e1e26] text-rose-400 border border-rose-500/20'
                                    : 'bg-slate-900 text-white',
                            )}>
                                Sign out
                            </span>
                        )}
                    </button>
                </div>
            </motion.aside>

            {/* ── Logout confirmation dialog ───────────────────── */}
            <AnimatePresence>
                {showLogoutDialog && (
                    <motion.div
                        key="dialog-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center px-4"
                        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.93, y: 16 }}
                            animate={{ opacity: 1, scale: 1,    y: 0  }}
                            exit={{ opacity: 0,  scale: 0.95,   y: 8  }}
                            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                            className={cx(
                                'w-full max-w-sm rounded-2xl p-6 shadow-2xl border',
                                isDarkMode
                                    ? 'bg-[#13131a] border-white/[0.07]'
                                    : 'bg-white border-slate-200',
                            )}
                        >
                            {/* Icon + text */}
                            <div className="flex items-start gap-4 mb-5">
                                <div className={cx(
                                    'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                                    isDarkMode ? 'bg-rose-500/15' : 'bg-rose-50',
                                )}>
                                    <AlertCircle className="w-5 h-5 text-rose-500" />
                                </div>
                                <div className="pt-0.5">
                                    <h3 className={cx(
                                        'text-[15px] font-bold leading-tight',
                                        isDarkMode ? 'text-white' : 'text-slate-900',
                                    )}>
                                        Sign out of CiviQuest?
                                    </h3>
                                    <p className={cx(
                                        'text-[13px] mt-1 leading-relaxed',
                                        isDarkMode ? 'text-slate-500' : 'text-slate-500',
                                    )}>
                                        Your progress is saved. You can sign back in anytime.
                                    </p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className={cx('h-px mb-5', isDarkMode ? 'bg-white/[0.05]' : 'bg-slate-100')} />

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutDialog(false)}
                                    className={cx(
                                        'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                                        isDarkMode
                                            ? 'border border-white/10 text-slate-300 hover:bg-white/[0.04]'
                                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                                    )}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    onClick={handleLogout}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all duration-200 shadow-lg shadow-rose-500/20"
                                >
                                    Sign Out
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminSidebar;