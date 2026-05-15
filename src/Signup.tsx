import { useState } from 'react';
import { supabase } from './supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { sendVerificationOTP } from './firebase/emailVerificationService';
import OTPVerification from './components/OTPVerification';

const Signup = () => {
    const navigate = useNavigate();
    const [authing, setAuthing] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [showVerification, setShowVerification] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    
    // Function to handle email input change with validation
   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (!newEmail) {
        setEmailError('');
        return;
    }
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailRegex.test(newEmail)) {
        setEmailError('Please enter a valid email address');
   } else {
        setEmailError('');
    }
    };

    const signUpWithEmail = async () => {
        // Reset errors
        setError('');

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Check password length
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setAuthing(true);

        try {
            // Send verification OTP
            const sent = await sendVerificationOTP(email);

            if (sent) {
                setVerificationEmail(email);
                setShowVerification(true);
                setAuthing(false);
            } else {
                setError("Failed to send verification code. Please try again.");
                setAuthing(false);
            }
        } catch (error) {
            console.error("Error sending verification:", error);
            setError("Failed to send verification code. Please try again.");
            setAuthing(false);
        }
    };

    // Function to handle successful verification
   const handleVerificationSuccess = async () => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        if (data.user) {
            // Profile auto-created by handle_new_user trigger
            navigate('/');
        }
    } catch (error: any) {
        console.error("Error creating user:", error);
        setError(error.message || "Failed to create account. Please try again.");
    } finally {
        setAuthing(false);
        setShowVerification(false);
    }
};

    // Function to cancel verification
    const handleVerificationCancel = () => {
        setShowVerification(false);
        setAuthing(false);
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
                        <img src="/CiviQuest.png" alt="CiviQuest Logo" className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain" />
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


                {/* Right side - Signup Form */}
                <div className='w-full md:w-1/2 flex flex-col items-center'>
                    <div className='w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl p-5 sm:p-6 md:p-8 shadow-xl border border-white/20'>
                        {/* Header section */}
                        <div className='w-full flex flex-col mb-6'>
                            <h3 className='text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-white'>Create Account</h3>
                            <p className='text-sm sm:text-base text-gray-300'>Sign up to start your Civil Service exam preparation</p>
                        </div>


                        {/* Input fields */}
                        <div className='w-full flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6'>
                            <div className="relative">
                                <input
                                    type='email'
                                    placeholder='Email Address'
                                    className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg bg-white/5 border ${emailError ? 'border-red-400' : 'border-white/10'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base`}
                                    value={email}
                                    onChange={handleEmailChange}
                                />
                                {emailError && (
                                    <p className="text-red-300 text-xs mt-1">{emailError}</p> 
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type='password'
                                    placeholder='Password'
                                    className='w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type='password'
                                    placeholder='Confirm Password'
                                    className='w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base'
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {error && <div className='text-red-300 text-xs sm:text-sm mb-3 sm:mb-4 text-center'>{error}</div>}

                        {/* Signup button */}
                        <button
                            className='w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg py-2.5 sm:py-3 transition-all duration-200 mb-3 sm:mb-4 shadow-lg shadow-green-900/30 text-sm sm:text-base'
                            onClick={signUpWithEmail}
                            disabled={authing}>
                            {authing ? 'Creating Account...' : 'Sign Up'}
                        </button>

                        {/* Login link */}
                        <div className='w-full flex items-center justify-center mt-6 sm:mt-8'>
                            <p className='text-xs sm:text-sm text-gray-400'>Already have an account?
                                <a href='/login' className='font-medium text-blue-400 hover:text-white transition-colors ml-1'>
                                    Log in
                                </a>
                            </p>
                        </div>

                        {/* Terms of service */}
                        <p className="text-xs text-gray-400/70 text-center mt-6 sm:mt-8">
                            By continuing, you agree to our
                            <a href="#" className="text-gray-400 hover:text-white transition-colors mx-1">Terms of Service</a>
                            and
                            <a href="#" className="text-gray-400 hover:text-white transition-colors mx-1">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div> {/* This closes the 'Content container' div */}

            {/* OTP Verification Modal */}
            {showVerification && (
                <OTPVerification
                    email={verificationEmail}
                    onVerificationSuccess={handleVerificationSuccess}
                    onCancel={handleVerificationCancel}
                />
            )}
        </div> // This is the closing tag for the main div
    );
}

export default Signup;
