import { useState, useEffect } from 'react';
import {
    ArrowLeft, BookMarked, RefreshCw, Lightbulb, AlertCircle,
    CheckCircle2, XCircle, ChevronDown, ChevronLeft, ChevronRight, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMistakes, SavedMistake, CATEGORIES } from '../../data/mockQuestions';

/* ─── design tokens ──────────────────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] } },
};

const PAGE_SIZE = 5; // ← mistakes visible per page

/* ─── category palette ───────────────────────────────────────────────────── */
const CAT_PILL: Record<string, string> = {
    'Verbal Ability':      'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400',
    'Numerical Ability':   'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    'Analytical Ability':  'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    'General Information': 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
};
const defaultPill = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500';

interface MistakeNotebookProps {
    isDarkMode: boolean;
    onBack: () => void;
}

/* ══════════════════════════════════════════════════════════════════════════ */
const MistakeNotebook = ({ isDarkMode, onBack }: MistakeNotebookProps) => {
    const [mistakes,        setMistakes]        = useState<SavedMistake[]>([]);
    const [loading,         setLoading]         = useState(true);
    const [filterCategory,  setFilterCategory]  = useState<string>('All');
    const [expandedId,      setExpandedId]      = useState<string | null>(null);
    const [aiExplanations,  setAiExplanations]  = useState<Record<string, string>>({});
    const [loadingAI,       setLoadingAI]       = useState<string | null>(null);
    const [page,            setPage]            = useState(0);

    /* retry state */
    const [retryMode,     setRetryMode]     = useState(false);
    const [retryIndex,    setRetryIndex]    = useState(0);
    const [retryAnswers,  setRetryAnswers]  = useState<Record<string, string>>({});
    const [retryScore,    setRetryScore]    = useState(0);
    const [retryFinished, setRetryFinished] = useState(false);

    useEffect(() => { fetchMistakes(); }, []);

    /* reset page on filter change */
    useEffect(() => { setPage(0); setExpandedId(null); }, [filterCategory]);

    const fetchMistakes = () => {
        setLoading(true);
        setMistakes(getMistakes());
        setLoading(false);
    };

    const getAIExplanation = async (mistake: SavedMistake) => {
        if (aiExplanations[mistake.id]) return;
        setLoadingAI(mistake.id);
        try {
            const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': window.location.origin, 'X-Title': 'CiviQuest' },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
                    messages: [
                        { role: 'system', content: 'You are a Civil Service Exam tutor. Explain in 2-3 sentences why the answer is correct and why the user\'s choice was wrong. Be concise and helpful.' },
                        { role: 'user', content: `Question: ${mistake.question_text}\nOptions: ${mistake.options.join(', ')}\nCorrect answer: ${mistake.correct_answer}\nMy wrong answer: ${mistake.selected_answer}\nPlease explain.` },
                    ],
                }),
            });
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || `The correct answer is "${mistake.correct_answer}".`;
            setAiExplanations(prev => ({ ...prev, [mistake.id]: text }));
        } catch {
            setAiExplanations(prev => ({ ...prev, [mistake.id]: `The correct answer is "${mistake.correct_answer}". Review this topic to improve.` }));
        } finally {
            setLoadingAI(null);
        }
    };

    /* ── derived ─────────────────────────────────────────────────────────── */
    const filteredMistakes = filterCategory === 'All' ? mistakes : mistakes.filter(m => m.category_name === filterCategory);
    const totalPages       = Math.ceil(filteredMistakes.length / PAGE_SIZE);
    const pageMistakes     = filteredMistakes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const categoryCounts: Record<string, number> = {};
    mistakes.forEach(m => { categoryCounts[m.category_name] = (categoryCounts[m.category_name] || 0) + 1; });

    /* ── retry ───────────────────────────────────────────────────────────── */
    const startRetry = () => {
        if (!filteredMistakes.length) return;
        setRetryMode(true);
        setRetryIndex(0);
        setRetryAnswers({});
        setRetryScore(0);
        setRetryFinished(false);
    };

    const handleRetryAnswer = (questionId: string, selected: string) => {
        if (retryAnswers[questionId]) return;
        const isCorrect = selected === filteredMistakes[retryIndex].correct_answer;
        setRetryAnswers(prev => ({ ...prev, [questionId]: selected }));
        if (isCorrect) setRetryScore(s => s + 1);
    };

    const nextRetryQuestion = () => {
        if (retryIndex < filteredMistakes.length - 1) setRetryIndex(i => i + 1);
        else setRetryFinished(true);
    };

    /* ════════════════════════════════════════════════════════════════════ */
    /* RETRY FINISHED                                                       */
    /* ════════════════════════════════════════════════════════════════════ */
    if (retryMode && retryFinished) {
        const pct = Math.round((retryScore / filteredMistakes.length) * 100);
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <div className="w-full max-w-md mx-auto px-4 py-10 space-y-5">
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Retry Complete!</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Here's how you improved</p>
                    </motion.div>

                    <motion.div initial="hidden" animate="show" variants={fadeUp}
                        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-7 text-center"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Retry Score</p>
                        <div className="text-6xl font-bold tabular-nums text-emerald-500">{retryScore}
                            <span className="text-2xl font-normal text-zinc-400">/{filteredMistakes.length}</span>
                        </div>
                        <div className="mt-5 w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <motion.div className="h-full rounded-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">{pct}% accuracy on your past mistakes</p>
                    </motion.div>

                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex gap-3">
                        <button onClick={() => setRetryMode(false)} className="flex-1 py-3.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white transition-all duration-200">
                            Back to Notebook
                        </button>
                        <button onClick={onBack} className="flex-1 py-3.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200">
                            Back to Hub
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════════════ */
    /* RETRY IN PROGRESS                                                    */
    /* ════════════════════════════════════════════════════════════════════ */
    if (retryMode) {
        const current  = filteredMistakes[retryIndex];
        const answered = retryAnswers[current.question_id] !== undefined;

        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

                    <div className="flex items-center justify-between">
                        <button onClick={() => setRetryMode(false)} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Exit Retry
                        </button>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                            Retry Mode
                        </span>
                    </div>

                    {/* progress */}
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm px-5 py-4 space-y-2.5">
                        <div className="flex justify-between text-xs font-medium text-zinc-400 dark:text-zinc-500">
                            <span>Question <span className="font-bold text-zinc-700 dark:text-zinc-200">{retryIndex + 1}</span> of {filteredMistakes.length}</span>
                            <span>{retryScore} correct so far</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <motion.div animate={{ width: `${((retryIndex + 1) / filteredMistakes.length) * 100}%` }} transition={{ duration: 0.3 }} className="h-full rounded-full bg-emerald-500" />
                        </div>
                    </div>

                    {/* question card */}
                    <AnimatePresence mode="wait">
                        <motion.div key={current.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}
                            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6"
                        >
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${CAT_PILL[current.category_name] ?? defaultPill}`}>
                                {current.category_name}
                            </span>
                            <p className="text-base font-semibold text-zinc-900 dark:text-white mt-4 mb-6 leading-relaxed">
                                {retryIndex + 1}. {current.question_text}
                            </p>

                            <div className="space-y-2.5">
                                {current.options.map(option => {
                                    const isSelected = retryAnswers[current.question_id] === option;
                                    const isCorrect  = option === current.correct_answer;
                                    return (
                                        <button key={option} onClick={() => handleRetryAnswer(current.question_id, option)} disabled={answered}
                                            className={`w-full text-left px-5 py-3.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                                                answered && isCorrect  ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                                : answered && isSelected && !isCorrect ? 'border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                                                : isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span>{option}</span>
                                                {answered && isCorrect  && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                                {answered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <AnimatePresence>
                        {answered && (
                            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                onClick={nextRetryQuestion}
                                className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white transition-all duration-200"
                            >
                                {retryIndex < filteredMistakes.length - 1 ? 'Next Question' : 'Finish Retry'}
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════════════ */
    /* MAIN NOTEBOOK — paginated                                            */
    /* ════════════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

                {/* back */}
                <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Quiz Hub
                </button>

                {/* header */}
                <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <BookMarked className="w-5 h-5 text-emerald-500" />
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Mistake Notebook</h1>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Review and retry your past wrong answers.</p>
                    </div>
                    {filteredMistakes.length > 0 && (
                        <button onClick={startRetry} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white transition-all duration-200 shadow-sm shrink-0">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry All ({filteredMistakes.length})
                        </button>
                    )}
                </motion.div>

                {/* category filter chips */}
                <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-wrap gap-2">
                    {['All', ...CATEGORIES].map(cat => {
                        const count = cat === 'All' ? mistakes.length : (categoryCounts[cat] || 0);
                        const active = filterCategory === cat;
                        return (
                            <button key={cat} onClick={() => setFilterCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                                    active
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                            >
                                {cat}
                                <span className={`ml-1.5 tabular-nums ${active ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500'}`}>({count})</span>
                            </button>
                        );
                    })}
                </motion.div>

                {/* loading */}
                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-emerald-500 animate-spin" />
                    </div>
                )}

                {/* empty */}
                {!loading && filteredMistakes.length === 0 && (
                    <motion.div initial="hidden" animate="show" variants={fadeUp}
                        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-12 flex flex-col items-center text-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-4">
                            <AlertCircle className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No mistakes yet!</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
                            {filterCategory === 'All'
                                ? 'Take some quizzes — any wrong answers will appear here for review.'
                                : `No wrong answers in ${filterCategory}. Try another category.`
                            }
                        </p>
                    </motion.div>
                )}

                {/* mistake list — paginated */}
                {!loading && pageMistakes.length > 0 && (
                    <div className="space-y-2.5">
                        {pageMistakes.map((mistake, index) => {
                            const isExpanded = expandedId === mistake.id;
                            const catPill    = CAT_PILL[mistake.category_name] ?? defaultPill;

                            return (
                                <motion.div
                                    key={mistake.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden"
                                >
                                    {/* collapsed row */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : mistake.id)}
                                        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors duration-200"
                                    >
                                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 text-left">
                                                {mistake.question_text}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catPill}`}>{mistake.category_name}</span>
                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                    {new Date(mistake.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 mt-0.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* expanded detail */}
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                key="expanded"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">

                                                    {/* answer comparison */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
                                                            <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Your answer</p>
                                                                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{mistake.selected_answer}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Correct answer</p>
                                                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{mistake.correct_answer}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* AI explanation */}
                                                    {aiExplanations[mistake.id] ? (
                                                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700">
                                                            <div className="flex items-center gap-1.5 mb-2">
                                                                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">AI Explanation</p>
                                                            </div>
                                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{aiExplanations[mistake.id]}</p>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => getAIExplanation(mistake)}
                                                            disabled={loadingAI === mistake.id}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 disabled:opacity-60"
                                                        >
                                                            {loadingAI === mistake.id ? (
                                                                <><div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 border-t-blue-500 animate-spin" /> Generating…</>
                                                            ) : (
                                                                <><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Get AI Explanation</>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* pagination */}
                {!loading && totalPages > 1 && (
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex items-center justify-between">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredMistakes.length)} of {filteredMistakes.length}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => { setPage(p => Math.max(0, p - 1)); setExpandedId(null); }}
                                disabled={page === 0}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* page dots */}
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setPage(i); setExpandedId(null); }}
                                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        i === page
                                            ? 'bg-emerald-600 text-white'
                                            : 'border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setExpandedId(null); }}
                                disabled={page === totalPages - 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MistakeNotebook;