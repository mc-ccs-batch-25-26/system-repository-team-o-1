import React from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  username: string;
  size?: number | string;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ avatarUrl, username, size = 40, className = '' }) => {
  const getInitials = (name: string) => {
    if (!name) return '??';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return name.substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // If there's an avatarUrl, use it. Some DiceBear URLs might be explicitly saved.
  if (avatarUrl) {
    return (
      <div 
        className={`rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img 
          src={avatarUrl} 
          alt={`${username}'s avatar`} 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Otherwise, fallback to initials
  return (
    <div 
        className={`rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold ${className}`}
        style={{ 
          width: size, 
          height: size,
          fontSize: typeof size === 'number' ? size * 0.4 : '1rem' 
        }}
    >
      {getInitials(username)}
    </div>
  );
};

export default UserAvatar;
