import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, Save, Calendar } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';
import UserAvatar from './UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileModalProps {
    onClose: () => void;
    userId: string;
    initialUsername: string;
    initialAvatarUrl: string | null;
    memberSince?: string;
    onProfileUpdated: (newUsername: string, newAvatarUrl: string | null) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
    onClose, userId, initialUsername, initialAvatarUrl, memberSince, onProfileUpdated,
}) => {
    const [username,       setUsername]       = useState(initialUsername);
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(initialAvatarUrl);
    const [uploading,      setUploading]      = useState(false);
    const [saving,         setSaving]         = useState(false);
    const [uploadError,    setUploadError]    = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            onClose();
        } catch {
            /* silent — kept original behaviour */
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 6 }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
                >
                    {/* header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Edit Profile</h2>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* body */}
                    <div className="p-6 space-y-6">

                        {/* avatar */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <UserAvatar avatarUrl={selectedAvatar} username={username || 'User'} size={88} className="ring-4 ring-zinc-100 dark:ring-zinc-800" />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all duration-200 active:scale-95"
                                >
                                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" />
                            {uploadError && <p className="text-xs text-rose-500 text-center">{uploadError}</p>}
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Max 2 MB · JPEG, PNG, GIF, WebP</p>
                        </div>

                        {/* fields */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Display Name</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Enter display name"
                                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Member Since</label>
                                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                    {displayMemberSince}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* footer */}
                    <div className="flex gap-2.5 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !username.trim()}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 shadow-sm"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfileModal;