import emailjs from '@emailjs/browser';
import { supabase } from '../supabase/supabaseClient';

// Table for storing verification codes
const VERIFICATION_TABLE = 'verification_codes';

// Generate a random 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP to Supabase
export const saveOTP = async (email: string, otp: string): Promise<boolean> => {
  try {
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error } = await supabase
      .from(VERIFICATION_TABLE)
      .upsert({
        email,
        otp,
        expires_at: expiresAt.toISOString(),
        verified: false,
        created_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error saving OTP:", error);
    return false;
  }
};

// Verify OTP from Supabase
export const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(VERIFICATION_TABLE)
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return false;
    }

    const expiresAt = new Date(data.expires_at);

    // Check if OTP is expired
    if (expiresAt < new Date()) {
      return false;
    }

    // Check if OTP matches
    if (data.otp !== otp) {
      return false;
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from(VERIFICATION_TABLE)
      .update({ verified: true })
      .eq('email', email);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return false;
  }
};

// Check if email is verified
export const isEmailVerified = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(VERIFICATION_TABLE)
      .select('verified')
      .eq('email', email)
      .single();

    if (error || !data) {
      return false;
    }

    return data.verified === true;
  } catch (error) {
    console.error("Error checking verification status:", error);
    return false;
  }
};

// Send OTP via EmailJS
export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  try {
    // EmailJS credentials from environment variables
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_3qa7tlr';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_3tnri28';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'K4C-nLtN5dCwn9p1Y';

    // Make sure email is not empty
    if (!email || email.trim() === '') {
      console.error("Email address is empty");
      return false;
    }

    // Make sure OTP is not empty
    if (!otp || otp.trim() === '') {
      console.error("OTP is empty");
      return false;
    }

    console.log(`Preparing to send OTP ${otp} to ${email}`);

    // Calculate expiration time (15 minutes from now)
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 15);
    const formattedTime = expirationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Prepare template parameters based on the template format
    const templateParams = {
      to_email: email,
      recipient: email,  // Add this line - common parameter name for EmailJS
      email: email,      // Add this line - another common parameter name
      to_name: email.split('@')[0],
      passcode: otp,
      time: formattedTime,
      year: new Date().getFullYear().toString()
    };

    console.log('Sending email with EmailJS...');

    // Send email
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    console.log('Email sent successfully:', response.status, response.text);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Check for specific EmailJS errors
    if (error && typeof error === 'object' && 'text' in error) {
      console.error("EmailJS error details:", (error as any).text);
    }

    return false;
  }
};

// Combined function to generate, save, fetch and send OTP
export const sendVerificationOTP = async (email: string): Promise<boolean> => {
  try {
    // Generate OTP
    const otp = generateOTP();
    console.log(`Generated OTP for ${email}: ${otp}`);

    // Save OTP to Supabase
    const saved = await saveOTP(email, otp);

    if (!saved) {
      console.error("Failed to save OTP to Supabase");
      return false;
    }

    console.log(`OTP saved to Supabase for ${email}`);

    // Send the OTP via EmailJS
    const sent = await sendOTPEmail(email, otp);

    if (!sent) {
      console.error("Failed to send OTP email");
      return false;
    }

    console.log(`OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error in verification process:", error);
    return false;
  }
};

// Fetch verification code for a specific email
export const fetchVerificationCode = async (email: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from(VERIFICATION_TABLE)
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      console.error("No verification code found for this email");
      return null;
    }

    const expiresAt = new Date(data.expires_at);

    // Check if OTP is expired
    if (expiresAt < new Date()) {
      console.error("Verification code has expired");
      return null;
    }

    return data.otp;
  } catch (error) {
    console.error("Error fetching verification code:", error);
    return null;
  }
};

// Fetch verification code and send it to the user's email
export const fetchAndSendVerificationCode = async (email: string): Promise<boolean> => {
  try {
    // Fetch the verification code
    const otp = await fetchVerificationCode(email);

    if (!otp) {
      console.error("Failed to fetch verification code");
      return false;
    }

    // Send the verification code via email
    return await sendOTPEmail(email, otp);
  } catch (error) {
    console.error("Error in fetch and send process:", error);
    return false;
  }
};
