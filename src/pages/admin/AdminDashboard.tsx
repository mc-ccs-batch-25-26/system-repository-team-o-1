import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { 
  Plus, Edit, Trash2, Save, X, Search, Filter, 
  CheckCircle, Shield, BookOpen, RefreshCw, AlertTriangle,
  ChevronDown, Eye, EyeOff, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchQuestions, createQuestion, updateQuestion, deleteQuestion,
  fetchCategories, createCategory, updateCategory, deleteCategory,
  Question, Category
} from '../../firebase/questionService';

/* ────────────────────────────────────────────────────────
   TYPES
──────────────────────────────────────────────────────── */
type Tab = 'questions' | 'categories';

/* ────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────── */
const AdminDashboard: React.FC = () => {
  // Auth check
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.role === 'admin' || profile?.role === 'super_admin');
      }
      setCheckingAuth(false);
    };
    checkAdmin();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Shield className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-zinc-500">You don't have admin privileges</p>
        </div>
      </div>
    );
  }

  return <AdminContent />;
};

/* ────────────────────────────────────────────────────────
   ADMIN CONTENT
──────────────────────────────────────────────────────── */
const AdminContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Question>>({
    category_id: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: '',
    explanation: '',
    source_reference: '',
    source_type: 'official',
    difficulty: 'medium',
    is_active: true,
  });
  const [formError, setFormError] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([
        fetchQuestions({ 
          searchTerm, 
          categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
          difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        }),
        fetchCategories()
      ]);
      setQuestions(q);
      setCategories(c);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  }, [searchTerm, categoryFilter, difficultyFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // Form handlers
  const resetForm = () => {
    setFormData({
      category_id: '',
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: '',
      explanation: '',
      source_reference: '',
      source_type: 'official',
      difficulty: 'medium',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
    setFormError('');
  };

  const startEdit = (question: Question) => {
    setFormData({
      category_id: question.category_id,
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      source_reference: question.source_reference || '',
      source_type: question.source_type || 'official',
      difficulty: question.difficulty,
      is_active: question.is_active,
    });
    setEditingId(question.id);
    setShowForm(true);
    setFormError('');
  };

  const validateForm = (): boolean => {
    if (!formData.category_id) { setFormError('Category is required'); return false; }
    if (!formData.question_text?.trim()) { setFormError('Question text is required'); return false; }
    if (!formData.option_a?.trim()) { setFormError('Option A is required'); return false; }
    if (!formData.option_b?.trim()) { setFormError('Option B is required'); return false; }
    if (!formData.option_c?.trim()) { setFormError('Option C is required'); return false; }
    if (!formData.option_d?.trim()) { setFormError('Option D is required'); return false; }
    if (!formData.correct_answer) { setFormError('Correct answer is required'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (editingId) {
        await updateQuestion(editingId, formData);
      } else {
        await createQuestion(formData);
      }
      resetForm();
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save question');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this question? This action cannot be undone.')) return;
    try {
      await deleteQuestion(id);
      loadData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Stats
  const activeQuestions = questions.filter(q => q.is_active).length;
  const unverifiedQuestions = questions.filter(q => !q.last_verified_at && q.is_active).length;

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin Console</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Manage questions and categories
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
                {activeQuestions} active questions
              </span>
              {unverifiedQuestions > 0 && (
                <span className="px-2 py-1 rounded-lg bg-yellow-900/30 border border-yellow-800/50 text-yellow-400">
                  {unverifiedQuestions} unverified
                </span>
              )}
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2">
          {[
            { id: 'questions' as Tab, label: 'Questions' },
            { id: 'categories' as Tab, label: 'Categories' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Questions Tab ── */}
        {activeTab === 'questions' && (
          <>
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Form Modal */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold">
                        {editingId ? 'Edit Question' : 'Add New Question'}
                      </h2>
                      <button onClick={resetForm} className="p-1 hover:bg-zinc-800 rounded-lg">
                        <X className="w-5 h-5 text-zinc-500" />
                      </button>
                    </div>

                    {formError && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        {formError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Category */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Category *</label>
                        <select
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Difficulty */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Difficulty</label>
                        <select
                          value={formData.difficulty}
                          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      {/* Question Text */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Question *</label>
                        <textarea
                          value={formData.question_text}
                          onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                          rows={3}
                          placeholder="Enter question text..."
                          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm resize-none"
                        />
                      </div>

                      {/* Options */}
                      {(['A', 'B', 'C', 'D'] as const).map(letter => (
                        <div key={letter}>
                          <label className="block text-xs font-semibold text-zinc-500 mb-1">
                            Option {letter} *
                          </label>
                          <input
                            value={formData[`option_${letter.toLowerCase()}` as keyof Question] as string || ''}
                            onChange={(e) => setFormData({ ...formData, [`option_${letter.toLowerCase()}`]: e.target.value })}
                            placeholder={`Option ${letter}`}
                            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"
                          />
                        </div>
                      ))}

                      {/* Correct Answer */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Correct Answer *</label>
                        <select
                          value={formData.correct_answer}
                          onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"
                        >
                          <option value="">Select</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>

                      {/* Source Reference */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Source Reference</label>
                        <input
                          value={formData.source_reference}
                          onChange={(e) => setFormData({ ...formData, source_reference: e.target.value })}
                          placeholder="e.g., RA 6713, Art. XI 1987 Constitution"
                          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"
                        />
                      </div>

                        {/* Source Type */}
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 mb-1">Source Type</label>
                          <select
                            value={formData.source_type || 'official'}
                            onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"
                          >
                            <option value="official">Official</option>
                            <option value="law">Law</option>
                            <option value="manual">Manual</option>
                            <option value="memo">Memo</option>
                            <option value="reviewer">Reviewer</option>
                          </select>
                        </div>
                      {/* Explanation */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Explanation</label>
                        <textarea
                          value={formData.explanation}
                          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                          rows={2}
                          placeholder="Explain why this is the correct answer..."
                          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm resize-none"
                        />
                      </div>

                      {/* Active Toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                          className={`p-2 rounded-lg border transition-colors ${
                            formData.is_active 
                              ? 'bg-green-900/30 border-green-800 text-green-400' 
                              : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                          }`}
                        >
                          {formData.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <span className="text-sm text-zinc-500">
                          {formData.is_active ? 'Active (visible)' : 'Hidden (inactive)'}
                        </span>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={resetForm}
                        className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {editingId ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Questions Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:flex items-center gap-3 px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <span className="flex-1 min-w-[200px]">Question</span>
                <span className="w-32">Category</span>
                <span className="w-20 text-center">Answer</span>
                <span className="w-24 text-center">Difficulty</span>
                <span className="w-20 text-center">Status</span>
                <span className="w-24 text-right">Actions</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-zinc-500">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                  Loading...
                </div>
              ) : questions.length === 0 ? (
                <div className="py-16 text-center">
                  <BookOpen className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 font-semibold">No questions found</p>
                  <p className="text-zinc-600 text-sm mt-1">Add your first question to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className={`flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors ${
                        !q.is_active ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Question Text */}
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm line-clamp-2">{q.question_text}</p>
                        {q.source_reference && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-yellow-900/20 border border-yellow-800/30 text-[10px] text-yellow-400">
                            📎 {q.source_reference}
                          </span>
                        )}
                      </div>

                      {/* Category */}
                      <span className="text-xs text-zinc-500 md:w-32">
                        {q.categories?.name || '—'}
                      </span>

                      {/* Answer */}
                      <span className="inline-flex items-center gap-1 md:w-20 md:justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-sm font-bold text-green-400">{q.correct_answer}</span>
                      </span>

                      {/* Difficulty */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold md:w-24 text-center ${
                        q.difficulty === 'easy' 
                          ? 'bg-green-900/30 text-green-400' 
                          : q.difficulty === 'medium'
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {q.difficulty}
                      </span>

                      {/* Verification Status */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold md:w-20 text-center ${
                        q.last_verified_at
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {q.last_verified_at ? '✓ Verified' : 'Pending'}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 md:w-24 md:justify-end">
                        <button
                          onClick={() => startEdit(q)}
                          className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Categories Tab ── */}
        {activeTab === 'categories' && (
          <CategoryManager categories={categories} onUpdate={loadData} />
        )}
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   CATEGORY MANAGER
──────────────────────────────────────────────────────── */
const CategoryManager: React.FC<{ 
  categories: Category[]; 
  onUpdate: () => void;
}> = ({ categories, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' });

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    try {
      if (editingId) {
        await updateCategory(editingId, formData);
      } else {
        await createCategory(formData);
      }
      resetForm();
      onUpdate();
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category? All questions in it will also be deleted.')) return;
    try {
      await deleteCategory(id);
      onUpdate();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold"
      >
        <Plus className="w-4 h-4" /> Add Category
      </button>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 space-y-3"
          >
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Category name"
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"
            />
            <input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={resetForm} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold">
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{cat.name}</h3>
                {cat.description && <p className="text-xs text-zinc-500 mt-1">{cat.description}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingId(cat.id); setFormData({ name: cat.name, description: cat.description || '', icon: cat.icon || '' }); setShowForm(true); }} className="p-1 hover:bg-zinc-700 rounded">
                  <Edit className="w-3.5 h-3.5 text-blue-400" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-1 hover:bg-zinc-700 rounded">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;