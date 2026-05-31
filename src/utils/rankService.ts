import { Star, Award, TrendingUp, Zap, Crown } from 'lucide-react';

export const TIERS = [
    { name: 'Recruit',      minXP: 0,    color: '#a1a1aa', glow: 'rgba(161,161,170,0.25)', icon: Star       },
    { name: 'Examiner',     minXP: 500,  color: '#f59e0b', glow: 'rgba(245,158,11,0.3)',   icon: Award      },
    { name: 'Analyst',      minXP: 1500, color: '#10b981', glow: 'rgba(16,185,129,0.3)',   icon: TrendingUp  },
    { name: 'Strategist',   minXP: 3000, color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)',   icon: Zap        },
    { name: 'Civil Master', minXP: 7000, color: '#f43f5e', glow: 'rgba(244,63,94,0.35)',   icon: Crown      },
];

export const getTier = (xp: number) => {
    let t = TIERS[0];
    for (const tier of TIERS) { if (xp >= tier.minXP) t = tier; }
    return t;
};

export const nextTierXP = (xp: number): number | null => {
    for (let i = 0; i < TIERS.length; i++) {
        if (xp < TIERS[i].minXP) return TIERS[i].minXP;
    }
    return null;
};

export const prevTierXP = (xp: number): number => {
    let prev = 0;
    for (const tier of TIERS) { if (xp >= tier.minXP) prev = tier.minXP; }
    return prev;
};

export const getXpToNextLevel = (level: number, currentXp: number): number => {
    const reqXPNextLevel = level * 500;
    return Math.max(0, reqXPNextLevel - currentXp);
};

export const getXpToNextTier = (currentXp: number): number => {
    const nextTarget = nextTierXP(currentXp);
    return nextTarget ? Math.max(0, nextTarget - currentXp) : 0;
};