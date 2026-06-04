import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Clock, Check, X, UserMinus } from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import UserAvatar from '../components/UserAvatar';
import AddFriendModal from '../components/AddFriendModal';

const FriendsPage: React.FC = () => {
    const { currentUser } = useOutletContext<any>();
    const {
        friends,
        pendingRequests,
        sentRequests,
        loading,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        refresh,
    } = useFriends(currentUser?.id);

    const [showAddFriend, setShowAddFriend] = useState(false);
    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent'>('friends');

    const [removeDialog, setRemoveDialog] = useState<{
        isOpen: boolean;
        friend: { friendship_id: string; username: string } | null;
    }>({ isOpen: false, friend: null });

    const pendingCount = pendingRequests.length;

    const handleRemoveClick = (friend: any) => {
        setRemoveDialog({ isOpen: true, friend });
    };

    const handleConfirmRemove = async () => {
        if (removeDialog.friend) {
            await removeFriend(removeDialog.friend.friendship_id);
            setRemoveDialog({ isOpen: false, friend: null });
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b' }}>
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white" style={{ background: '#09090b' }}>
            <div className="relative z-10 flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 py-9 space-y-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                        
                            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#858794' }}>
                                Friends
                            </p>
                        </div>
                        <h1 className="text-2xl font-black text-white">Your Friends</h1>
                    </div>

                    <button
                        onClick={() => setShowAddFriend(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ background: '#6366f1' }}
                    >
                        <UserPlus size={14} />
                        Add Friend
                    </button>
                </motion.div>

                {/* Tabs */}
                <div className="flex rounded-xl p-0.5 gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {[
                        { id: 'friends', label: 'Friends', count: friends.length },
                        { id: 'requests', label: 'Requests', count: pendingCount },
                        { id: 'sent', label: 'Sent', count: sentRequests.length },
                    ].map(({ id, label, count }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                            style={{
                                color: activeTab === id ? '#fff' : '#71717a',
                                background: activeTab === id ? 'rgba(99,102,241,0.15)' : 'transparent',
                            }}
                        >
                            {label}
                            {count > 0 && (
                                <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{
                                        background: id === 'requests' ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                        color: id === 'requests' ? '#fff' : '#a1a1aa',
                                    }}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Friends List */}
                <AnimatePresence mode="wait">
                    {activeTab === 'friends' && (
                        <motion.div
                            key="friends"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-2"
                        >
                            {friends.length === 0 ? (
                                <div className="text-center py-16">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                                        style={{ background: 'rgba(255,255,255,0.04)' }}
                                    >
                                        <Users size={24} color="#52525b" />
                                    </div>
                                    <p className="text-white font-semibold mb-1">No friends yet</p>
                                    <p className="text-sm text-zinc-500">Add friends to see their rankings!</p>
                                </div>
                            ) : (
                                friends.map((friend: any) => (
                                    <motion.div
                                        key={friend.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        <UserAvatar
                                            avatarUrl={friend.avatar_url}
                                            username={friend.username || 'Unknown'}
                                            size={40}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {friend.username || 'Unknown'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveClick(friend)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                            title="Remove friend"
                                        >
                                            <UserMinus size={14} color="#ef4444" />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Pending Requests */}
                    {activeTab === 'requests' && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-2"
                        >
                            {pendingRequests.length === 0 ? (
                                <div className="text-center py-16">
                                    <Clock size={24} color="#52525b" className="mx-auto mb-3" />
                                    <p className="text-white font-semibold mb-1">No pending requests</p>
                                    <p className="text-sm text-zinc-500">Requests will appear here</p>
                                </div>
                            ) : (
                                pendingRequests.map((request: any) => (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                        style={{
                                            background: 'rgba(99,102,241,0.05)',
                                            border: '1px solid rgba(99,102,241,0.15)',
                                        }}
                                    >
                                        <UserAvatar
                                            avatarUrl={request.sender?.avatar_url ?? null}
                                            username={request.sender?.username || 'Unknown'}
                                            size={40}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {request.sender?.username || 'Unknown'}
                                            </p>
                                            <p className="text-[10px] text-zinc-500">Wants to be your friend</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => acceptFriendRequest(request.id)}
                                                className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                                                title="Accept"
                                            >
                                                <Check size={14} color="#34d399" />
                                            </button>
                                            <button
                                                onClick={() => rejectFriendRequest(request.id)}
                                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                                                title="Reject"
                                            >
                                                <X size={14} color="#f87171" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Sent Requests */}
                    {activeTab === 'sent' && (
                        <motion.div
                            key="sent"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-2"
                        >
                            {sentRequests.length === 0 ? (
                                <div className="text-center py-16">
                                    <Clock size={24} color="#52525b" className="mx-auto mb-3" />
                                    <p className="text-white font-semibold mb-1">No sent requests</p>
                                    <p className="text-sm text-zinc-500">Search for users to add</p>
                                </div>
                            ) : (
                                sentRequests.map((request: any) => (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        <UserAvatar
                                            avatarUrl={request.receiver?.avatar_url ?? null}
                                            username={request.receiver?.username || 'Unknown'}
                                            size={40}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {request.receiver?.username || 'Unknown'}
                                            </p>
                                            <p className="text-[10px] text-zinc-500">Request pending...</p>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full"
                                            style={{ background: 'rgba(251,191,36,0.1)' }}>
                                            <Clock size={10} color="#fbbf24" />
                                            <span className="text-[10px] text-yellow-400 font-medium">Pending</span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Add Friend Modal */}
                <AddFriendModal
                    isOpen={showAddFriend}
                    onClose={() => setShowAddFriend(false)}
                    currentUserId={currentUser?.id}
                    onFriendAdded={refresh}
                />

                {/* Remove Friend Dialog */}
                <AnimatePresence>
                    {removeDialog.isOpen && (
                        <motion.div
                            key="remove-dialog-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
                            onClick={() => setRemoveDialog({ isOpen: false, friend: null })}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                                transition={{ duration: 0.22 }}
                                className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-6"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                        <UserMinus className="w-4.5 h-4.5 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">
                                            Remove {removeDialog.friend?.username || 'friend'}?
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            You won't see each other's rankings anymore. You can add them again later.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={() => setRemoveDialog({ isOpen: false, friend: null })}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmRemove}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white transition-all"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FriendsPage;