import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';

interface FooterProps {
  isDarkMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  const currentYear = new Date().getFullYear();

  const bgClass = isDarkMode ? "bg-zinc-950 border-t border-zinc-800" : "bg-zinc-50 border-t border-zinc-300";
  const textClass = isDarkMode ? "text-zinc-400" : "text-zinc-600";
  const headingClass = isDarkMode ? "text-zinc-100" : "text-zinc-900";
  const linkHoverClass = isDarkMode ? "hover:text-blue-400" : "hover:text-blue-600";
  const iconBgClass = isDarkMode ? "bg-zinc-900 hover:bg-zinc-800" : "bg-white hover:bg-zinc-100";
  const dividerClass = isDarkMode ? "border-zinc-800" : "border-zinc-300";

  return (
    <footer className={`${bgClass} transition-colors duration-300 w-full mt-auto`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">

          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={`text-xl font-bold ${headingClass}`}>CiviQuest</span>
            </div>
            <p className={`text-sm leading-relaxed ${textClass}`}>
              Empowering future civil service aspirants with comprehensive preparation tools for the Civil Service Examination.
            </p>
            <div className="flex gap-3">
              {[
                { icon: FaFacebook, label: "Facebook" },
                { icon: FaInstagram, label: "Instagram" }
              ].map((Social, index) => (
                <a
                  key={index}
                  href="#"
                  className={`w-10 h-10 rounded-lg ${iconBgClass} flex items-center justify-center transition-all duration-200 shadow-sm border ${dividerClass} ${textClass} ${linkHoverClass}`}
                  aria-label={Social.label}
                >
                  <Social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`font-semibold mb-6 ${headingClass}`}>Platform</h3>
            <ul className="space-y-4">
              {[
                { label: "Dashboard", to: "/" },
                { label: "Study Materials", to: "/lessons" },
                { label: "Practice Test", to: "/quizzes" },
                { label: "Progress", to: "/progress" }
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className={`text-sm ${textClass} ${linkHoverClass} transition-colors duration-200`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className={`font-semibold mb-6 ${headingClass}`}>Company</h3>
            <ul className="space-y-4">
              {[
                { label: "Terms of Service", to: "/terms-of-service" },
                { label: "Privacy Policy", to: "/privacy-policy" }
              ].map((link, index) => (
                <li key={index}>
                  <Link to={link.to} className={`text-sm ${textClass} ${linkHoverClass} transition-colors duration-200`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className={`font-semibold mb-6 ${headingClass}`}>Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded-md ${isDarkMode ? 'bg-zinc-900' : 'bg-white'} border ${dividerClass}`}>
                  <FaEnvelope className="text-blue-500" size={14} />
                </div>
                <div>
                  <p className={`text-xs font-medium mb-1 ${textClass}`}>Email us at</p>
                  <a href="mailto:GamifiedCivilService@gmail.com" className={`text-sm font-medium ${headingClass} ${linkHoverClass}`}>
                    GamifiedCivilService@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded-md ${isDarkMode ? 'bg-zinc-900' : 'bg-white'} border ${dividerClass}`}>
                  <FaPhoneAlt className="text-blue-500" size={14} />
                </div>
                <div>
                  <p className={`text-xs font-medium mb-1 ${textClass}`}>Call us</p>
                  <a href="tel:+639519009913" className={`text-sm font-medium ${headingClass} ${linkHoverClass}`}>
                    +63 951 900 9913
                  </a>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className={`pt-8 border-t ${dividerClass} flex flex-col md:flex-row justify-between items-center gap-4`}>
          <p className={`text-sm ${textClass}`}>
            © {currentYear} CiviQuest. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className={`text-xs ${textClass}`}>
              Designed for Civil Service Aspirants
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;