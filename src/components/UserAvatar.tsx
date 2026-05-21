import React from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  username: string;
  size?: number | string;
  className?: string;
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-pink-600',
  'bg-indigo-600',
];

const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const UserAvatar: React.FC<UserAvatarProps> = ({ avatarUrl, username, size = 40, className = '' }) => {
  const getInitials = (name: string) => {
    if (!name) return '??';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return name.substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // If there's an avatarUrl, use the image
  if (avatarUrl) {
    return (
      <div 
        className={`rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img 
          src={avatarUrl} 
          alt={`${username}'s avatar`} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Fallback to initials with unique color
  const bgColor = getColorFromName(username || 'user');
  const fontSize = typeof size === 'number' ? size * 0.38 : '1rem';

  return (
    <div 
      className={`rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 text-white font-bold ${bgColor} ${className}`}
      style={{ 
        width: size, 
        height: size,
        fontSize: fontSize,
      }}
    >
      {getInitials(username)}
    </div>
  );
};

export default UserAvatar;