import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Upload, X, Loader2 } from 'lucide-react';
import UserAvatar from './UserAvatar';

const RECOMMENDED_AVATARS = [
  'Felix', 'Aneka', 'Lily', 'Max', 'Sam', 'Mia'
].map(seed => `https://api.dicebear.com/7.x/personas/svg?seed=${seed}`);

interface ProfileSetupProps {
  onSave?: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onSave }) => {
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUsername(profile.username || '');
        setAvatarUrl(profile.avatar_url);
      }
    } catch (err) {
      console.error('Error loading profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
    } catch (err: any) {
      setError(err.message || 'Error uploading image');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!userId || !username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: username.trim(),
          avatar_url: avatarUrl 
        })
        .eq('id', userId);

      if (error) throw error;
      
      setSuccess('Profile updated successfully!');
      if (onSave) onSave();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-3">
          <UserAvatar avatarUrl={avatarUrl} username={username || 'New User'} size={100} />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Display Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-zinc-300">Or choose an avatar</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {RECOMMENDED_AVATARS.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setAvatarUrl(url)}
                  disabled={saving}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${avatarUrl === url ? 'border-blue-500 scale-105' : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600'}`}
                >
                  <img src={url} alt={`Recommended ${i}`} className="w-full h-auto bg-zinc-100 dark:bg-zinc-800" />
                </button>
              ))}
            </div>
            {avatarUrl && (
              <button 
                onClick={() => setAvatarUrl(null)}
                className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove Avatar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t dark:border-zinc-800">
        <button
          onClick={handleSave}
          disabled={saving || !username.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};

export default ProfileSetup;
