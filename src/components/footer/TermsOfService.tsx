import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaHome, FaUser, FaCog } from 'react-icons/fa';
import Footer from './Footer';

const TermsOfService: React.FC = () => {
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
            <FaGraduationCap className={`w-10 h-10 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'} mr-3`} />
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'dark-brand-text' : 'light-brand-text'}`}>CiviQuest</h1>
          </div>
          
          <div className="space-x-6 hidden md:flex items-center text-lg">
            <Link to="/" className={`${isDarkMode ? 'text-zinc-300 hover:text-zinc-100' : 'text-zinc-600 hover:text-zinc-900'} transition-colors flex items-center`}>
              <FaHome className="h-5 w-5 mr-2" />
              Home
            </Link>
            <Link to="/profile" className={`${isDarkMode ? 'text-zinc-300 hover:text-zinc-100' : 'text-zinc-600 hover:text-zinc-900'} transition-colors flex items-center`}>
              <FaUser className="h-5 w-5 mr-2" />
              Profile
            </Link>
            <Link to="/settings" className={`${isDarkMode ? 'text-zinc-300 hover:text-zinc-100' : 'text-zinc-600 hover:text-zinc-900'} transition-colors flex items-center`}>
              <FaCog className="h-5 w-5 mr-2" />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Terms of Service Content */}
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className={`${isDarkMode ? 'dark-card-bg' : 'light-card-bg'} rounded-xl shadow-lg p-8 mb-8`}>
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Terms of Service</h1>
          
          <div className={`prose ${isDarkMode ? 'prose-dark text-gray-300' : 'text-gray-700'} max-w-none`}>
            <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>1. Introduction</h2>
            <p className="mb-4">Welcome to CiviQuest ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the Civil Services application (the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, you do not have permission to access the Service.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>2. Educational Purpose</h2>
            <p className="mb-4">The CiviQuest application is primarily designed for educational purposes, providing review materials and practice tests for the Civil ServiceS Examination for Aspirants (CSE) in the Philippines. While initially developed as a system project, we may offer commercial versions or premium features in the future.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>3. User Accounts</h2>
            <p className="mb-4">To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate information during the registration process and to update such information to keep it accurate and current.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>4. Intellectual Property Rights</h2>
            <p className="mb-4">The Service and its original content, features, and functionality are owned by CiviQuest and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Service without prior written consent.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>5. User Content</h2>
            <p className="mb-4">By submitting any content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your content in any existing or future media. You represent and warrant that you own or have the necessary rights to the content you submit and that it does not violate any third party's intellectual property rights.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>6. Prohibited Uses</h2>
            <p className="mb-4">You agree not to use the Service:</p>
            <ul className="list-disc pl-8 mb-4">
              <li>In any way that violates any applicable local, national, or international law or regulation</li>
              <li>To impersonate or attempt to impersonate any person or entity</li>
              <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
              <li>To attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service</li>
              <li>To distribute content or materials that are harmful, offensive, or otherwise objectionable</li>
            </ul>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>7. Subscription and Purchases on future updates</h2>
            <p className="mb-4">We may offer free and paid subscription tiers or one-time purchases for access to premium content or features. Pricing for such services will be clearly displayed prior to purchase. By making a purchase, you agree to pay the specified fees and applicable taxes. All payments are non-refundable unless required by law or as specified in our refund policy.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>8. Disclaimer of Warranties</h2>
            <p className="mb-4">The Service is provided on an "as is" and "as available" basis without any warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free, or that any content or information you obtain through the Service will be accurate or reliable.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>9. Limitation of Liability</h2>
            <p className="mb-4">To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service, regardless of whether we have been informed of the possibility of such damages.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>10. Changes to Terms</h2>
            <p className="mb-4">We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
            
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>11. Contact Us</h2>
            <p className="mb-4">If you have any questions about these Terms, please contact us at CiviQuest@gmail.com.</p>
          </div>
        </div>
      </main>
      
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
};

export default TermsOfService; 