import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaHome } from 'react-icons/fa';
import Footer from './Footer';

const PrivacyPolicy: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; 
  });
  
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-bg' : 'light-bg';
  }, [isDarkMode]);
  
  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) setIsDarkMode(savedTheme === 'dark');
    };
    checkTheme();
    window.addEventListener('storage', checkTheme);
    return () => window.removeEventListener('storage', checkTheme);
  }, []);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark-bg dark-text' : 'light-bg light-text'} transition-colors duration-300`}>
      <nav className={`${isDarkMode ? 'dark-nav-bg dark-border' : 'light-nav-bg light-border'} h-20 p-4 sticky top-0 z-50 transition-colors duration-300`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <FaGraduationCap className={`w-10 h-10 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mr-3`} />
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'dark-brand-text' : 'light-brand-text'}`}>CiviQuest</h1>
          </div>
          <div className="space-x-6 hidden md:flex items-center text-lg">
            <Link to="/" className={`${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors flex items-center`}>
              <FaHome className="h-5 w-5 mr-2" /> Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className={`${isDarkMode ? 'dark-card-bg' : 'light-card-bg'} rounded-xl shadow-lg p-8 mb-8`}>
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>Privacy Policy</h1>
          <div className={`prose ${isDarkMode ? 'prose-invert text-zinc-300' : 'text-zinc-700'} max-w-none`}>
            <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>1. Introduction</h2>
            <p className="mb-4">Welcome to CiviQuest. We are committed to protecting your personal information and your right to privacy.</p>
            <h2 className={`text-xl font-semibold mt-8 mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>11. Contact Us</h2>
            <p className="mb-4">If you have any questions about this Privacy Policy, please contact us at: GamifiedCivilService@gmail.com.</p>
          </div>
        </div>
      </main>
      
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
};

export default PrivacyPolicy;