import React, { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, Trash2, AlertTriangle, Mail, Shield, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import UserAvatar from './UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } },
};

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";
const primaryBtn = "w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white transition-all duration-200 disabled:opacity-50";
const dangerBtn = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all duration-200 disabled:opacity-50";

const SectionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <motion.div variants={fadeUp} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
    </motion.div>
);

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [clearing, setClearing] = useState(false);
    const [clearError, setClearError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState('');
    const [showAvatarDialog, setShowAvatarDialog] = useState(false);

    // Password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    const loadUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
            setUserEmail(user.email || '');
            const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single();
            if (profile) {
                setUsername(profile.username || user.email?.split('@')[0] || '');
                setAvatarUrl(profile.avatar_url);
            }
        }
    };

    useEffect(() => { loadUserData(); }, []);

    const handleClearProfileData = async () => {
        if (!currentUserId) return;
        setClearing(true); setClearError(null);
        try {
            const { data: sessions } = await supabase.from('quiz_sessions').select('id').eq('user_id', currentUserId);
            const sessionIds = sessions?.map(s => s.id) || [];
            if (sessionIds.length > 0) await supabase.from('quiz_session_answers').delete().in('session_id', sessionIds);
            await supabase.from('quiz_sessions').delete().eq('user_id', currentUserId);
            await supabase.from('performance').delete().eq('user_id', currentUserId);
            await supabase.from('lesson_progress').delete().eq('user_id', currentUserId);
            await supabase.from('pretest_results').delete().eq('user_id', currentUserId);
            await supabase.from('profiles').update({ xp: 0, level: 1, pretest_done: false, streak_count: 0, last_active_date: null }).eq('id', currentUserId);
            localStorage.clear();
            await supabase.auth.signOut();
            navigate('/login');
        } catch (err) { setClearError('Failed to clear data.'); }
        finally { setClearing(false); setShowConfirm(false); }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) return;
        if (newPassword.length < 6) { setPasswordError('New password must be at least 6 characters.'); return; }
        setChangingPassword(true); setPasswordError(null); setPasswordSuccess(null);
        try {
            // Re-authenticate with current password first
            const { error: signInError } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPassword });
            if (signInError) { setPasswordError('Current password is incorrect.'); setChangingPassword(false); return; }
            // Now update password
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPasswordSuccess('Password updated successfully!');
            setCurrentPassword(''); setNewPassword('');
        } catch (err: any) { setPasswordError(err.message || 'Failed to update password.'); }
        finally { setChangingPassword(false); }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <motion.div initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
                className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

                <motion.div variants={fadeUp}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Account</p>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Manage your preferences and account settings.</p>
                </motion.div>

                {/* Display Profile */}
                <SectionCard icon={<User className="w-4 h-4" />} title="Display Profile">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowAvatarDialog(true)} className="relative group shrink-0">
                            <UserAvatar avatarUrl={avatarUrl} username={username || 'User'} size={48} />
                            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <span className="text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                            </div>
                        </button>
                        <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{username || 'Not set'}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Edit your avatar and username from the sidebar profile.</p>
                        </div>
                    </div>
                </SectionCard>

                {/* Account Security */}
                <SectionCard icon={<Shield className="w-4 h-4" />} title="Account Security">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Account Email</label>
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                                <Mail className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">{userEmail || 'Not available'}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Change Password</label>
                            <AnimatePresence>
                                {passwordError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-rose-500">{passwordError}</motion.p>}
                                {passwordSuccess && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-emerald-500">{passwordSuccess}</motion.p>}
                            </AnimatePresence>
                            <input type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} />
                            <input type="password" placeholder="New password (min 6 characters)" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} />
                            <button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword} className={primaryBtn}>
                                {changingPassword ? 'Verifying…' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </SectionCard>

                {/* Data Management */}
                <SectionCard icon={<SettingsIcon className="w-4 h-4" />} title="Data Management">
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            This permanently clears your quiz progress, performance data, lesson history, and resets your profile stats. Your login account remains active.
                        </p>
                        <AnimatePresence>
                            {clearError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-rose-500">{clearError}</motion.p>}
                        </AnimatePresence>
                        <button onClick={() => setShowConfirm(true)} disabled={!currentUserId || clearing} className={dangerBtn}>
                            <Trash2 className="w-4 h-4" />
                            {clearing ? 'Clearing…' : 'Clear All Profile Data'}
                        </button>
                    </div>
                </SectionCard>
            </motion.div>

            {/* Avatar View Dialog */}
            <AnimatePresence>
                {showAvatarDialog && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setShowAvatarDialog(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()}
                            className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ width: '280px', height: '280px' }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                    <User className="w-20 h-20 text-zinc-400" />
                                </div>
                            )}
                            <button onClick={() => setShowAvatarDialog(false)}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Clear Data Confirm Dialog */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 4 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-6">
                            <div className="flex items-start gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-rose-500" /></div>
                                <div><h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Clear all data?</h3><p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">This will permanently delete all your data. This cannot be undone.</p></div>
                            </div>
                            <div className="flex gap-2.5">
                                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200">Cancel</button>
                                <button onClick={handleClearProfileData} disabled={clearing} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white transition-all duration-200 disabled:opacity-60">{clearing ? 'Clearing…' : 'Clear Data'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Settings;