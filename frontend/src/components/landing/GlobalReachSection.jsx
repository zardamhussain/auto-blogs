import React from 'react';
import { FaGlobeAmericas, FaLanguage, FaCrosshairs, FaTachometerAlt } from 'react-icons/fa';

const languages = [
    { name: 'English', flag: '🇺🇸', position: 'top-10 left-10' },
    { name: '日本語', flag: '🇯🇵', position: 'top-20 right-5' },
    { name: 'Español', flag: '🇪🇸', position: 'bottom-10 left-16' },
    { name: 'Deutsch', flag: '🇩🇪', position: 'bottom-24 right-12' },
    { name: 'Français', flag: '🇫🇷', position: 'top-1/2 left-0' },
    { name: '中文', flag: '🇨🇳', position: 'bottom-5 right-1/3' },
];

const GlobalReachSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Go Global, Instantly.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Why limit your audience? OutBlogs is your key to unlocking international markets. We automate the complex process of localizing your content, empowering you to rank from the USA to Japan and capture a global user base.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                  <FaLanguage />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">AI-Powered Translation</h4>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">Generate high-quality, nuanced content in over 100 languages.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                  <FaCrosshairs />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Localized SEO</h4>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">Optimize for local search terms and cultural nuances to dominate international SERPs.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                  <FaTachometerAlt />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Single-Dashboard Control</h4>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">Manage all your international content from one simple, powerful dashboard.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Right Column: Globe Visualization */}
          <div className="relative lg:flex justify-center items-center h-96 hidden">
            <div 
              className="absolute w-80 h-80 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center"
              style={{
                transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
                boxShadow: '0 25px 50px -12px rgba(120, 119, 198, 0.4)',
              }}
            >
               <FaGlobeAmericas className="text-white/80 text-9xl" />
            </div>

            {languages.map((lang) => (
              <div key={lang.name} className={`absolute ${lang.position} animate-float-slow`}>
                <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-md p-2 rounded-lg shadow-lg flex items-center gap-2">
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-semibold text-sm text-gray-800 dark:text-white">{lang.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Fallback View */}
          <div className="lg:hidden mt-12">
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Serving a Global Audience</h3>
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <ul className="space-y-4">
                {languages.map((lang) => (
                  <li key={lang.name} className="flex items-center">
                    <span className="text-2xl mr-4">{lang.flag}</span>
                    <span className="text-lg text-gray-700 dark:text-gray-300">{lang.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default GlobalReachSection; 