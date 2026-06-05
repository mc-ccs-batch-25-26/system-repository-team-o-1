import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import {
  Plus, Edit, Trash2, Save, X, Search, RefreshCw,
  AlertTriangle, CheckCircle, Shield, BookOpen,
  Eye, EyeOff, LayoutGrid, List, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchQuestions, createQuestion, updateQuestion, deleteQuestion,
  fetchCategories, createCategory, updateCategory, deleteCategory,
  Question, Category,
} from '../../firebase/questionService';
 
/* ─── Types ───────────────────────────────────────────────────── */
type Tab = 'questions' | 'categories';
 
/* ─── Theme tokens ────────────────────────────────────────────── */
const T = {
  bg:       '#080a10',
  surf:     '#0f1117',
  surf2:    '#13161f',
  surf3:    '#1a1e2b',
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.04)',
  textPri:  '#f0f1f5',
  textSec:  '#6b7280',
  textTer:  '#374151',
  accent:   '#6366f1',
  accentBg: 'rgba(99,102,241,0.10)',
};
 
/* ─── Shared input style ──────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%', background: T.surf3, border: `1px solid ${T.border}`,
  borderRadius: 10, padding: '10px 13px', fontSize: 13, color: T.textPri,
  outline: 'none', transition: 'border-color 0.2s',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
 
/* ─── Difficulty badge ────────────────────────────────────────── */
const DiffBadge: React.FC<{ d: string }> = ({ d }) => {
  const map: Record<string, { bg: string; color: string }> = {
    easy:   { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
    medium: { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
    hard:   { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  };
  const s = map[d] || map.medium;
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700,
      background: s.bg, color: s.color, display: 'inline-block',
      border: `1px solid ${s.color}28`,
    }}>{d}</span>
  );
};
 
/* ─── Status badge ────────────────────────────────────────────── */
const StatusBadge: React.FC<{ verified: boolean }> = ({ verified }) => (
  <span style={{
    padding: '2px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700,
    display: 'inline-block',
    background: verified ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)',
    color: verified ? '#818cf8' : T.textSec,
    border: `1px solid ${verified ? 'rgba(99,102,241,0.25)' : T.border}`,
  }}>
    {verified ? '✓ Verified' : 'Pending'}
  </span>
);
 
/* ─── Form field wrapper ──────────────────────────────────────── */
const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; span2?: boolean }> = ({
  label, required, children, span2,
}) => (
  <div style={{ gridColumn: span2 ? '1 / -1' : undefined }}>
    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textSec, marginBottom: 6 }}>
      {label}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
    </label>
    {children}
  </div>
);
 
/* ─── Auth loading / denied screens ──────────────────────────── */
const LoadingScreen = () => (
  <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
      <RefreshCw size={24} color={T.textSec} />
    </motion.div>
  </div>
);
 
const DeniedScreen = () => (
  <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Shield size={24} color="#f87171" />
      </div>
      <p style={{ fontSize: 18, fontWeight: 800, color: T.textPri, margin: 0 }}>Access Denied</p>
      <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>You don't have admin privileges</p>
    </div>
  </div>
);
 
/* ════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD WRAPPER (AUTH CHECK)
════════════════════════════════════════════════════════════════ */
const AdminDashboard: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
 
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setIsAdmin(profile?.role === 'admin' || profile?.role === 'super_admin');
      }
      setCheckingAuth(false);
    };
    checkAdmin();
  }, []);
 
  if (checkingAuth) return <LoadingScreen />;
  if (!isAdmin)    return <DeniedScreen />;
  return <AdminContent />;
};
 
/* ════════════════════════════════════════════════════════════════
   ADMIN CONTENT
════════════════════════════════════════════════════════════════ */
const AdminContent: React.FC = () => {
  const [activeTab, setActiveTab]         = useState<Tab>('questions');
  const [questions, setQuestions]         = useState<Question[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showForm, setShowForm]           = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [formError, setFormError]         = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
 
  const [formData, setFormData] = useState<Partial<Question>>({
    category_id: '', question_text: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: '', explanation: '',
    source_reference: '', source_type: 'official',
    difficulty: 'medium', is_active: true,
  });
 
  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([
        fetchQuestions({ searchTerm, categoryId: categoryFilter !== 'all' ? categoryFilter : undefined, difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined }),
        fetchCategories(),
      ]);
      setQuestions(q);
      setCategories(c);
    } catch (err) { console.error('Failed to load data:', err); }
    setLoading(false);
  }, [searchTerm, categoryFilter, difficultyFilter]);
 
  useEffect(() => { loadData(); }, [loadData]);
 
  /* ── Form handlers ── */
  const resetForm = () => {
    setFormData({ category_id: '', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', explanation: '', source_reference: '', source_type: 'official', difficulty: 'medium', is_active: true });
    setEditingId(null); setShowForm(false); setFormError('');
  };
  const startEdit = (q: Question) => {
    setFormData({ category_id: q.category_id, question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_answer: q.correct_answer, explanation: q.explanation || '', source_reference: q.source_reference || '', source_type: q.source_type || 'official', difficulty: q.difficulty, is_active: q.is_active });
    setEditingId(q.id); setShowForm(true); setFormError('');
  };
  const validateForm = (): boolean => {
    if (!formData.category_id) { setFormError('Category is required'); return false; }
    if (!formData.question_text?.trim()) { setFormError('Question text is required'); return false; }
    if (!formData.option_a?.trim()) { setFormError('Option A is required'); return false; }
    if (!formData.option_b?.trim()) { setFormError('Option B is required'); return false; }
    if (!formData.option_c?.trim()) { setFormError('Option C is required'); return false; }
    if (!formData.option_d?.trim()) { setFormError('Option D is required'); return false; }
    if (!formData.correct_answer) { setFormError('Correct answer is required'); return false; }
    if (!formData.source_reference?.trim()) { setFormError('Source reference is required for data integrity'); return false; }
    return true;
};
  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingId) await updateQuestion(editingId, formData);
      else           await createQuestion(formData);
      resetForm(); loadData();
    } catch (err: any) { setFormError(err.message || 'Failed to save question'); }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this question? This action cannot be undone.')) return;
    try { await deleteQuestion(id); loadData(); }
    catch (err) { console.error('Delete failed:', err); }
  };
 
 
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.textPri, fontFamily: 'inherit' }}>
 
      {/* ── Ambient ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(99,102,241,0.08) 0%,transparent 70%)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.018, backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />
      </div>
 
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '28px 20px 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>
 
        {/* ══ HEADER ══ */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.accentBg, border: `1px solid rgba(99,102,241,0.20)`, padding: '3px 10px', borderRadius: 999, marginBottom: 8 }}>
              <Sparkles size={10} color={T.accent} />
              <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: '0.10em', textTransform: 'uppercase' }}>Admin Console</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: T.textPri, margin: 0, letterSpacing: '-0.4px' }}>Question Bank</h1>
            <p style={{ fontSize: 12, color: T.textSec, margin: '3px 0 0' }}>Manage questions, answers, and categories</p>
          </div>
 
          {/* Stats + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <StatPill label={`${questions.length} questions`} color={T.textSec} bg={T.surf} border={T.border} />
        <CTAButton onClick={() => { resetForm(); setShowForm(true); }} icon={<Plus size={14} />}>
            Add Question
       </CTAButton>
       </div>
        </motion.div>
 
        {/* ══ TABS ══ */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 12, padding: 4 }}>
          {(['questions', 'categories'] as Tab[]).map(tab => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                position: 'relative', border: 'none', background: 'none', cursor: 'pointer',
                padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                color: active ? '#0f172a' : T.textSec, transition: 'color 0.15s',
                textTransform: 'capitalize',
              }}>
                {active && (
                  <motion.div
                    layoutId="admin-tab-pill"
                    style={{ position: 'absolute', inset: 0, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{tab}</span>
              </button>
            );
          })}
        </div>
 
        {/* ══ QUESTIONS TAB ══ */}
        {activeTab === 'questions' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{
                flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8,
                background: searchFocused ? 'rgba(255,255,255,0.06)' : T.surf,
                border: `1px solid ${searchFocused ? 'rgba(99,102,241,0.40)' : T.border}`,
                borderRadius: 12, padding: '0 12px',
                boxShadow: searchFocused ? '0 0 0 3px rgba(99,102,241,0.10)' : 'none',
                transition: 'all 0.2s',
              }}>
                <Search size={14} color={searchFocused ? T.accent : T.textSec} style={{ flexShrink: 0 }} />
                <input
                  type="text" placeholder="Search questions…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '10px 0', fontSize: 13, color: T.textPri }}
                />
              </div>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ ...selectStyle, flex: '0 1 180px', width: 'auto' }}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} style={{ ...selectStyle, flex: '0 1 150px', width: 'auto' }}>
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
 
            {/* ── Question Form ── */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background: T.surf, border: `1px solid ${T.border}`,
                    borderRadius: 20, overflow: 'hidden',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Form header */}
                  <div style={{ padding: '18px 22px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.surf2 }}>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, color: T.textPri, margin: 0, letterSpacing: '-0.2px' }}>
                        {editingId ? 'Edit Question' : 'Add New Question'}
                      </h2>
                      <p style={{ fontSize: 11, color: T.textSec, margin: '2px 0 0' }}>Fill in all required fields marked with *</p>
                    </div>
                    <button onClick={resetForm} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surf3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSec, transition: 'all 0.15s' }}>
                      <X size={14} />
                    </button>
                  </div>
 
                  <div style={{ padding: '20px 22px 22px' }}>
                    {/* Error */}
                    <AnimatePresence>
                      {formError && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}
                        >
                          <AlertTriangle size={13} color="#f87171" />
                          <span style={{ fontSize: 12, color: '#fca5a5' }}>{formError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
 
                    {/* Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                      <Field label="Category" required>
                        <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} style={selectStyle}>
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </Field>
 
                      <Field label="Difficulty">
                        <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} style={selectStyle}>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </Field>
 
                      <Field label="Question Text" required span2>
                        <textarea
                          value={formData.question_text} rows={3}
                          onChange={e => setFormData({ ...formData, question_text: e.target.value })}
                          placeholder="Enter the question…"
                          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
                        />
                      </Field>
 
                      {(['A', 'B', 'C', 'D'] as const).map(letter => (
                        <Field key={letter} label={`Option ${letter}`} required>
                          <input
                            value={formData[`option_${letter.toLowerCase()}` as keyof Question] as string || ''}
                            onChange={e => setFormData({ ...formData, [`option_${letter.toLowerCase()}`]: e.target.value })}
                            placeholder={`Option ${letter}`}
                            style={inputStyle}
                          />
                        </Field>
                      ))}
 
                      <Field label="Correct Answer" required>
                        <select value={formData.correct_answer} onChange={e => setFormData({ ...formData, correct_answer: e.target.value })} style={selectStyle}>
                          <option value="">Select</option>
                          {['A','B','C','D'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </Field>
 
                      <Field label="Source Reference" required>
                        <input value={formData.source_reference} onChange={e => setFormData({ ...formData, source_reference: e.target.value })} placeholder="e.g., RA 6713, Art. XI 1987 Constitution" style={inputStyle} />
                      </Field>
 
                      <Field label="Source Type">
                        <select value={formData.source_type || 'official'} onChange={e => setFormData({ ...formData, source_type: e.target.value })} style={selectStyle}>
                          <option value="official">Official</option>
                          <option value="law">Law</option>
                          <option value="manual">Manual</option>
                          <option value="memo">Memo</option>
                          <option value="reviewer">Reviewer</option>
                        </select>
                      </Field>
 
                      <Field label="Explanation" span2>
                        <textarea
                          value={formData.explanation} rows={2}
                          onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                          placeholder="Explain why this is the correct answer…"
                          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
                        />
                      </Field>
                    </div>
 
                    {/* Active toggle + actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, flexWrap: 'wrap', gap: 12 }}>
                      <button
                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 14px', borderRadius: 10, border: `1px solid ${formData.is_active ? 'rgba(16,185,129,0.30)' : T.border}`,
                          background: formData.is_active ? 'rgba(16,185,129,0.10)' : T.surf3,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {formData.is_active
                          ? <Eye size={14} color="#34d399" />
                          : <EyeOff size={14} color={T.textSec} />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: formData.is_active ? '#34d399' : T.textSec }}>
                          {formData.is_active ? 'Active (visible)' : 'Hidden (inactive)'}
                        </span>
                      </button>
 
                      <div style={{ display: 'flex', gap: 8 }}>
                        <GhostBtn onClick={resetForm}>Cancel</GhostBtn>
                        <CTAButton onClick={handleSubmit} icon={<Save size={13} />}>
                          {editingId ? 'Update' : 'Save Question'}
                        </CTAButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
 
            {/* ── Questions Table ── */}
            <div style={{
              background: T.surf, border: `1px solid ${T.border}`,
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 130px 70px 90px 90px 90px',
                gap: 0,
                padding: '10px 18px',
                borderBottom: `1px solid ${T.border}`,
                background: T.surf2,
              }}>
                {['Question', 'Category', 'Answer', 'Difficulty', 'Status', 'Actions'].map((h, i) => (
                  <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: T.textSec, textAlign: i >= 4 ? 'center' : i === 1 ? 'left' : 'center' }}>
                    {h}
                  </span>
                ))}
              </div>
 
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw size={20} color={T.textSec} />
                  </motion.div>
                  <span style={{ fontSize: 12, color: T.textSec }}>Loading questions…</span>
                </div>
              ) : questions.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: T.surf3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={20} color={T.textTer} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.textSec, margin: 0 }}>No questions found</p>
                  <p style={{ fontSize: 12, color: T.textTer, margin: 0 }}>Add your first question to get started</p>
                </div>
              ) : (
                <div>
                  {questions.map((q, idx) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.025, duration: 0.3 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 130px 70px 90px 90px 90px',
                        alignItems: 'center', gap: 0,
                        padding: '12px 18px',
                        borderBottom: idx < questions.length - 1 ? `1px solid ${T.border2}` : 'none',
                        background: 'transparent',
                        opacity: q.is_active ? 1 : 0.45,
                        transition: 'background 0.15s',
                      }}
                      whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      {/* Question text */}
                      <div style={{ paddingRight: 16 }}>
                        <p style={{ fontSize: 13, color: T.textPri, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {q.question_text}
                        </p>
                        {q.source_reference && (
                          <span style={{ display: 'inline-block', marginTop: 4, padding: '1px 7px', borderRadius: 5, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)', fontSize: 9, color: '#fbbf24', fontWeight: 600 }}>
                            📎 {q.source_reference}
                          </span>
                        )}
                      </div>
 
                      {/* Category */}
                      <span style={{ fontSize: 11, color: T.textSec, paddingRight: 8 }}>
                        {q.categories?.name || '—'}
                      </span>
 
                      {/* Answer */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <CheckCircle size={12} color="#34d399" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#34d399' }}>{q.correct_answer}</span>
                      </div>
 
                      {/* Difficulty */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <DiffBadge d={q.difficulty} />
                      </div>
 
                      {/* Status */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <StatusBadge verified={!!q.last_verified_at} />
                      </div>
 
                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <IconBtn onClick={() => startEdit(q)} title="Edit" color="#818cf8">
                          <Edit size={13} />
                        </IconBtn>
                        <IconBtn onClick={() => handleDelete(q.id)} title="Delete" color="#f87171">
                          <Trash2 size={13} />
                        </IconBtn>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
 
              {/* Table footer */}
              {questions.length > 0 && (
                <div style={{ padding: '10px 18px', borderTop: `1px solid ${T.border}`, background: T.surf2, display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
 
        {/* ══ CATEGORIES TAB ══ */}
        {activeTab === 'categories' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <CategoryManager categories={categories} onUpdate={loadData} />
          </motion.div>
        )}
 
      </div>
    </div>
  );
};
 
/* ────────────────────────────────────────────────────────
   CATEGORY MANAGER (logic unchanged)
──────────────────────────────────────────────────────── */
const CategoryManager: React.FC<{ categories: Category[]; onUpdate: () => void }> = ({ categories, onUpdate }) => {
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData]   = useState({ name: '', description: '', icon: '' });
 
  const resetForm = () => { setFormData({ name: '', description: '', icon: '' }); setEditingId(null); setShowForm(false); };
 
  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    try {
      if (editingId) await updateCategory(editingId, formData);
      else           await createCategory(formData);
      resetForm(); onUpdate();
    } catch (err) { console.error('Failed to save category:', err); }
  };
 
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category? All questions in it will also be deleted.')) return;
    try { await deleteCategory(id); onUpdate(); }
    catch (err) { console.error('Delete failed:', err); }
  };
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.textPri, margin: 0 }}>Categories</h2>
          <p style={{ fontSize: 12, color: T.textSec, margin: '2px 0 0' }}>{categories.length} categories</p>
        </div>
        <CTAButton onClick={() => setShowForm(true)} icon={<Plus size={13} />}>Add Category</CTAButton>
      </div>
 
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            style={{ background: T.surf, border: `1px solid ${T.border}`, borderRadius: 18, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 6px 30px rgba(0,0,0,0.4)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.textPri, margin: 0 }}>
                {editingId ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={resetForm} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${T.border}`, background: T.surf3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSec }}>
                <X size={12} />
              </button>
            </div>
            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Category name *" style={inputStyle} />
            <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description (optional)" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <GhostBtn onClick={resetForm}>Cancel</GhostBtn>
              <CTAButton onClick={handleSubmit} icon={<Save size={13} />}>{editingId ? 'Update' : 'Save'}</CTAButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.3 }}
            style={{
              background: T.surf, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 16px 14px',
              display: 'flex', flexDirection: 'column', gap: 8,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            whileHover={{ boxShadow: '0 4px 20px rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.22)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.textPri, margin: '0 0 4px', letterSpacing: '-0.2px' }}>{cat.name}</p>
                {cat.description && <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.5 }}>{cat.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <IconBtn
                  onClick={() => { setEditingId(cat.id); setFormData({ name: cat.name, description: cat.description || '', icon: cat.icon || '' }); setShowForm(true); }}
                  title="Edit" color="#818cf8"
                >
                  <Edit size={12} />
                </IconBtn>
                <IconBtn onClick={() => handleDelete(cat.id)} title="Delete" color="#f87171">
                  <Trash2 size={12} />
                </IconBtn>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
 
/* ────────────────────────────────────────────────────────
   SHARED MICRO-COMPONENTS
──────────────────────────────────────────────────────── */
function StatPill({ label, color, bg, border, icon }: { label: string; color: string; bg: string; border: string; icon?: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, background: bg, border: `1px solid ${border}`, fontSize: 12, fontWeight: 600, color }}>
      {icon}{label}
    </span>
  );
}
 
function CTAButton({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button
      onClick={onClick} whileTap={{ scale: 0.97 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '9px 16px', borderRadius: 11, border: 'none',
        background: hov ? 'linear-gradient(135deg,#4f46e5,#6366f1)' : 'linear-gradient(135deg,#6366f1,#818cf8)',
        color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(99,102,241,0.30)',
        transition: 'background 0.15s',
      }}
    >
      {icon}{children}
    </motion.button>
  );
}
 
function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: '9px 16px', borderRadius: 11, border: `1px solid ${T.border}`,
        background: hov ? T.surf3 : T.surf2,
        color: T.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
      }}
    >{children}</button>
  );
}
 
function IconBtn({ children, onClick, title, color }: { children: React.ReactNode; onClick: () => void; title: string; color: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 28, height: 28, borderRadius: 7, border: `1px solid ${hov ? `${color}30` : T.border}`,
        background: hov ? `${color}12` : T.surf2,
        color: hov ? color : T.textSec,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s',
      }}
    >{children}</button>
  );
}
 
export default AdminDashboard;