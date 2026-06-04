import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import {
    Zap, Award, Flame, TrendingUp,
    Minus, Crown, Star, Swords, Globe,
    MapPin, Users, ArrowUp, ArrowDown,
} from 'lucide-react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import UserAvatar from '../components/UserAvatar';
import { TIERS, getTier, nextTierXP, prevTierXP } from '../utils/rankService';

/* ─────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────── */
interface LeaderboardUser {
    id: string;
    username: string;
    xp: number;         
    all_time_xp: number;
    level: number;
    streak_count: number;
    avatar_url: string | null;
    accuracy_rate: number;
    rank_change?: number;
}

/* ─────────────────────────────────────────────────────────────────────────
   TAB / FILTER TYPES
───────────────────────────────────────────────────────────────────────── */
type ScopeTab  = 'global' | 'local' | 'friends';
type PeriodTab = 'daily'  | 'weekly' | 'monthly' | 'all-time';

const SCOPE_TABS: { id: ScopeTab; label: string; icon: React.FC<any> }[] = [
    { id: 'global',  label: 'Global',  icon: Globe   },
    { id: 'local',   label: 'Local',   icon: MapPin  },
    { id: 'friends', label: 'Friends', icon: Users   },
];

const PERIOD_TABS: { id: PeriodTab; label: string }[] = [
    { id: 'daily',    label: 'Daily'    },
    { id: 'weekly',   label: 'Weekly'   },
    { id: 'monthly',  label: 'Monthly'  },
    { id: 'all-time', label: 'All Time' },
];

/* ─────────────────────────────────────────────────────────────────────    ────
   SMALL HELPERS
───────────────────────────────────────────────────────────────────────── */
const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1.1 }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const ctrl = animate(0, value, { duration, ease: 'easeOut', onUpdate: v => setDisplay(Math.round(v)) });
        return ctrl.stop;
    }, [value]);
    return <>{display.toLocaleString()}</>;
};

const RankDelta: React.FC<{ change?: number }> = ({ change }) => {
    if (!change || change === 0) return <Minus className="w-3 h-3" style={{ color: '#52525b' }} />;
    return change > 0
        ? <ArrowUp   className="w-3 h-3" style={{ color: '#34d399' }} />
        : <ArrowDown className="w-3 h-3" style={{ color: '#f87171' }} />;
};

/* ─────────────────────────────────────────────────────────────────────────
   XP PROGRESS BAR
───────────────────────────────────────────────────────────────────────── */
const XPProgressBar: React.FC<{ xp: number }> = ({ xp }) => {
    const tier   = getTier(xp);
    const next   = nextTierXP(xp);
    const prev   = prevTierXP(xp);
    const pct    = next ? Math.min(((xp - prev) / (next - prev)) * 100, 100) : 100;
    const TIcon  = tier.icon;
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <TIcon className="w-3 h-3 shrink-0" style={{ color: tier.color }} />
                    <span className="text-[11px] font-bold" style={{ color: tier.color }}>{tier.name}</span>
                </div>
                {next && (
                    <span className="text-[10px]" style={{ color: '#52525b' }}>
                        {(next - xp).toLocaleString()} XP to next tier
                    </span>
                )}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full relative overflow-hidden"
                    style={{
                        background: `linear-gradient(90deg, ${tier.color}70, ${tier.color})`,
                        boxShadow: `0 0 8px ${tier.glow}`,
                    }}
                >
                    <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)' }}
                    />
                </motion.div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────────────────────────────────────── */
const SkeletonRow: React.FC<{ delay: number }> = ({ delay }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.65, 0.3] }}
        transition={{ delay, duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
        <div className="w-7 h-3 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="w-8 h-8 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-2 w-16 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div className="h-3 w-14 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </motion.div>
);

/* ─────────────────────────────────────────────────────────────────────────
   PODIUM STAGE — unified competitive podium
───────────────────────────────────────────────────────────────────────── */
interface PodiumStageProps {
    top3: LeaderboardUser[];
    currentUserId?: string;
}

const PODIUM_RANK_CFG = {
    1: {
        order: 1,
        label: '1st',
        avatarSize: 64,
        nameSize: '13px',
        xpSize: '18px',
        platformH: 50,
        cardPaddingTop: 'pt-6',
        badgeBg: 'linear-gradient(135deg, #fbbf24, #d97706)',
        badgeColor: '#1a1100',
        ringGradient: 'linear-gradient(135deg, #fbbf24cc, #fbbf2444)',
        xpColor: '#fbbf24',
        tierColor: '#fbbf24',
        platformBg: 'linear-gradient(180deg, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.06) 100%)',
        platformBorder: 'rgba(251,191,36,0.3)',
        cardBg: 'linear-gradient(175deg, rgba(90,50,10,0.7) 0%, rgba(14,14,18,0.95) 100%)',
        cardBorder: 'rgba(251,191,36,0.38)',
        cardGlow: '0 0 0 1px rgba(251,191,36,0.18), 0 8px 48px rgba(251,191,36,0.22), 0 24px 80px rgba(251,191,36,0.08)',
        centerGlow: true,
        animDelay: 0.15,
        zIndex: 10,
    },
    2: {
        order: 0,
        label: '2nd',
        avatarSize: 48,
        nameSize: '12px',
        xpSize: '14px',
        platformH: 50,
        cardPaddingTop: 'pt-5',
        badgeBg: 'linear-gradient(135deg, #c0c0c0, #808080)',
        badgeColor: '#111',
        ringGradient: 'linear-gradient(135deg, #a1a1aacc, #a1a1aa33)',
        xpColor: '#d4d4d8',
        tierColor: '#a1a1aa',
        platformBg: 'linear-gradient(180deg, rgba(161,161,170,0.12) 0%, rgba(161,161,170,0.03) 100%)',
        platformBorder: 'rgba(161,161,170,0.2)',
        cardBg: 'linear-gradient(175deg, rgba(38,38,42,0.8) 0%, rgba(14,14,18,0.95) 100%)',
        cardBorder: 'rgba(161,161,170,0.22)',
        cardGlow: '0 0 0 1px rgba(161,161,170,0.1), 0 4px 24px rgba(161,161,170,0.12)',
        centerGlow: false,
        animDelay: 0.0,
        zIndex: 5,
    },
    3: {
        order: 2,
        label: '3rd',
        avatarSize: 44,
        nameSize: '11px',
        xpSize: '13px',
        platformH: 40,
        cardPaddingTop: 'pt-4',
        badgeBg: 'linear-gradient(135deg, #cd7f32, #92400e)',
        badgeColor: '#fff8f0',
        ringGradient: 'linear-gradient(135deg, #d97706cc, #d9770633)',
        xpColor: '#d97706',
        tierColor: '#d97706',
        platformBg: 'linear-gradient(180deg, rgba(180,83,9,0.12) 0%, rgba(180,83,9,0.03) 100%)',
        platformBorder: 'rgba(180,83,9,0.22)',
        cardBg: 'linear-gradient(175deg, rgba(60,25,5,0.6) 0%, rgba(14,14,18,0.95) 100%)',
        cardBorder: 'rgba(180,83,9,0.25)',
        cardGlow: '0 0 0 1px rgba(180,83,9,0.08), 0 4px 20px rgba(180,83,9,0.14)',
        centerGlow: false,
        animDelay: 0.28,
        zIndex: 5,
    },
} as const;

const PodiumStage: React.FC<PodiumStageProps> = ({ top3, currentUserId }) => {
    const slots: (1 | 2 | 3)[] = [2, 1, 3];

    return (
        <div className="relative flex items-end justify-center gap-5">
            <div
                className="absolute pointer-events-none"
                style={{
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 280,
                    height: 260,
                    background: 'radial-gradient(ellipse at 50% 80%, rgba(251,191,36,0.13) 0%, transparent 65%)',
                    filter: 'blur(4px)',
                    zIndex: 1,
                }}
            />

            {slots.map((rank) => {
                const user = top3[rank - 1];
                if (!user) return <div key={rank} className="flex-1" />;
                const cfg = PODIUM_RANK_CFG[rank];
                const tier = getTier(user.all_time_xp);
                const TIcon = tier.icon;
                const isCurrentUser = currentUserId === user.id;

                return (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: cfg.animDelay, type: 'spring', stiffness: 200, damping: 22 }}
                        whileHover={{ y: -5, transition: { type: 'spring', stiffness: 340, damping: 26 } }}
                        className="flex flex-col items-center flex-1"
                        style={{ zIndex: cfg.zIndex, maxWidth: rank === 1 ? 220: 180 }}
                    >
                        <div
                            className={`relative w-full flex flex-col items-center ${cfg.cardPaddingTop} pb-4 px-3 rounded-t-2xl overflow-hidden`}
                            style={{
                                background: cfg.cardBg,
                                border: `1px solid ${cfg.cardBorder}`,
                                borderBottom: 'none',
                                boxShadow: isCurrentUser
                                    ? `${cfg.cardGlow}, 0 0 0 2px rgba(96,165,250,0.4)`
                                    : cfg.cardGlow,
                            }}
                        >
                            <div
                                className="absolute top-2.5 left-2.5 text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-widest uppercase"
                                style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
                            >
                                {cfg.label}
                            </div>

                            {isCurrentUser && (
                                <div
                                    className="absolute top-2.5 right-2.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                    style={{ background: 'rgba(59,130,246,0.18)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.32)' }}
                                >
                                    YOU
                                </div>
                            )}

                            {rank === 1 && (
                                <motion.div
                                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.15) 0%, transparent 60%)' }}
                                />
                            )}

                            {rank === 1 && (
                                <motion.div
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.5, type: 'spring', stiffness: 280, damping: 18 }}
                                    className="mb-1 text-xl leading-none"
                                >
                                    👑
                                </motion.div>
                            )}

                            <div
                                className="rounded-full shrink-0 mb-2.5"
                                style={{ padding: 2.5, background: cfg.ringGradient }}
                            >
                                <div
                                    className="rounded-full overflow-hidden bg-zinc-900"
                                    style={{ width: cfg.avatarSize, height: cfg.avatarSize }}
                                >
                                    <UserAvatar avatarUrl={user.avatar_url} username={user.username} size={cfg.avatarSize} />
                                </div>
                            </div>

                            <p
                                className="font-bold text-white w-full text-center truncate leading-tight"
                                style={{ fontSize: cfg.nameSize }}
                            >
                                {user.username}
                            </p>

                            <div className="flex items-center gap-1 mt-1">
                                <TIcon className="w-2.5 h-2.5 shrink-0" style={{ color: tier.color }} />
                                <span className="text-[9px] font-semibold truncate" style={{ color: tier.color }}>{tier.name}</span>
                            </div>

                            <p
                                className="font-black tabular-nums mt-2 leading-none"
                                style={{ color: cfg.xpColor, fontSize: cfg.xpSize }}
                            >
                                <AnimatedNumber value={user.xp} />
                                <span className="text-[9px] font-bold opacity-55 ml-0.5">XP</span>
                            </p>

                            <p className="text-[10px] mt-0.5" style={{ color: '#a1a1aa' }}>Lv.{user.level}</p>

                            {user.streak_count > 0 && (
                                <div
                                    className="flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)' }}
                                >
                                    <Flame className="w-2.5 h-2.5 text-orange-400" />
                                    <span className="text-[9px] font-semibold text-orange-300">{user.streak_count}d</span>
                                </div>
                            )}
                        </div>

                        <div
                            className="w-full flex items-center justify-center rounded-b-xl"
                            style={{
                                height: cfg.platformH,
                                background: cfg.platformBg,
                                borderLeft: `1px solid ${cfg.platformBorder}`,
                                borderRight: `1px solid ${cfg.platformBorder}`,
                                borderBottom: `1px solid ${cfg.platformBorder}`,
                            }}
                        >
                            <span className="text-lg opacity-40">
                                {rank === 1 ? '🏆' : rank === 2 ? '🥈' : '🥉'}
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────
   SCOPE TAB BAR
───────────────────────────────────────────────────────────────────────── */
const ScopeTabBar: React.FC<{ active: ScopeTab; onChange: (v: ScopeTab) => void }> = ({ active, onChange }) => (
    <div
        className="flex rounded-xl p-1 gap-3 max-w-[450px] mx-auto"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
        {SCOPE_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = id === active;
            return (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    className="relative flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2"
                    style={{ color: isActive ? '#fff' : '#71717a' }}
                >
                    {isActive && (
                        <motion.div
                            layoutId="scope-pill"
                            className="absolute inset-0 rounded-lg"
                            style={{
                                background: 'linear-gradient(135deg, rgba(251,191,36,0.22), rgba(251,191,36,0.08))',
                                border: '1px solid rgba(251,191,36,0.3)',
                                boxShadow: '0 0 12px rgba(251,191,36,0.15)',
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                        />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" />
                    <span className="relative z-10 hidden sm:inline">{label}</span>
                    <span className="relative z-10 sm:hidden">{label[0]}</span>
                </button>
            );
        })}
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   PERIOD FILTER TABS
───────────────────────────────────────────────────────────────────────── */
const PeriodFilterTabs: React.FC<{ active: PeriodTab; onChange: (v: PeriodTab) => void }> = ({ active, onChange }) => (
    <div className="flex gap-1 flex-wrap">
        {PERIOD_TABS.map(({ id, label }) => {
            const isActive = id === active;
            return (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    className="relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2"
                    style={{
                        color:      isActive ? '#fbbf24' : '#71717a',
                        background: isActive ? 'rgba(251,191,36,0.1)' : 'transparent',
                        border:     isActive ? '1px solid rgba(251,191,36,0.25)' : '1px solid transparent',
                    }}
                >
                    {isActive && (
                        <motion.div
                            layoutId="period-pill"
                            className="absolute inset-0 rounded-lg"
                            style={{ background: 'rgba(251,191,36,0.06)' }}
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                    )}
                    <span className="relative z-10">{label}</span>
                </button>
            );
        })}
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   RANK ROW
───────────────────────────────────────────────────────────────────────── */
interface RankRowProps {
    user: LeaderboardUser;
    rank: number;
    isCurrentUser: boolean;
    delay: number;
}

const RankRow: React.FC<RankRowProps> = ({ user, rank, isCurrentUser, delay }) => {
    const tier  = getTier(user.all_time_xp);
    const TIcon = tier.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, type: 'spring', stiffness: 260, damping: 28 }}
            whileHover={{ 
                backgroundColor: isCurrentUser ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)' 
            }}
            className="relative flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors duration-100"
            style={{
                borderColor: 'rgba(255,255,255,0.04)',
                backgroundColor: isCurrentUser ? 'rgba(59,130,246,0.07)' : 'transparent',
            }}
        >
            {isCurrentUser && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: '#60a5fa' }} />
            )}

            <div className="w-7 shrink-0 text-center">
                <span
                    className="text-xs font-black tabular-nums"
                    style={{ color: rank <= 10 ? '#d4d4d8' : '#3f3f46' }}
                >
                    {rank}
                </span>
            </div>

            <div className="shrink-0">
                <UserAvatar avatarUrl={user.avatar_url} username={user.username} size={32} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <p
                        className="text-xs font-semibold truncate leading-none"
                        style={{ color: isCurrentUser ? '#93c5fd' : '#e4e4e7' }}
                    >
                        {user.username}
                    </p>
                    {isCurrentUser && (
                        <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
                        >
                            YOU
                        </span>
                    )}
                    <div
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: `${tier.color}12`, border: `1px solid ${tier.color}28` }}
                    >
                        <TIcon className="w-2 h-2" style={{ color: tier.color }} />
                        <span className="text-[8px] font-bold" style={{ color: tier.color }}>{tier.name}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: '#a1a1aa' }}>Lv.{user.level}</span>
                    {user.streak_count > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'rgba(251,146,60,0.75)' }}>
                            <Flame className="w-2.5 h-2.5" />
                            {user.streak_count}d
                        </span>
                    )}
                </div>
            </div>

            <div className="w-20 shrink-0 text-right">
                <p className="text-xs font-black tabular-nums" style={{ color: '#e4e4e7' }}>
                    {user.xp.toLocaleString()}
                    <span className="text-[9px] font-bold ml-0.5" style={{ color: '#3f3f46' }}>XP</span>
                </p>
                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    <RankDelta change={user.rank_change} />
                    {!!user.rank_change && user.rank_change !== 0 && (
                        <span
                            className="text-[9px] font-semibold"
                            style={{ color: user.rank_change > 0 ? '#34d399' : '#f87171' }}
                        >
                            {Math.abs(user.rank_change)}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────
   YOUR POSITION MINI CARD
───────────────────────────────────────────────────────────────────────── */
interface YourPositionProps {
    user: LeaderboardUser;
    rank: number;
    totalUsers: number;
}

const YourPositionCard: React.FC<YourPositionProps> = ({ user, rank, totalUsers }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ delay: 0.12, type: 'spring', stiffness: 260, damping: 26 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
            background: 'linear-gradient(135deg, rgba(15,30,70,0.55) 0%, rgba(20,20,28,0.9) 100%)',
            border: '1px solid rgba(59,130,246,0.2)',
            boxShadow: '0 0 24px rgba(59,130,246,0.07)',
        }}
    >
        <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)' }}
        >
            <span className="text-sm font-black" style={{ color: '#60a5fa' }}>#{rank}</span>
        </div>

        <UserAvatar avatarUrl={user.avatar_url} username={user.username} size={34} />

        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-none">{user.username}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#a1a1aa' }}>
                of {totalUsers} ranked players
            </p>
        </div>

        <div className="text-right shrink-0">
            <p className="text-sm font-black tabular-nums leading-none" style={{ color: '#fbbf24' }}>
                <AnimatedNumber value={user.xp} duration={0.8} />
                <span className="text-[9px] font-bold opacity-55 ml-0.5">XP</span>
            </p>
            {user.streak_count > 0 && (
                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    <Flame className="w-2.5 h-2.5 text-orange-400" />
                    <span className="text-[10px] text-orange-400 font-semibold">{user.streak_count}d</span>
                </div>
            )}
        </div>

        {rank <= 10 && (
            <div
                className="shrink-0 text-[9px] font-black px-2 py-1 rounded-full"
                style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}
            >
                TOP 10
            </div>
        )}
    </motion.div>
);

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────── */
const LeaderboardPage: React.FC = () => {
    const { currentUser } = useOutletContext<any>();

    const [users,     setUsers]    = useState<LeaderboardUser[]>([]);
    const [loading,   setLoading]  = useState(true);
    const [scopeTab,  setScopeTab] = useState<ScopeTab>('local');
    const [periodTab, setPeriodTab]= useState<PeriodTab>('all-time');
    const [userRank,  setUserRank] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            let sortColumn = 'xp';
            if (periodTab === 'daily') sortColumn = 'daily_xp';
            else if (periodTab === 'weekly') sortColumn = 'weekly_xp';
            else if (periodTab === 'monthly') sortColumn = 'monthly_xp';

            // ★ Base query
            let query = supabase
                .from('profiles')
                .select('id, username, xp, daily_xp, weekly_xp, monthly_xp, level, streak_count, avatar_url, role');

            // ★ FILTER BY FRIENDS IF ON FRIENDS TAB
            if (scopeTab === 'friends' && currentUser?.id) {
                const { data: friendships } = await supabase
                    .from('friendships')
                    .select('sender_id, receiver_id')
                    .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                    .eq('status', 'accepted');

                if (friendships && friendships.length > 0) {
                    const friendIds = friendships.map((f: any) =>
                        f.sender_id === currentUser.id ? f.receiver_id : f.sender_id
                    );
                    // Include current user in friends leaderboard
                    friendIds.push(currentUser.id);
                    query = query.in('id', friendIds);
                } else {
                    // No friends yet — show only current user
                    query = query.eq('id', currentUser.id);
                }
            }

            const { data } = await query
                .order(sortColumn, { ascending: false, nullsFirst: false });

            if (data) {
                // Filter out admins from the leaderboard array
                const filteredData = data.filter((u: any) => u.role !== 'admin' && u.role !== 'super_admin');

                setUsers(filteredData.slice(0, 50).map((u: any) => {
                    let currentTabXP = u.xp || 0;
                    if (periodTab === 'daily') currentTabXP = u.daily_xp || 0;
                    else if (periodTab === 'weekly') currentTabXP = u.weekly_xp || 0;
                    else if (periodTab === 'monthly') currentTabXP = u.monthly_xp || 0;

                    return { 
                        ...u, 
                        all_time_xp: u.xp || 0,
                        xp: currentTabXP,
                        accuracy_rate: 0, 
                        rank_change: 0 
                    };
                }));

                if (currentUser) {
                    const idx = filteredData.findIndex((u: any) => u.id === currentUser.id);
                    setUserRank(idx >= 0 ? idx + 1 : null);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [scopeTab, periodTab, currentUser]);

    const top3     = users.slice(0, 3);
    const rest     = users.slice(3);
    const meInList = users.find(u => u.id === currentUser?.id);

    if (loading) {
        return (
            <div className="min-h-screen" style={{ background: '#09090b' }}>
                <div className="flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-7">
                    <div className="space-y-3">
                        <div className="h-8 w-48 rounded-lg animate-pulse mx-auto" style={{ background: 'rgba(255,255,255,0.08)' }} />
                        <div className="h-3 w-64 rounded-lg animate-pulse mx-auto" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                    <div className="h-11 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <div className="flex items-end gap-2 justify-center" style={{ height: 320 }}>
                        {[182, 276, 160].map((h, i) => (
                            <div key={i} className="flex-1 max-w-[160px] rounded-2xl animate-pulse" style={{ height: h, background: 'rgba(255,255,255,0.04)' }} />
                        ))}
                    </div>
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(18,18,22,0.9)' }}>
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} delay={i * 0.06} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white selection:bg-amber-400/20" style={{ background: '#09090b' }}>

            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div style={{
                    position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
                    width: 700, height: 360,
                    background: 'radial-gradient(ellipse, rgba(251,191,36,0.07) 0%, transparent 68%)',
                    filter: 'blur(3px)',
                }} />
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.016,
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                    backgroundSize: '36px 36px',
                }} />
            </div>

            <div className="relative z-10 flex flex-col w-full max-w-6xl mx-auto px-8 sm:px-0 py-8 space-y-7">

                <motion.div
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-left text-left gap-1 pt-0.5"
                >
                    <div className="flex items-center gap-2 mb-1">
                    </div>
                     <p className="text-xs font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-2">Leaderboard</p>

                    <h1
                        className="font-black tracking-tight text-white leading-none"
                        style={{ fontSize: 'clamp(28px, 5vw, 28px)' }}
                    >
                        Leaderboard
                    </h1>
                    <p className="text-lg" style={{ color: '#71717a' }}>
                        Compete. Climb. Conquer the Civil Service Exam.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.07, duration: 0.35 }}
                    className="mb-2"
                >
                    <ScopeTabBar active={scopeTab} onChange={setScopeTab} />
                </motion.div>

                <AnimatePresence mode="wait">
                    {top3.length > 0 && (
                        <motion.section
                            key="podium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <p
                                className="text-[12px] font-bold uppercase tracking-[0.18em]"
                                style={{ color: '#9e9898' }}
                            >
                                Top Performers
                            </p>

                            <div className="w-full max-w-3xl mx-auto">
                                <PodiumStage top3={top3} currentUserId={currentUser?.id} />
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.38 }}
                >
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(12,12,16,0.9)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <div
                            className="px-4 pt-4 pb-3"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-1 h-4 rounded-full"
                                        style={{ background: 'linear-gradient(180deg, #fbbf24, #d97706)' }}
                                    />
                                    <span className="text-sm font-bold text-white">Rankings</span>
                                    <span
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(255,255,255,0.06)', color: '#71717a' }}
                                    >
                                        {users.length} players
                                    </span>
                                </div>

                                <AnimatePresence>
                                    {userRank && meInList && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                                            style={{
                                                background: 'rgba(15,30,70,0.5)',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                            }}
                                        >
                                            <UserAvatar avatarUrl={meInList.avatar_url} username={meInList.username} size={20} />
                                            <span className="text-[10px] font-semibold text-white truncate max-w-[80px]">{meInList.username}</span>
                                            <span className="text-[10px] font-black" style={{ color: '#60a5fa' }}>#{userRank}</span>
                                            {userRank <= 10 && (
                                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                                                    TOP 10
                                                </span>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <PeriodFilterTabs active={periodTab} onChange={setPeriodTab} />
                        </div>

                        {/* ★ FIXED: Column headers with avatar spacer */}
                        <div
                            className="flex items-center gap-3 px-4 py-2"
                            style={{
                                background: 'rgba(18,18,24,0.95)',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                            }}
                        >
                            <span className="w-7 shrink-0 text-center text-[12px] font-bold uppercase tracking-widest" style={{ color: '#9494a3' }}>#</span>
                            <span className="w-8 shrink-0" />
                            <span className="flex-1 text-[12px] font-bold uppercase tracking-widest" style={{ color: '#9494a3' }}>Player</span>
                            <span className="w-20 shrink-0 text-right text-[12px] font-bold uppercase tracking-widest" style={{ color: '#9494a3' }}>XP</span>
                        </div>

                        {rest.length === 0 && top3.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                >
                                    <Swords className="w-7 h-7" style={{ color: '#27272a' }} />
                                </div>
                                <p className="text-sm font-bold text-zinc-300 mb-1">No rankings yet</p>
                                <p className="text-xs max-w-xs" style={{ color: '#52525b' }}>
                                    Be the first to earn XP. Start a quiz to begin climbing!
                                </p>
                            </div>
                        )}

                        <AnimatePresence>
                            {rest.map((user, i) => (
                                <RankRow
                                    key={user.id}
                                    user={user}
                                    rank={i + 4}
                                    isCurrentUser={currentUser?.id === user.id}
                                    delay={0.32 + i * 0.022}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.section>

                <AnimatePresence>
                    {userRank && currentUser && meInList && userRank > 3 && (
                        <motion.section
                            key="position-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.44, type: 'spring', stiffness: 220, damping: 26 }}
                        >
                            <div className="flex justify-center mb-3">
                                <div
                                    className="w-px h-4"
                                    style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.3), transparent)' }}
                                />
                            </div>

                            <div
                                className="rounded-2xl overflow-hidden px-4 py-3 space-y-2"
                                style={{
                                    border: '1px solid rgba(59,130,246,0.18)',
                                    background: 'linear-gradient(135deg, rgba(12,24,60,0.5) 0%, rgba(12,12,18,0.9) 100%)',
                                    boxShadow: '0 0 28px rgba(59,130,246,0.07)',
                                }}
                            >
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>
                                    Your Position
                                </p>

                                <YourPositionCard user={meInList} rank={userRank} totalUsers={users.length} />

                                <XPProgressBar xp={meInList.xp} />
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                <div className="h-4" />

            </div>
        </div>
    );
};

export default LeaderboardPage;