import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, Save, Calendar, Award, CheckCircle2, Lock } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';
import UserAvatar from './UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCard, BadgeType } from './badges/BadgeCard';

interface ProfileModalProps {
    onClose: () => void;
    userId: string;
    initialUsername: string;
    initialAvatarUrl: string | null;
    memberSince?: string;
    onProfileUpdated: (newUsername: string, newAvatarUrl: string | null) => void;
}

/* ─── helpers ───────────────────────────────────────────────── */
const cx = (...classes: (string | false | undefined)[]) =>
    classes.filter(Boolean).join(' ');

/* ── Badge meta for display (mirroring original badge order) ── */
const BADGE_TYPES: BadgeType[] = ['streak_3', 'streak_10', 'perfect_score', 'night_owl'];

/* ── Input field ───────────────────────────────────────────── */
const Field = ({
    label, children,
}: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500 block">
            {label}
        </label>
        {children}
    </div>
);

/* ── Section header ────────────────────────────────────────── */
const SectionHeading = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
    <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center">
            <Icon className="w-3 h-3 text-blue-500 dark:text-blue-400" />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-500">
            {label}
        </span>
        <div className="flex-1 h-px bg-slate-100 dark:bg-zinc-800" />
    </div>
);

const ProfileModal: React.FC<ProfileModalProps> = ({
    onClose, userId, initialUsername, initialAvatarUrl, memberSince, onProfileUpdated,
}) => {
    const [username,       setUsername]       = useState(initialUsername);
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(initialAvatarUrl);
    const [uploading,      setUploading]      = useState(false);
    const [saving,         setSaving]         = useState(false);
    const [uploadError,    setUploadError]    = useState('');
    const [userBadges,     setUserBadges]     = useState<{badge_type: string, earned_at: string}[]>([]);
    const [loadingBadges,  setLoadingBadges]  = useState(true);
    const [saveSuccess,    setSaveSuccess]    = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchBadges = async () => {
            if (!userId) return;
            const { data } = await supabase
                .from('user_badges')
                .select('badge_type, earned_at')
                .eq('user_id', userId);
            if (data) setUserBadges(data);
            setLoadingBadges(false);
        };
        fetchBadges();
    }, [userId]);

    const displayMemberSince = memberSince
        ? new Date(memberSince).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Unknown';

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;
        setUploadError('');

        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.type)) { setUploadError('Please use JPEG, PNG, GIF, or WebP.'); return; }
        if (file.size > 2 * 1024 * 1024) { setUploadError('File must be under 2 MB.'); return; }

        try {
            setUploading(true);
            const ext      = file.name.split('.').pop() || 'jpg';
            const fileName = `${userId}.${ext}`;
            const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true, contentType: file.type });
            if (error) throw error;
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setSelectedAvatar(`${urlData.publicUrl}?t=${Date.now()}`);
        } catch (err: any) {
            setUploadError(err.message || 'Upload failed.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!username.trim()) return;
        setSaving(true);
        try {
            await supabase.from('profiles').update({ username: username.trim(), avatar_url: selectedAvatar }).eq('id', userId);
            onProfileUpdated(username.trim(), selectedAvatar);
            setSaveSuccess(true);
            setTimeout(() => { setSaveSuccess(false); onClose(); }, 900);
        } catch {
            /* silent */
        } finally {
            setSaving(false);
        }
    };

    const badgesUnlocked = userBadges.length;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1,    y: 0  }}
                    exit={{ opacity: 0,  scale: 0.96,   y: 10 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
                    style={{
                        boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
                    }}
                >

                    {/* ── Header ─────────────────────────────────── */}
                    <div className="relative flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800/80 shrink-0 overflow-hidden">
                        {/* Subtle gradient accent */}
                        <div
                            className="absolute inset-0 opacity-[0.04] pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse at 30% 50%, #3b82f6, transparent 70%)' }}
                        />
                        <div>
                            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
                                Edit Profile
                            </h2>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                Update your display name and avatar
                            </p>
                        </div>
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>
                    </div>

                    {/* ── Scrollable body ─────────────────────────── */}
                    <div className="flex-1 overflow-y-auto">

                        {/* Avatar hero area */}
                        <div className="relative pt-8 pb-6 flex flex-col items-center overflow-hidden">
                            {/* Background gradient */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 65%)',
                                }}
                            />

                            {/* Avatar with upload */}
                            <div className="relative mb-4">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                    className="relative"
                                >
                                    <div
                                        className="rounded-full p-0.5"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(59,130,246,0.5) 0%, rgba(139,92,246,0.5) 50%, rgba(6,182,212,0.5) 100%)',
                                        }}
                                    >
                                        <div className="rounded-full p-0.5 bg-white dark:bg-zinc-950">
                                            <UserAvatar
                                                avatarUrl={selectedAvatar}
                                                username={username || 'User'}
                                                size={90}
                                                className="rounded-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Camera button */}
                                    <motion.button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200"
                                        style={{
                                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                        }}
                                    >
                                        {uploading
                                            ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                            : <Camera className="w-3.5 h-3.5 text-white" />
                                        }
                                    </motion.button>
                                </motion.div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/png,image/jpeg,image/gif,image/webp"
                                    className="hidden"
                                />
                            </div>

                            {/* Username preview */}
                            <p className="text-[15px] font-bold text-slate-900 dark:text-white">
                                {username || 'Your Name'}
                            </p>

                            {/* Upload hint / error */}
                            <AnimatePresence mode="wait">
                                {uploadError ? (
                                    <motion.p
                                        key="error"
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-[11px] text-rose-500 mt-1 text-center px-4"
                                    >
                                        {uploadError}
                                    </motion.p>
                                ) : (
                                    <motion.p
                                        key="hint"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-[11px] text-slate-400 dark:text-zinc-600 mt-1"
                                    >
                                        Max 2 MB · JPEG, PNG, GIF, WebP
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Thin divider */}
                        <div className="h-px bg-slate-100 dark:bg-zinc-800 mx-5" />

                        {/* Form fields */}
                        <div className="px-5 py-5 space-y-5">
                            <Field label="Display Name">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Enter display name"
                                    className={cx(
                                        'w-full px-4 py-2.5 rounded-xl border text-sm font-medium',
                                        'text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600',
                                        'bg-slate-50 dark:bg-zinc-900',
                                        'border-slate-200 dark:border-zinc-800',
                                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                        'transition-all duration-200',
                                    )}
                                />
                            </Field>

                            <Field label="Member Since">
                                <div className={cx(
                                    'flex items-center gap-2.5 px-4 py-2.5 rounded-xl',
                                    'bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800',
                                )}>
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 shrink-0" />
                                    <span className="text-sm text-slate-600 dark:text-zinc-400">
                                        {displayMemberSince}
                                    </span>
                                </div>
                            </Field>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-zinc-800 mx-5" />

                        {/* ── Badges section ──────────────────────── */}
                        <div className="px-5 py-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <SectionHeading icon={Award} label="Badges & Achievements" />
                                {!loadingBadges && (
                                    <span className={cx(
                                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                        badgesUnlocked > 0
                                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600',
                                    )}>
                                        {badgesUnlocked}/{BADGE_TYPES.length}
                                    </span>
                                )}
                            </div>

                            {loadingBadges ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {[0, 1, 2, 3].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                                            className="h-[136px] rounded-2xl bg-slate-100 dark:bg-zinc-800/60"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    className="grid grid-cols-2 gap-3 max-h-[230px] overflow-y-auto pr-0.5"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: {},
                                        visible: {
                                            transition: { staggerChildren: 0.07 },
                                        },
                                    }}
                                >
                                    {BADGE_TYPES.map(type => {
                                        const unlocked = userBadges.find(b => b.badge_type === type);
                                        return (
                                            <motion.div
                                                key={type}
                                                variants={{
                                                    hidden:   { opacity: 0, y: 10, scale: 0.96 },
                                                    visible:  { opacity: 1, y: 0,  scale: 1    },
                                                }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                                            >
                                                <BadgeCard
                                                    type={type}
                                                    isUnlocked={!!unlocked}
                                                    earnedAt={unlocked?.earned_at}
                                                    progress={type === 'streak_10' && !unlocked ? 4 : undefined}
                                                    maxProgress={type === 'streak_10' && !unlocked ? 10 : undefined}
                                                />
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {/* Empty badges state */}
                            {!loadingBadges && badgesUnlocked === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cx(
                                        'flex flex-col items-center gap-2 py-6 px-4 rounded-2xl text-center',
                                        'bg-slate-50 dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800',
                                    )}
                                >
                                    <Lock className="w-5 h-5 text-slate-300 dark:text-zinc-700" />
                                    <p className="text-[12px] font-semibold text-slate-400 dark:text-zinc-600">
                                        No badges yet
                                    </p>
                                    <p className="text-[11px] text-slate-300 dark:text-zinc-700 leading-relaxed">
                                        Complete challenges to earn your first badge
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* ── Footer actions ──────────────────────────── */}
                    <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 shrink-0">
                        <button
                            onClick={onClose}
                            className={cx(
                                'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                                'border border-slate-200 dark:border-zinc-700',
                                'text-slate-600 dark:text-zinc-300',
                                'hover:bg-slate-100 dark:hover:bg-zinc-800',
                            )}
                        >
                            Cancel
                        </button>

                        <motion.button
                            onClick={handleSave}
                            disabled={saving || !username.trim() || saveSuccess}
                            whileTap={{ scale: 0.97 }}
                            className={cx(
                                'flex-1 py-2.5 rounded-xl text-sm font-bold',
                                'flex items-center justify-center gap-2',
                                'transition-all duration-300 shadow-lg',
                                saveSuccess
                                    ? 'bg-emerald-500 shadow-emerald-500/25 text-white'
                                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 text-white disabled:opacity-50',
                            )}
                        >
                            <AnimatePresence mode="wait">
                                {saving ? (
                                    <motion.span
                                        key="saving"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving…
                                    </motion.span>
                                ) : saveSuccess ? (
                                    <motion.span
                                        key="saved"
                                        initial={{ scale: 0.7, opacity: 0 }}
                                        animate={{ scale: 1,   opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Saved!
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="save"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfileModal;