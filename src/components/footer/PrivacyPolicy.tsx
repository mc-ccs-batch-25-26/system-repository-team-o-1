import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaHome, FaUser, FaCog } from 'react-icons/fa';
import Footer from './Footer';

const PrivacyPolicy: React.FC = () => {
  // Initialize isDarkMode from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; 
  });
  
  // Apply theme to document body whenever isDarkMode changes
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-bg' : 'light-bg';
  }, [isDarkMode]);
  
  // Check for theme changes in localStorage
  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    };
    
    // Check initially
    checkTheme();
    
    // Set up event listener for storage changes
    window.addEventListener('storage', checkTheme);
    
    return () => {
      window.removeEventListener('storage', checkTheme);
    };
  }, []);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark-bg dark-text' : 'light-bg light-text'} transition-colors duration-300`}>
      {/* Navbar */}
      <nav className={`${isDarkMode ? 'dark-nav-bg dark-border' : 'light-nav-bg light-border'} h-20 p-4 sticky top-0 z-50 transition-colors duration-300`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <FaGraduationCap className={`w-10 h-10 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mr-3`} />
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'dark-brand-text' : 'light-brand-text'}`}>CiviQuest</h1>
          </div>
          
          <div className="space-x-6 hidden md:flex items-center text-lg">
            <Link to="/" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors flex items-center`}>
              <FaHome className="h-5 w-5 mr-2" />
              Home
            </Link>
            <Link to="/profile" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors flex items-center`}>
              <FaUser className="h-5 w-5 mr-2" />
              Profile
            </Link>
            <Link to="/settings" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors flex items-center`}>
              <FaCog className="h-5 w-5 mr-2" />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Privacy Policy Content */}
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className={`${isDarkMode ? 'dark-card-bg' : 'light-card-bg'} rounded-xl shadow-lg p-8 mb-8`}>
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>Privacy Policy</h1>
          
          <div className={`prose ${isDarkMode ? 'prose-invert text-zinc-300' : 'text-zinc-700'} max-w-none`}>
            <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>1. Introduction</h2>
            <p className="mb-4">Welcome to CiviQuest ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy outlines our policies and procedures on the collection, use, and disclosure of your information when you use our educational application (the "Service") and tells you about your privacy rights.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>2. Educational Purpose & Scope</h2>
            <p className="mb-4">The CiviQuest is designed for educational purposes, offering review materials and practice tests for the Civil Services Examination for Aspirants (CSE) in the Philippines. This Service is provided free of charge, and we do not offer payment plans or premium features that involve financial transactions. This Privacy Policy applies to all information collected through our Service.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>3. Information We Collect</h2>
            <p className="mb-4">To provide and improve our Service, we collect the following types of information:</p>
            <ul className="list-disc pl-8 mb-4">
              <li><strong>Personal Identification Information:</strong>
                <ul className="list-circle pl-6">
                  <li>Email address: Used for account creation, authentication, and communication.</li>
                  <li>Password: For account security (we store hashed passwords).</li>
                  <li>Name: To personalize your experience.</li>
                  <li>Account User ID: A unique identifier assigned by our authentication provider upon account creation, used to associate your data with your account.</li>
                </ul>
              </li>
              <li><strong>Educational Data:</strong>
                <ul className="list-circle pl-6">
                  <li>Usage data: Information on how you interact with the Service, such as quiz scores, progress, and time spent on modules. This helps us understand anPusage patterns and improve the Service.</li>
                </ul>
              </li>
              <li><strong>Technical Data:</strong>
                <ul className="list-circle pl-6">
                  <li>Device and browser information: Such as browser type, operating system, and IP address (collected by our hosting and analytics providers for security and diagnostic purposes).</li>
                </ul>
              </li>
            </ul>
            <p className="mb-4"><strong>We do not knowingly collect sensitive personal information or payment information</strong>, as our Service is entirely free and for educational use.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>4. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-8 mb-4">
              <li>To provide, operate, and maintain our Service.</li>
              <li>To manage your account and provide you with customer support.</li>
              <li>To personalize your learning experience based on your progress.</li>
              <li>To track your learning progress and performance in quizzes.</li>
              <li>To analyze usage patterns to improve the Service's features, content, and usability.</li>
              <li>To communicate with you regarding important updates, security alerts, or changes to our Service or policies.</li>
              <li>For research and development to enhance the educational effectiveness of the platform.</li>
            </ul>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>5. Data Sharing and Disclosure</h2>
            <p className="mb-4">We do not sell, trade, or rent your personal information to third parties for their marketing purposes. We may disclose your information in the following limited circumstances:</p>
            <ul className="list-disc pl-8 mb-4">
              <li><strong>Service Providers:</strong> We utilize third-party services for core functionality. Specifically:
                <ul className="list-circle pl-6">
                  <li><strong>Supabase:</strong> We use Supabase for user authentication (including Google Sign-In and Email/Password sign-in), and database services (to store your account information, profile, and educational progress). Supabase operates under its own privacy policy, which we encourage you to review.</li>
                </ul>
              </li>
              <li><strong>Legal Requirements:</strong> If required by law, such as to comply with a subpoena, or if we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of all or a portion of our assets, your personal information may be transferred as part of that transaction, subject to the commitments made in this Privacy Policy.</li>
            </ul>

            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>6. Data Security</h2>
            <p className="mb-4">We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. This includes using HTTPS for data transmission and leveraging our authentication provider's security features. However, please also remember that we cannot guarantee that the internet itself is 100% secure. While we strive to protect your personal information, transmission of personal information to and from our Service is at your own risk.</p>

            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>7. Cookies and Local Storage</h2>
            <p className="mb-4">We use local storage in your browser to remember your preferences, such as your preferred theme (dark or light mode), to enhance your user experience. We do not use cookies for tracking your activity across different websites. Our third-party service providers, like Supabase, may use cookies as part of their services. We recommend reviewing their respective privacy and cookie policies for more information.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>8. Your Data Protection Rights</h2>
            <p className="mb-4">You have certain data protection rights. Depending on your location, these may include the right to:</p>
            <ul className="list-disc pl-8 mb-4">
              <li>Access, update, or delete the information we have on you. (You can typically do this through your account settings or by contacting us).</li>
              <li>Rectify any information that is inaccurate or incomplete.</li>
              <li>Object to our processing of your personal information.</li>
              <li>Request that we restrict the processing of your personal information.</li>
              <li>Data portability: Request a copy of your personal information in a structured, machine-readable format.</li>
              <li>Withdraw consent at any time where we relied on your consent to process your personal information.</li>
            </ul>
            <p className="mb-4">To exercise these rights, please contact us using the contact details provided below. We will respond to your request in accordance with applicable data protection laws.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>9. Children's Privacy</h2>
            <p className="mb-4">Our Service is not intended for use by children under the age of 16 without parental consent. We do not knowingly collect personally identifiable information from children under 16. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us. If we become aware that we have collected personal information from children without verification of parental consent, we take steps to remove that information from our servers.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>10. Changes to This Privacy Policy</h2>
            <p className="mb-4">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>11. Contact Us</h2>
            <p className="mb-4">If you have any questions about this Privacy Policy or our data practices, please contact us at: mrkmillares@gmail.com.</p>
          </div>
        </div>
      </main>
      
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
};

export default PrivacyPolicy; 
