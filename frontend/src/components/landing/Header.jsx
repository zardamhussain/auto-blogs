import React, { useState, useEffect, useContext } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { FaBars, FaTimes } from 'react-icons/fa';
import { ThemeContext } from "../../context/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import { trackEvent } from "../../utils/analytics";

const Header = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { title: "How it works", href: "/#how-it-works" },
    { title: "Pricing", href: "/#pricing" },
    { title: "Features", href: "/#features" },
    { title: "Blog", href: "/blog" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    trackEvent('menu_toggle', 'navigation', 'mobile_menu', isMenuOpen ? 0 : 1);
  };

  const handleSignInClick = (buttonType) => {
    trackEvent('cta_click', 'engagement', `header_${buttonType}`, 1);
    signInWithGoogle();
  };

  const handleDashboardClick = () => {
    trackEvent('navigation_click', 'engagement', 'header_dashboard', 1);
    navigate("/dashboard");
  };

  const handleNavClick = (linkTitle) => {
    trackEvent('navigation_click', 'engagement', `header_${linkTitle.toLowerCase().replace(' ', '_')}`, 1);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2" onClick={() => handleNavClick('logo')}>
              <img src="/logo.svg" alt="OutBlog Logo" className="h-8 w-auto text-gray-900 dark:text-white" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.title} href={link.href} className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" onClick={() => handleNavClick(link.title)}>
                {link.title}
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-gray-800 dark:text-white">
              <FaBars size={24} />
            </button>
          </div>
          
          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <button
                    onClick={handleDashboardClick}
                    className="px-6 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity"
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <>
                    <button onClick={() => handleSignInClick('google_join')} className="flex items-center gap-2 font-semibold text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="w-5 h-5" />
                      Join with Google
                    </button>
                    <button onClick={() => handleSignInClick('start_free')} className="px-6 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity">
                      Start for Free
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Panel */}
      <div className={`md:hidden fixed top-0 left-0 w-full h-full bg-white dark:bg-gray-900 z-50 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 border-b border-gray-200 dark:border-gray-800">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
              <img src="/logo.svg"  className="h-8 w-auto text-gray-900 dark:text-white" />
            </Link>
            <button onClick={() => setIsMenuOpen(false)} className="text-gray-800 dark:text-white">
              <FaTimes size={24} />
            </button>
          </div>
          <nav className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-8">
            {navLinks.map((link) => (
              <a key={link.title} href={link.href} onClick={() => { handleNavClick(link.title); setIsMenuOpen(false); }} className="text-2xl text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400">
                {link.title}
              </a>
            ))}
            <div className="mt-8 flex flex-col gap-4 w-full max-w-xs mx-auto">
              {!loading && !user && (
                <>
                  <button onClick={() => handleSignInClick('mobile_start_free')} className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600">
                    Start for Free
                  </button>
                  <button onClick={() => handleSignInClick('mobile_google_join')} className="w-full py-3 rounded-full font-semibold border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white flex items-center justify-center gap-2">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="w-5 h-5" />
                    Join with Google
                  </button>
                </>
              )}
              {!loading && user && (
                 <button onClick={() => { handleDashboardClick(); setIsMenuOpen(false); }} className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600">
                    Go to Dashboard
                  </button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
