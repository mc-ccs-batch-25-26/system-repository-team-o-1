import { useState } from 'react'
import { supabase } from './supabase/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();

    // State variables for managing authentication state, email, password, and error messages
    const [authing, setAuthing] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

    // Function to handle sign-in with email and password
   const signInWithEmail = async () => {
    setAuthing(true);
    setError('');

    try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) throw signInError;

        if (data.user) {
            navigate('/');
        }
    } catch (error: any) {
        console.log(error);
        setError(error.message || "Invalid Email or Password");
    } finally {
        setAuthing(false);
    }
};

    // Function to handle password reset
    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setAuthing(true);
        setError('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password', // Ensure you have this route or similar
            });

            if (error) throw error;

            setResetEmailSent(true);
            setForgotPasswordMode(false);
        } catch (error: any) {
            console.error('Error sending password reset email:', error);
            setError(error.message || 'Failed to send password reset email. Please try again later.');
        } finally {
            setAuthing(false);
        }
    };

    return (
        <div className='w-full min-h-screen flex overflow-hidden bg-gradient-to-br from-gray-900 to-black'>
            {/* Decorative elements - adjusted for better mobile display */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-green-300 blur-xl"></div>
                <div className="absolute bottom-20 right-10 sm:bottom-40 sm:right-20 w-32 h-32 sm:w-60 sm:h-60 rounded-full bg-green-500 blur-xl"></div>
                <div className="absolute bottom-10 left-20 sm:bottom-20 sm:left-40 w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-green-200 blur-xl"></div>
                <div className="absolute top-1/3 right-1/4 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-green-400 blur-xl"></div>
            </div>

            {/* Content container - improved padding for mobile */}
            <div className='w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center p-4 sm:p-6 py-8 sm:py-12 z-10'>
                {/* Left side - Brand Panel - adjusted for mobile */}
                <div className='w-full md:w-1/2 mb-8 md:mb-0 flex flex-col items-center justify-center text-center md:text-left md:pr-4 lg:pr-10'>
                    {/* Logo and tagline - responsive sizing */}
                    <div className="flex flex-col items-center md:items-start">
                        <img src="/system logo.png" alt="CiviQuest Logo" className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mt-4 sm:mt-6 mb-2 sm:mb-3">CiviQuest</h1>
                        <p className="text-gray-300 text-base sm:text-lg max-w-md px-4 md:px-0">Your ultimate companion for Civil Service Examinations preparation</p>
                    </div>

                    {/* Feature highlights - better padding for mobile */}
                    <div className="mt-6 sm:mt-10 grid grid-cols-1 gap-3 sm:gap-4 w-full max-w-md px-4 md:px-0">
                        <div className="flex items-center space-x-3 text-white/90">
                            <div className="bg-white/10 p-2 rounded-full flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-sm sm:text-base">Comprehensive study materials</span>
                        </div>
                        <div className="flex items-center space-x-3 text-white/90">
                            <div className="bg-white/10 p-2 rounded-full flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-sm sm:text-base">Practice exams with detailed solutions</span>
                        </div>
                        <div className="flex items-center space-x-3 text-white/90">
                            <div className="bg-white/10 p-2 rounded-full flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-sm sm:text-base">Performance tracking and analytics</span>
                        </div>
                    </div>
                </div>

                {/* Right side - Login Form - better sizing and spacing for mobile */}
                <div className='w-full md:w-1/2 flex flex-col items-center px-4 sm:px-6 md:px-4'>
                    <div className='w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl p-5 sm:p-6 md:p-8 shadow-xl border border-white/20'>
                        {/* Header section - adjusted text sizes */}
                        <div className='w-full flex flex-col mb-6 sm:mb-8'>
                            <h3 className='text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-white'>
                                {forgotPasswordMode ? 'Reset Password' : 'Welcome Back'}
                            </h3>
                            <p className='text-sm sm:text-base text-gray-300'>
                                {forgotPasswordMode
                                    ? 'Enter your email to receive a password reset link'
                                    : 'Login to continue your Civil Service exam preparation'}
                            </p>
                        </div>
                        
                        {resetEmailSent && (
                            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                                <p className="text-green-200 text-sm">
                                    Password reset email sent! Check your inbox and follow the instructions.
                                </p>
                            </div>
                        )}

                        {/* Input fields - better spacing for mobile */}
                        <div className='w-full flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6'>
                            <div className="relative">
                                <input
                                    type='email'
                                    placeholder='Email Address'
                                    className='w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            {!forgotPasswordMode && (
                                <div className="relative">
                                    <input
                                        type='password'
                                        placeholder='Password'
                                        className='w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base'
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Remember me and forgot password - adjusted for mobile */}
                        {!forgotPasswordMode && (
                            <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 text-xs sm:text-sm">
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center text-gray-300 mb-2 sm:mb-0">
                                        <input type="checkbox" className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 bg-white/5 border-white/10 text-blue-500 rounded focus:ring-blue-400" />
                                        Remember me
                                    </label>
                                </div>
                                <button
                                    onClick={() => setForgotPasswordMode(true)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Login or Reset Password button */}
                        {forgotPasswordMode ? (
                            <button
                                className='w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white font-medium rounded-lg py-2.5 sm:py-3 transition-all duration-200 mb-3 sm:mb-4 shadow-lg shadow-green-900/30 text-sm sm:text-base'
                                onClick={handleForgotPassword}
                                disabled={authing}>
                                {authing ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        ) : (
                            <button
                                className='w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg py-2.5 sm:py-3 transition-all duration-200 mb-3 sm:mb-4 shadow-lg shadow-green-900/30 text-sm sm:text-base'
                                onClick={signInWithEmail}
                                disabled={authing}>
                                {authing ? 'Logging in...' : 'Log In'}
                            </button>
                        )}

                        {/* Back to login button when in forgot password mode */}
                        {forgotPasswordMode && (
                            <button
                                className='w-full bg-white/10 border border-white/10 text-white font-medium rounded-lg py-2.5 sm:py-3 transition-all duration-200 hover:bg-white/20 mb-3 sm:mb-4 text-sm sm:text-base'
                                onClick={() => {
                                    setForgotPasswordMode(false);
                                    setError('');
                                }}>
                                Back to Login
                            </button>
                        )}

                        {/* Error message */}
                        {error && <div className='text-red-300 text-xs sm:text-sm mb-3 sm:mb-4 text-center'>{error}</div>}

                        {/* Divider and social login buttons only in regular login mode */}
                        {!forgotPasswordMode && (
                            <>
                              
                            </>
                        )}

                        {/* Sign up link - adjusted spacing and text size */}
                        <div className='w-full flex items-center justify-center mt-6 sm:mt-8'>
                            <p className='text-xs sm:text-sm text-blue-100'>Don't have an account?
                                <a href='/signup' className='font-medium text-blue-300 hover:text-white transition-colors ml-1'>
                                    Create an account
                                </a>
                            </p>
                        </div>

                        {/* Terms of service - adjusted text size */}
                        <p className="text-xs xs:text-xs text-gray-400/70 text-center mt-6 sm:mt-8">
                            By continuing, you agree to our
                            <Link to="/terms-of-service" className="text-gray-400 hover:text-white transition-colors mx-1">Terms of Service</Link>
                            and
                            <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors mx-1">Privacy Policy</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
