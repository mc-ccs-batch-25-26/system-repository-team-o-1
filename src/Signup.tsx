import { useState } from 'react';
import { supabase } from './supabase/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { sendVerificationOTP } from './firebase/emailVerificationService';
import OTPVerification from './components/OTPVerification';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

/* ─── design tokens ──────────────────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const FEATURES = [
    'Adaptive quizzes tailored to your weak areas',
    'AI-powered explanations for every question',
    'Real-time progress tracking and analytics',
];

/* ─── password strength ──────────────────────────────────────────────────── */
const getStrength = (pw: string): { level: number; label: string; color: string } => {
    if (!pw) return { level: 0, label: '', color: '' };
    if (pw.length < 6) return { level: 1, label: 'Too short', color: 'bg-rose-500' };
    if (pw.length < 8)  return { level: 2, label: 'Weak',     color: 'bg-amber-500' };
    if (/[A-Z]/.test(pw) && /\d/.test(pw)) return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
    return { level: 3, label: 'Fair', color: 'bg-amber-400' };
};

/* ─── input component ────────────────────────────────────────────────────── */
const Field = ({
    type, placeholder, value, onChange, icon, error, right,
}: {
    type: string; placeholder: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon: React.ReactNode; error?: string; right?: React.ReactNode;
}) => (
    <div className="space-y-1.5">
        <div className={`relative flex items-center rounded-xl border bg-white/5 transition-all duration-200 ${error ? 'border-rose-400/60' : 'border-white/10 focus-within:border-blue-400/60'}`}>
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
const Signup = () => {
    const navigate = useNavigate();
    const [authing,           setAuthing]           = useState(false);
    const [email,             setEmail]             = useState('');
    const [password,          setPassword]          = useState('');
    const [confirmPassword,   setConfirmPassword]   = useState('');
    const [showPassword,      setShowPassword]      = useState(false);
    const [showConfirm,       setShowConfirm]       = useState(false);
    const [error,             setError]             = useState('');
    const [emailError,        setEmailError]        = useState('');
    const [showVerification,  setShowVerification]  = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');

    const strength = getStrength(password);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setEmail(v);
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        setEmailError(v && !valid ? 'Please enter a valid email address.' : '');
    };

    const signUpWithEmail = async () => {
        setError('');
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!valid)                        { setEmailError('Please enter a valid email address.'); return; }
        if (password !== confirmPassword)  { setError('Passwords do not match.'); return; }
        if (password.length < 6)           { setError('Password must be at least 6 characters.'); return; }

        setAuthing(true);
        try {
            const sent = await sendVerificationOTP(email);
            if (sent) {
                setVerificationEmail(email);
                setShowVerification(true);
            } else {
                setError('Failed to send verification code. Please try again.');
            }
        } catch {
            setError('Failed to send verification code. Please try again.');
        } finally {
            setAuthing(false);
        }
    };

    const handleVerificationSuccess = async () => {
        setAuthing(true);
        setError('');
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            if (data.user) navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setAuthing(false);
            setShowVerification(false);
        }
    };

    const handleVerificationCancel = () => {
        setShowVerification(false);
        setAuthing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') signUpWithEmail();
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
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <img src="/system logo.png" alt="CiviQuest" className="w-7 h-7 object-contain" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">CiviQuest</span>
                    </motion.div>

                    <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
                        Start your CSE<br />journey today.
                    </motion.h1>

                    <motion.p variants={fadeUp} className="text-base text-white/50 max-w-sm mb-10">
                        Join thousands of Filipinos preparing smarter for the Civil Service Examination.
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

                    {/* trust badge */}
                    <motion.div variants={fadeUp} className="mt-10 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/8 bg-white/[0.03]">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <p className="text-xs text-white/40">Free to use · No credit card required · OTP verified</p>
                    </motion.div>
                </motion.div>

                {/* ── Right: Form ───────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                    className="w-full lg:w-[420px] shrink-0"
                >
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl p-8 space-y-5">

                        {/* header */}
                        <div>
                            <h2 className="text-2xl font-bold text-white">Create your account</h2>
                            <p className="text-sm text-white/40 mt-1">Sign up to start your Civil Service exam review.</p>
                        </div>

                        {/* fields */}
                        <div className="space-y-3" onKeyDown={handleKeyDown}>
                            <Field
                                type="email" placeholder="Email address" value={email}
                                onChange={handleEmailChange}
                                icon={<Mail className="w-4 h-4" />}
                                error={emailError}
                            />
                            <div className="space-y-2">
                                <Field
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password" value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    icon={<Lock className="w-4 h-4" />}
                                    right={
                                        <button type="button" onClick={() => setShowPassword(s => !s)} className="text-white/30 hover:text-white/60 transition-colors">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                                {/* password strength bar */}
                                {password && (
                                    <div className="space-y-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <motion.div
                                                    key={i}
                                                    className={`flex-1 h-1 rounded-full transition-colors duration-300 ${i <= strength.level ? strength.color : 'bg-white/10'}`}
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-[10px] font-semibold ${strength.level <= 2 ? 'text-rose-400' : strength.level === 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Field
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Confirm password" value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                icon={<Lock className="w-4 h-4" />}
                                error={confirmPassword && confirmPassword !== password ? 'Passwords do not match.' : ''}
                                right={
                                    <button type="button" onClick={() => setShowConfirm(s => !s)} className="text-white/30 hover:text-white/60 transition-colors">
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />
                        </div>

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

                        {/* CTA */}
                        <button
                            onClick={signUpWithEmail}
                            disabled={authing}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white transition-all duration-200 shadow-lg shadow-blue-900/30 disabled:opacity-60"
                        >
                            {authing ? 'Sending verification…' : 'Create Account'}
                            {!authing && <ArrowRight className="w-4 h-4" />}
                        </button>

                        {/* divider */}
                        <div className="relative flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/8" />
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20">Have an account?</p>
                            <div className="flex-1 h-px bg-white/8" />
                        </div>

                        {/* login link */}
                        <Link
                            to="/login"
                            className="w-full flex items-center justify-center py-3 rounded-xl text-sm font-semibold border border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all duration-200"
                        >
                            Sign in instead
                        </Link>

                        {/* terms */}
                        <p className="text-[10px] text-white/20 text-center leading-relaxed">
                            By creating an account, you agree to our{' '}
                            <Link to="/terms-of-service" className="text-white/40 hover:text-white transition-colors">Terms of Service</Link>
                            {' '}and{' '}
                            <Link to="/privacy-policy" className="text-white/40 hover:text-white transition-colors">Privacy Policy</Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* ── OTP verification modal ────────────────────────────────── */}
            {showVerification && (
                <OTPVerification
                    email={verificationEmail}
                    onVerificationSuccess={handleVerificationSuccess}
                    onCancel={handleVerificationCancel}
                />
            )}
        </div>
    );
};

export default Signup;