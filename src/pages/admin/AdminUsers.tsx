import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { Search, RefreshCw, Activity, UserMinus, Users, Clock, Wifi, WifiOff, Shield, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
 
const ROLE_META: Record<string, { bg: string; color: string; border: string; label: string }> = {
  super_admin: { bg: 'rgba(251,191,36,0.10)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)', label: 'Super Admin' },
  admin:       { bg: 'rgba(99,102,241,0.10)', color: '#818cf8', border: 'rgba(99,102,241,0.25)', label: 'Admin' },
  user:        { bg: 'rgba(255,255,255,0.05)', color: '#6b7280', border: 'rgba(255,255,255,0.08)', label: 'User' },
};
 
const StatPill: React.FC<{ 
  label: string; 
  color: string; 
  bg: string; 
  border: string; 
  icon?: React.ReactNode;
}> = ({ label, color, bg, border, icon }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 10px',
    borderRadius: 999,
    background: bg,
    border: `1px solid ${border}`,
    fontSize: 11,
    fontWeight: 700,
    color: color,
  }}>
    {icon}
    {label}
  </div>
);

const T = {
  bg: '#0f0f0f',
  surf: 'rgba(255,255,255,0.03)',
  surf2: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)',
  textPri: '#f5f5f5',
  textSec: '#a3a3a3',
  textTer: '#525252',
  accent: '#818cf8',
  accentBg: 'rgba(99,102,241,0.08)',
};

export const AdminUsers: React.FC = () => {
  const [users, setUsers]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
 
  useEffect(() => { 
    fetchUsers();
    getCurrentAdmin();
  }, []);

  const getCurrentAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentAdminId(user.id);
  };
 
  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, email, role, created_at, last_active_date');
    if (profiles) setUsers(profiles.map(p => ({ ...p, email: p.email || 'N/A' })));
    setLoading(false);
  };
 
  const toggleRole = async (userId: string, currentRole: string) => {
    // Don't allow changing your own role
    if (userId === currentAdminId) return;
    
    // Cycle: user → admin → super_admin → user
    const roles = ['user', 'admin', 'super_admin'];
    const currentIndex = roles.indexOf(currentRole || 'user');
    const newRole = roles[(currentIndex + 1) % roles.length];
    
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  };
 
  const getUserStatus = (lastActiveDate: string | null) => {
    if (!lastActiveDate) return { active: false, text: 'Never active' };
    const diff = Math.floor((Date.now() - new Date(lastActiveDate).getTime()) / 86_400_000);
    if (diff <= 7) return { active: true, text: diff === 0 ? 'Today' : diff === 1 ? '1 day ago' : `${diff} days ago` };
    return { active: false, text: `${diff} days ago` };
  };
 
  const filtered     = users.filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeCount  = users.filter(u => getUserStatus(u.last_active_date).active).length;
 
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.textPri, fontFamily: 'inherit' }}>
 
      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.018, backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />
      </div>
 
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>
 
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.accentBg, border: `1px solid rgba(99,102,241,0.20)`, padding: '3px 10px', borderRadius: 999, marginBottom: 8 }}>
              <Users size={10} color={T.accent} />
              <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: '0.10em', textTransform: 'uppercase' }}>User Management</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: T.textPri, margin: 0, letterSpacing: '-0.4px' }}>All Users</h1>
            <p style={{ fontSize: 12, color: T.textSec, margin: '3px 0 0' }}>Manage accounts, roles, and activity</p>
          </div>
 
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatPill label={`${activeCount} active`}  color="#34d399" bg="rgba(16,185,129,0.10)" border="rgba(16,185,129,0.22)" icon={<Wifi size={11} />} />
            <StatPill label={`${users.length} total`}  color={T.textSec} bg={T.surf} border={T.border} />
          </div>
        </motion.div>
 
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: searchFocused ? 'rgba(255,255,255,0.06)' : T.surf,
          border: `1px solid ${searchFocused ? 'rgba(99,102,241,0.40)' : T.border}`,
          borderRadius: 12, padding: '0 14px',
          boxShadow: searchFocused ? '0 0 0 3px rgba(99,102,241,0.10)' : 'none',
          transition: 'all 0.2s',
        }}>
          <Search size={15} color={searchFocused ? T.accent : T.textSec} style={{ flexShrink: 0 }} />
          <input
            type="text" placeholder="Search by username or email…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '11px 0', fontSize: 13, color: T.textPri }}
          />
          {searchTerm && <span style={{ fontSize: 11, color: T.textSec, whiteSpace: 'nowrap' }}>{filtered.length} results</span>}
        </div>
 
        {/* Table */}
        <div style={{ background: T.surf, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 110px 100px 150px 80px', padding: '10px 18px', borderBottom: `1px solid ${T.border}`, background: T.surf2 }}>
            {['Username', 'Email', 'Role', 'Joined', 'Status', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: T.textSec, textAlign: i === 4 || i === 5 ? 'right' : 'left' }}>
                {h}
              </span>
            ))}
          </div>
 
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <RefreshCw size={20} color={T.textSec} />
              </motion.div>
              <span style={{ fontSize: 12, color: T.textSec }}>Loading users…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: T.textSec, margin: 0 }}>No users found</p>
            </div>
          ) : (
            filtered.map((user, idx) => {
              const status  = getUserStatus(user.last_active_date);
              const roleMeta = ROLE_META[user.role] || ROLE_META.user;
              const isSelf = user.id === currentAdminId;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 2fr 110px 100px 150px 80px',
                    alignItems: 'center', padding: '13px 18px',
                    borderBottom: idx < filtered.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none',
                    transition: 'background 0.15s',
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  {/* Username */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: 'linear-gradient(135deg,#6366f1,#818cf8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: '#fff',
                    }}>
                      {(user.username || 'U')[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.textPri }}>
                      {user.username || 'Unnamed'}
                      {isSelf && <span style={{ fontSize: 9, color: T.accent, marginLeft: 6 }}>(you)</span>}
                    </span>
                  </div>
 
                  {/* Email */}
                  <span style={{ fontSize: 12, color: T.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                    {user.email}
                  </span>
 
                  {/* Role — Clickable to toggle */}
                  <button
                    onClick={() => toggleRole(user.id, user.role)}
                    disabled={isSelf}
                    title={isSelf ? "Can't change your own role" : `Click to change role (current: ${roleMeta.label})`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      background: roleMeta.bg,
                      color: roleMeta.color,
                      border: `1px solid ${roleMeta.border}`,
                      cursor: isSelf ? 'default' : 'pointer',
                      opacity: isSelf ? 0.7 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <Shield size={10} />
                    {roleMeta.label}
                    {!isSelf && <ChevronDown size={10} />}
                  </button>
 
                  {/* Joined */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={11} color={T.textTer} />
                    <span style={{ fontSize: 11, color: T.textSec }}>
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  </div>
 
                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: status.active ? '#34d399' : T.textTer,
                      boxShadow: status.active ? '0 0 6px rgba(52,211,153,0.5)' : 'none',
                    }} />
                    <span style={{ fontSize: 11, color: status.active ? '#34d399' : T.textSec }}>
                      {status.active ? `Active · ${status.text}` : `Inactive · ${status.text}`}
                    </span>
                  </div>

                  {/* Empty (actions column placeholder) */}
                  <div />
                </motion.div>
              );
            })
          )}
 
          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div style={{ padding: '10px 18px', borderTop: `1px solid ${T.border}`, background: T.surf2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: T.textTer }}>Click a role badge to promote/demote users</span>
              <span style={{ fontSize: 11, color: T.textSec }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
 
      </div>
    </div>
  );
};

export default AdminUsers;