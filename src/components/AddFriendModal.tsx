import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, UserPlus, Clock, Loader } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .afm-root * { box-sizing: border-box; }
  .afm-root {
    --bg:          #08080c;
    --surface:     rgba(255,255,255,0.032);
    --surface-hov: rgba(255,255,255,0.058);
    --border:      rgba(255,255,255,0.072);
    --border-acc:  rgba(100,102,241,0.3);
    --indigo:      #6466f1;
    --indigo-dim:  rgba(100,102,241,0.14);
    --red:         #f43f5e;
    --text-1:      #f4f4f6;
    --text-2:      #9090a0;
    --text-3:      #55555f;
    --amber:       #f59e0b;
    --green:       #10b981;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Backdrop ──────────────────────────────── */
  .afm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  /* ── Card ──────────────────────────────────── */
  .afm-card {
    width: 100%;
    max-width: 430px;
    background: #111116;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 22px;
    box-shadow:
      0 40px 100px rgba(0,0,0,0.75),
      0 0 0 1px rgba(255,255,255,0.04),
      inset 0 1px 0 rgba(255,255,255,0.06);
    overflow: hidden;
    position: relative;
  }

  /* subtle indigo shimmer at top of card */
  .afm-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(100,102,241,0.55) 40%,
      rgba(168,85,247,0.4) 60%,
      transparent 100%);
    pointer-events: none;
  }

  /* ── Header ────────────────────────────────── */
  .afm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 22px 0;
  }

  .afm-title {
    font-family: 'Sora', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: var(--text-1);
    letter-spacing: -0.02em;
  }

  .afm-eyebrow {
    font-family: 'Sora', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--indigo);
    margin-bottom: 4px;
  }

  .afm-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px; height: 32px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-3);
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border-color 0.18s, transform 0.13s;
  }
  .afm-close-btn:hover {
    background: var(--surface-hov);
    color: var(--text-1);
    border-color: rgba(255,255,255,0.14);
  }
  .afm-close-btn:active { transform: scale(0.9); }

  /* ── Body padding ──────────────────────────── */
  .afm-body {
    padding: 18px 22px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* ── Divider ───────────────────────────────── */
  .afm-divider {
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      var(--border) 25%,
      var(--border) 75%,
      transparent);
    margin: 0 22px;
  }

  /* ── Search row ────────────────────────────── */
  .afm-search-row {
    display: flex;
    gap: 8px;
  }

  .afm-input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 13px;
    height: 42px;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    transition: border-color 0.2s, background 0.2s;
  }
  .afm-input-wrap:focus-within {
    border-color: var(--border-acc);
    background: rgba(100,102,241,0.06);
  }

  .afm-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-1);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    caret-color: var(--indigo);
  }
  .afm-input::placeholder { color: var(--text-3); }

  .afm-search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 42px;
    padding: 0 18px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #6466f1 0%, #8b5cf6 100%);
    color: #fff;
    font-family: 'Sora', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.01em;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(100,102,241,0.35);
    transition: opacity 0.18s, transform 0.14s, box-shadow 0.18s;
    white-space: nowrap;
  }
  .afm-search-btn:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(100,102,241,0.48);
  }
  .afm-search-btn:active:not(:disabled) { transform: scale(0.96); }
  .afm-search-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  /* ── Results list ──────────────────────────── */
  .afm-results {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 280px;
    overflow-y: auto;
    /* custom scrollbar */
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }
  .afm-results::-webkit-scrollbar { width: 4px; }
  .afm-results::-webkit-scrollbar-track { background: transparent; }
  .afm-results::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.08);
    border-radius: 2px;
  }

  /* ── Result card ───────────────────────────── */
  .afm-result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 13px;
    border-radius: 13px;
    background: var(--surface);
    border: 1px solid var(--border);
    transition: background 0.18s, border-color 0.18s, transform 0.15s;
  }
  .afm-result-item:hover {
    background: var(--surface-hov);
    border-color: rgba(255,255,255,0.11);
    transform: translateX(2px);
  }

  /* avatar placeholder */
  .afm-avatar-ring {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: var(--indigo-dim);
    border: 1.5px solid var(--border-acc);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--indigo);
    overflow: hidden;
  }

  .afm-avatar-img {
    width: 100%; height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .afm-username {
    flex: 1;
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  /* ── Add button ────────────────────────────── */
  .afm-add-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 13px;
    border-radius: 9px;
    border: none;
    background: var(--indigo-dim);
    color: var(--indigo);
    font-family: 'Sora', sans-serif;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid rgba(100,102,241,0.25);
    transition: background 0.18s, border-color 0.18s, transform 0.13s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .afm-add-btn:hover:not(:disabled) {
    background: rgba(100,102,241,0.24);
    border-color: rgba(100,102,241,0.45);
  }
  .afm-add-btn:active:not(:disabled) { transform: scale(0.94); }
  .afm-add-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Pending pill ──────────────────────────── */
  .afm-pending-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.18);
    flex-shrink: 0;
  }

  /* ── Empty / meta text ─────────────────────── */
  .afm-meta {
    text-align: center;
    color: var(--text-3);
    font-size: 13px;
    padding: 28px 0 12px;
  }

  /* ── Spinner ───────────────────────────────── */
  @keyframes afm-spin { to { transform: rotate(360deg); } }
  .afm-spin { animation: afm-spin 0.7s linear infinite; }
`;

/* ─── spring config ─────────────────────────── */
const modalSpring = { type: 'spring', stiffness: 380, damping: 30 };

const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── helpers ───────────────────────────────── */
const Initials: React.FC<{ name: string }> = ({ name }) => (
    <>{name ? name.charAt(0).toUpperCase() : '?'}</>
);

/* ══════════════════════════════════════════════ */
interface AddFriendModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    onFriendAdded: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({
    isOpen, onClose, currentUserId, onFriendAdded,
}) => {
    const [searchTerm, setSearchTerm]     = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching]       = useState(false);
    const [sendingId, setSendingId]       = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* auto-focus input when modal opens */
    useEffect(() => {
        if (isOpen) {
            const t = setTimeout(() => inputRef.current?.focus(), 80);
            return () => clearTimeout(t);
        } else {
            setSearchTerm('');
            setSearchResults([]);
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setSearching(true);
        const { data } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .neq('id', currentUserId)
            .ilike('username', `%${searchTerm}%`)
            .limit(10);
        setSearchResults(data || []);
        setSearching(false);
    };

    const handleSendRequest = async (receiverId: string) => {
        setSendingId(receiverId);
        const { error } = await supabase
            .from('friendships')
            .insert({ sender_id: currentUserId, receiver_id: receiverId, status: 'pending' });
        if (!error) {
            onFriendAdded();
            setSearchResults(prev =>
                prev.map(u => u.id === receiverId ? { ...u, requestSent: true } : u)
            );
        }
        setSendingId(null);
    };

    const hasSearched = searchResults.length > 0 || (!searching && searchTerm.trim().length > 0);

    return (
        <>
            <style>{css}</style>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="afm-root afm-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={onClose}
                    >
                        <motion.div
                            className="afm-card"
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 12 }}
                            transition={modalSpring}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* ── Header ──────────────────────────── */}
                            <div className="afm-header">
                                <div>
                                    <h2 className="afm-title">Add Friend</h2>
                                </div>
                                <button className="afm-close-btn" onClick={onClose} title="Close">
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="afm-divider" style={{ margin: '16px 22px 0' }} />

                            {/* ── Body ────────────────────────────── */}
                            <div className="afm-body">

                                {/* Search row */}
                                <div className="afm-search-row">
                                    <div className="afm-input-wrap">
                                        <Search size={14} color="var(--text-3)" style={{ flexShrink: 0 }} />
                                        <input
                                            ref={inputRef}
                                            className="afm-input"
                                            type="text"
                                            placeholder="Search by username…"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => { setSearchTerm(''); setSearchResults([]); }}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--text-3)', display: 'flex', padding: 0,
                                                    transition: 'color 0.15s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        className="afm-search-btn"
                                        onClick={handleSearch}
                                        disabled={searching || !searchTerm.trim()}
                                    >
                                        {searching
                                            ? <Loader size={13} className="afm-spin" />
                                            : <Search size={13} />
                                        }
                                        {searching ? 'Searching' : 'Search'}
                                    </button>
                                </div>

                                {/* Results */}
                                <AnimatePresence mode="wait">
                                    {searching && (
                                        <motion.div
                                            key="searching"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="afm-meta"
                                        >
                                            <Loader size={16} className="afm-spin" style={{ display: 'inline-block', marginBottom: 8, color: 'var(--indigo)' }} />
                                            <p>Looking for users…</p>
                                        </motion.div>
                                    )}

                                    {!searching && searchResults.length > 0 && (
                                        <motion.div
                                            key="results"
                                            className="afm-results"
                                            variants={listVariants}
                                            initial="hidden"
                                            animate="show"
                                        >
                                            {searchResults.map(user => (
                                                <motion.div
                                                    key={user.id}
                                                    className="afm-result-item"
                                                    variants={itemVariants}
                                                >
                                                    {/* Avatar */}
                                                    <div className="afm-avatar-ring">
                                                        {user.avatar_url
                                                            ? <img src={user.avatar_url} alt={user.username} className="afm-avatar-img" />
                                                            : <Initials name={user.username} />
                                                        }
                                                    </div>

                                                    <span className="afm-username">{user.username}</span>

                                                    {user.requestSent ? (
                                                        <div className="afm-pending-pill">
                                                            <Clock size={10} color="var(--amber)" />
                                                            <span style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700 }}>
                                                                Pending
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="afm-add-btn"
                                                            onClick={() => handleSendRequest(user.id)}
                                                            disabled={sendingId === user.id}
                                                        >
                                                            {sendingId === user.id
                                                                ? <Loader size={11} className="afm-spin" />
                                                                : <UserPlus size={11} />
                                                            }
                                                            {sendingId === user.id ? 'Sending…' : 'Add'}
                                                        </button>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}

                                    {!searching && hasSearched && searchResults.length === 0 && (
                                        <motion.p
                                            key="no-results"
                                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                            className="afm-meta"
                                        >
                                            No users found for "{searchTerm}"
                                        </motion.p>
                                    )}

                                    {!searching && !hasSearched && (
                                        <motion.p
                                            key="prompt"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="afm-meta"
                                        >
                                            Type a username and press Search
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AddFriendModal;