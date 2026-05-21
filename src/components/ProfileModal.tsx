import React, { useState, useRef } from 'react';
import { X, Edit3, Loader2, Save } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';
import UserAvatar from './UserAvatar';

interface ProfileModalProps {
  onClose: () => void;
  userId: string;
  initialUsername: string;
  initialAvatarUrl: string | null;
  memberSince?: string;
  onProfileUpdated: (newUsername: string, newAvatarUrl: string | null) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  onClose, userId, initialUsername, initialAvatarUrl, memberSince, onProfileUpdated 
}) => {
  const [username, setUsername] = useState(initialUsername);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayMemberSince = memberSince 
    ? new Date(memberSince).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image type (JPEG, PNG, GIF, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setSelectedAvatar(`${urlData.publicUrl}?t=${Date.now()}`);
    } catch (err: any) {
      alert(err.message || 'Error uploading image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!username.trim()) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        username: username.trim(),
        avatar_url: selectedAvatar
      }).eq('id', userId);
      onProfileUpdated(username.trim(), selectedAvatar);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 shadow-2xl">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <UserAvatar 
                avatarUrl={selectedAvatar} 
                username={username || 'User'} 
                size={96} 
                className="shadow-lg"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/png, image/jpeg, image/gif, image/webp"
              className="hidden" 
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-zinc-500">Display Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="Enter display name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-zinc-500">Member Since</label>
              <p className="text-sm font-medium">{displayMemberSince}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-300 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !username.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-md flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;