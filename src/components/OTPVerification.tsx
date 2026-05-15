import React, { useState, useEffect, useRef } from 'react';
import { verifyOTP, sendVerificationOTP } from '../firebase/emailVerificationService';
import { IoArrowBack } from 'react-icons/io5';

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onCancel: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ email, onVerificationSuccess, onCancel }) => {
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(60); // 1 minute cooldown for resend
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Handle countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setError('OTP has expired. Please request a new one.');
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCountdown <= 0) {
      setResendDisabled(false);
      return;
    }

    const timer = setInterval(() => {
      setResendCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.slice(0, 1);
    setOtpValues(newOtpValues);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key down for backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        // If current input is empty and backspace is pressed, focus previous input
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = '';
        setOtpValues(newOtpValues);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (!pastedData) return;
    
    const newOtpValues = [...otpValues];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) {
        newOtpValues[i] = pastedData[i];
      }
    }
    
    setOtpValues(newOtpValues);
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtpValues.findIndex(val => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  // Handle OTP verification
  const handleVerify = async () => {
    const otp = otpValues.join('');
    
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await verifyOTP(email, otp);
      
      if (isValid) {
        onVerificationSuccess();
      } else {
        setError('Invalid or expired verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    setLoading(true);
    setError('');

    try {
      const sent = await sendVerificationOTP(email);
      
      if (sent) {
        setCountdown(600); // Reset main countdown
        setResendCountdown(60); // Reset resend cooldown
        setResendDisabled(true);
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-3 z-50">
      <div className="bg-[#1a2235] rounded-xl p-8 shadow-xl border border-[#2a3548] w-full max-w-md">
        <div className="flex items-center mb-6">
          <button 
            onClick={onCancel} 
            className="text-gray-400 hover:text-white mr-4"
          >
            <IoArrowBack size={20} />
          </button>
          <h2 className="text-2xl font-bold text-white">Email Verification</h2>
        </div>
        
        <div className="bg-[#232b3d] rounded-lg p-4 mb-6">
          <p className="text-gray-300">
            We've sent a verification code to <span className="font-medium text-white">{email}</span>
          </p>
        </div>

        <p className="text-gray-300 mb-3 text-sm">Enter verification code</p>
        
        <div className="grid grid-cols-6 gap-2 mb-6">
          {otpValues.map((value, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              className="w-full aspect-square flex items-center justify-center text-center text-xl font-bold rounded-lg bg-[#232b3d] border border-[#3a4257] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              maxLength={1}
              autoFocus={index === 0}
            />
          ))}
        </div>
        
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center text-gray-400 text-sm">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Expires in: <span className="font-medium ml-1">{formatTime(countdown)}</span>
          </div>
          <button
            onClick={handleResend}
            disabled={resendDisabled || loading}
            className={`text-sm ${resendDisabled ? 'text-blue-400/50' : 'text-blue-400 hover:text-blue-300'}`}
          >
            {resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend Code'}
          </button>
        </div>

        <button
          onClick={handleVerify}
          className="w-full bg-[#3b5998] hover:bg-[#4a69a9] text-white font-medium rounded-lg py-3 transition-all duration-200"
          disabled={loading || otpValues.some(v => !v)}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;