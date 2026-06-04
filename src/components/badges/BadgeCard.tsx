import React from 'react';
import { motion } from 'framer-motion';
import { Star, Shield, Zap, TrendingUp, Trophy, Flame, Crown, BookOpen, Target, Sword } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Simple utility for merging tailwind classes safely
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// All possible Badges in the Gamification Engine
export type BadgeType = 
    | 'streak_3' | 'streak_10' | 'streak_30'
    | 'top_10' | 'first_battle' | 'perfect_score'
    | 'night_owl' | 'early_bird' | 'speed_demon';

export interface BadgeCardProps {
    type: BadgeType;
    isUnlocked: boolean;
    earnedAt?: string;
    progress?: number; 
    maxProgress?: number;
}

const BADGE_DATA: Record<BadgeType, { 
    name: string; 
    description: string; 
    icon: React.ElementType; 
    colors: { bg: string; text: string; border: string; iconBg: string } 
}> = {
    streak_3: {
        name: 'Spark',
        description: 'Achieve a 3-day daily streak.',
        icon: Flame,
        colors: {
            bg: 'bg-orange-50 dark:bg-orange-950/20',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-800/40',
            iconBg: 'bg-orange-100 dark:bg-orange-900/40',
        },
    },
    streak_10: {
        name: 'Inferno',
        description: 'Achieve a 10-day daily streak.',
        icon: Flame,
        colors: {
            bg: 'bg-rose-50 dark:bg-rose-950/20',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-800/40',
            iconBg: 'bg-rose-100 dark:bg-rose-900/40',
        },
    },
    streak_30: {
        name: 'Unstoppable',
        description: 'Achieve a 30-day daily streak!',
        icon: Crown,
        colors: {
            bg: 'bg-purple-50 dark:bg-purple-950/20',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-200 dark:border-purple-800/40',
            iconBg: 'bg-purple-100 dark:bg-purple-900/40',
        },
    },
    top_10: {
        name: 'Top 10%',
        description: 'Rank in the top 10 on the Global Leaderboard.',
        icon: Trophy,
        colors: {
            bg: 'bg-amber-50 dark:bg-amber-950/20',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800/40',
            iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        },
    },
    perfect_score: {
        name: 'Flawless',
        description: 'Get a perfect 100% on a Mock Exam.',
        icon: Star,
        colors: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800/40',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        },
    },
    first_battle: {
        name: 'Challenger',
        description: 'Complete your first Peer Battle.',
        icon: Sword,
        colors: {
            bg: 'bg-blue-50 dark:bg-blue-950/20',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800/40',
            iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        },
    },
    night_owl: {
        name: 'Night Owl',
        description: 'Complete a quiz after Midnight.',
        icon: Shield,
        colors: {
            bg: 'bg-indigo-50 dark:bg-indigo-950/20',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-800/40',
            iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
        },
    },
    early_bird: {
        name: 'Early Bird',
        description: 'Complete a quiz before 6 AM.',
        icon: Shield,
        colors: {
            bg: 'bg-sky-50 dark:bg-sky-950/20',
            text: 'text-sky-600 dark:text-sky-400',
            border: 'border-sky-200 dark:border-sky-800/40',
            iconBg: 'bg-sky-100 dark:bg-sky-900/40',
        },
    },
    speed_demon: {
        name: 'Speed Demon',
        description: 'Finish a Timed Challenge with 50% time left.',
        icon: Zap,
        colors: {
            bg: 'bg-yellow-50 dark:bg-yellow-950/20',
            text: 'text-yellow-600 dark:text-yellow-500',
            border: 'border-yellow-200 dark:border-yellow-800/40',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        },
    },
};

export const BadgeCard: React.FC<BadgeCardProps> = ({ type, isUnlocked, earnedAt, progress, maxProgress }) => {
    const badge = BADGE_DATA[type];
    const Icon = badge.icon;
    
    // Grayscale logic if not unlocked
    const lockedClasses = !isUnlocked 
        ? 'opacity-60 grayscale filter brightness-90 hover:grayscale-0 transition-all duration-300' 
        : '';
        
    const colors = isUnlocked 
        ? badge.colors 
        : {
            bg: 'bg-zinc-100 dark:bg-zinc-800/50',
            text: 'text-zinc-500 dark:text-zinc-500',
            border: 'border-zinc-200 dark:border-zinc-700/50',
            iconBg: 'bg-zinc-200 dark:bg-zinc-700',
        };

    const hasProgress = !isUnlocked && progress !== undefined && maxProgress !== undefined;

    return (
        <motion.div 
            whileHover={{ y: -3, scale: 1.02 }}
            className={cn(
                "relative flex flex-col justify-between p-3 rounded-2xl border min-h-[140px]",
                colors.bg, colors.border, lockedClasses
            )}
        >
            {/* Top Row: Icon & Date */}
            <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-xl flex items-center justify-center", colors.iconBg)}>
                    <Icon className={cn("w-5 h-5", colors.text)} />
                </div>
                {isUnlocked && earnedAt && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        {new Date(earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                )}
            </div>

            {/* Bottom Row: Text & Progress */}
            <div className="mt-3">
                <h4 className={cn("text-xs font-bold leading-tight", colors.text)}>
                    {badge.name}
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                    {badge.description}
                </p>

                {hasProgress && (
                    <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-semibold text-zinc-500">
                            <span>Progress</span>
                            <span>{progress} / {maxProgress}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                            <div 
                                className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full" 
                                style={{ width: `${Math.min(((progress || 0) / (maxProgress || 1)) * 100, 100)}%` }} 
                            />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Glow if unlocked */}
            {isUnlocked && (
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 dark:ring-white/10 pointer-events-none" />
            )}
        </motion.div>
    );
};
