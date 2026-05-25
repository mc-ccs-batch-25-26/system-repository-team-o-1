import { useState } from 'react';
import { supabase } from './supabase/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

/* ─── design tokens ──────────────────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

/* ─── feature list ───────────────────────────────────────────────────────── */
const FEATURES = [
    'Adaptive quizzes tailored to your weak areas',
    'AI-powered explanations for every question',
    'Real-time progress tracking and analytics',
];

/* ─── input component ────────────────────────────────────────────────────── */
const Field = ({
    type, placeholder, value, onChange, icon, error, right,
}: {
    type: string; placeholder: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon: React.ReactNode; error?: string; right?: React.ReactNode;
}) => (
    <div className="space-y-1.5">
        <div className={`relative flex items-center rounded-xl border bg-white/5 transition-all duration-200 ${error ? 'border-rose-400/60' : 'border-white/10 focus-within:border-blue-400/60 focus-within:bg-white/8'}`}>
            <span className="pl-4 text-white/30">{icon}</span>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="flex-1 py-3 px-3 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
            />
            {right && <span className="pr-3">{right}</span>}
        </div>
        {error && <p className="text-xs text-rose-300 pl-1">{error}</p>}
    </div>
);

/* ══════════════════════════════════════════════════════════════════════════ */
const Login = () => {
    const navigate = useNavigate();
    const [authing,            setAuthing]            = useState(false);
    const [email,              setEmail]              = useState('');
    const [password,           setPassword]           = useState('');
    const [showPassword,       setShowPassword]       = useState(false);
    const [error,              setError]              = useState('');
    const [resetEmailSent,     setResetEmailSent]     = useState(false);
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

    const signInWithEmail = async () => {
        setAuthing(true);
        setError('');
        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;
            if (data.user) navigate('/');
        } catch (err: any) {
            setError(err.message || 'Invalid email or password.');
        } finally {
            setAuthing(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) { setError('Please enter your email address.'); return; }
        setAuthing(true);
        setError('');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            if (error) throw error;
            setResetEmailSent(true);
            setForgotPasswordMode(false);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email. Try again.');
        } finally {
            setAuthing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') forgotPasswordMode ? handleForgotPassword() : signInWithEmail();
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-[#0a0a0f] relative">

            {/* ── ambient glow ──────────────────────────────────────────── */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 blur-[120px]" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[100px]" />
            </div>

            {/* ── subtle grid ───────────────────────────────────────────── */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '60px 60px' }}
            />

            <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-16 px-6 py-12">

                {/* ── Left: Brand ───────────────────────────────────────── */}
                <motion.div
                    initial="hidden" animate="show" variants={stagger}
                    className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left"
                >
                    {/* logo */}
                    <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <img src="/System Logo.png" alt="CiviQuest" className="w-13 h-13 object-contain" />
                        </div>
                        <span className="text-4xl font-bold text-white tracking-tight">CiviQuest</span>
                    </motion.div>

                    <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
                        Pass the Civil<br />Service Exam.
                    </motion.h1>

                    <motion.p variants={fadeUp} className="text-base text-white/50 max-w-sm mb-10">
                        Your personalised AI-powered review companion — built for Filipino civil servants.
                    </motion.p>

                    <motion.ul variants={stagger} className="space-y-3.5">
                        {FEATURES.map((f, i) => (
                            <motion.li key={i} variants={fadeUp} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                                </div>
                                <span className="text-sm text-white/60">{f}</span>
                            </motion.li>
                        ))}
                    </motion.ul>
                </motion.div>

                {/* ── Right: Form ───────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                    className="w-full lg:w-[420px] shrink-0"
                >
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl p-8 space-y-6">

                        {/* header */}
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {forgotPasswordMode ? 'Reset Password' : 'Welcome back'}
                            </h2>
                            <p className="text-sm text-white/40 mt-1">
                                {forgotPasswordMode
                                    ? 'Enter your email to receive a reset link.'
                                    : 'Sign in to continue your review session.'}
                            </p>
                        </div>

                        {/* reset success banner */}
                        <AnimatePresence>
                            {resetEmailSent && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-start gap-2.5"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-emerald-300">Reset link sent! Check your inbox.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* fields */}
                        <div className="space-y-3" onKeyDown={handleKeyDown}>
                            <Field
                                type="email" placeholder="Email address" value={email}
                                onChange={e => setEmail(e.target.value)}
                                icon={<Mail className="w-4 h-4" />}
                            />
                            {!forgotPasswordMode && (
                                <Field
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password" value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    icon={<Lock className="w-4 h-4" />}
                                    right={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(s => !s)}
                                            className="text-white/30 hover:text-white/60 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                            )}
                        </div>

                        {/* remember / forgot */}
                        {!forgotPasswordMode && (
                            <div className="flex items-center justify-between text-xs">
                                <label className="flex items-center gap-2 text-white/40 cursor-pointer select-none">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-blue-500" />
                                    Remember me
                                </label>
                                <button
                                    onClick={() => { setForgotPasswordMode(true); setError(''); }}
                                    className="text-white/40 hover:text-white transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* error */}
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="text-xs text-rose-300 text-center"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* primary CTA */}
                        {forgotPasswordMode ? (
                            <button
                                onClick={handleForgotPassword}
                                disabled={authing}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white transition-all duration-200 shadow-lg shadow-blue-900/30 disabled:opacity-60"
                            >
                                {authing ? 'Sending…' : 'Send Reset Link'}
                                {!authing && <ArrowRight className="w-4 h-4" />}
                            </button>
                        ) : (
                            <button
                                onClick={signInWithEmail}
                                disabled={authing}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white transition-all duration-200 shadow-lg shadow-blue-900/30 disabled:opacity-60"
                            >
                                {authing ? 'Signing in…' : 'Sign In'}
                                {!authing && <ArrowRight className="w-4 h-4" />}
                            </button>
                        )}

                        {/* back to login */}
                        {forgotPasswordMode && (
                            <button
                                onClick={() => { setForgotPasswordMode(false); setError(''); }}
                                className="w-full py-3 rounded-xl text-sm font-medium border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200"
                            >
                                Back to Sign In
                            </button>
                        )}

                        {/* divider */}
                        <div className="relative flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/8" />
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20">New here?</p>
                            <div className="flex-1 h-px bg-white/8" />
                        </div>

                        {/* sign up link */}
                        <Link
                            to="/signup"
                            className="w-full flex items-center justify-center py-3 rounded-xl text-sm font-semibold border border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all duration-200"
                        >
                            Create an account
                        </Link>

                        {/* terms */}
                        <p className="text-[10px] text-white/20 text-center leading-relaxed">
                            By continuing, you agree to our{' '}
                            <Link to="/terms-of-service" className="text-white/40 hover:text-white transition-colors">Terms of Service</Link>
                            {' '}and{' '}
                            <Link to="/privacy-policy" className="text-white/40 hover:text-white transition-colors">Privacy Policy</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;   