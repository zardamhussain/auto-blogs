import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { trackEvent } from '../../utils/analytics';
import { FaBolt, FaKey, FaLink } from 'react-icons/fa';

const MiniReportCard = ({ icon, title, value, position, animationDelay }) => (
    <div 
        className={`absolute ${position} bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-3 animate-float`}
        style={{ animationDelay }}
    >
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{value}</p>
        </div>
    </div>
);

const SeoAudit = () => {
  const { signInWithGoogle } = useAuth();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url) return;
    
    // Track SEO audit form submission
    trackEvent('form_submit', 'lead_generation', 'seo_audit', 1);
    trackEvent('seo_audit_request', 'engagement', url, 1);
    
    setIsLoading(true);
    setTimeout(() => {
      signInWithGoogle();
      setIsLoading(false);
    }, 2000);
  };

  const handleInputChange = (e) => {
    setUrl(e.target.value);
    // Track when user starts typing in the audit form
    if (e.target.value.length === 1) {
      trackEvent('form_interaction', 'engagement', 'seo_audit_input', 1);
    }
  };

  return (
    <section className="relative py-32 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="hidden lg:block absolute inset-0 blueprint-grid z-0"></div>
        <div className="relative z-10 container mx-auto px-8">
            <div 
                className="relative max-w-3xl mx-auto p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"
                style={{ transform: 'perspective(1200px) rotateY(-5deg) rotateX(2deg)' }}
            >
                <MiniReportCard 
                    position="top-[-3rem] left-[-4rem]"
                    title="Site Speed Grade"
                    value="A+"
                    icon={<FaBolt className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                    animationDelay="0s"
                />
                <MiniReportCard 
                    position="top-[5rem] right-[-8rem]"
                    title="Top Keyword Opportunity"
                    value="AI Content"
                    icon={<FaKey className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                    animationDelay="0.3s"
                />
                 <MiniReportCard 
                    position="bottom-[-2rem] left-[2rem]"
                    title="Backlink Analysis"
                    value="Strong"
                    icon={<FaLink className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                    animationDelay="0.6s"
                />

                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                    Get Your Free SEO Analysis
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                    Enter your website URL to get a free, instant audit. We'll show you exactly what you need to do to outrank your competitors.
                    </p>
                    <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-4">
                    <input
                        type="url"
                        value={url}
                        onChange={handleInputChange}
                        placeholder="https://yourwebsite.com"
                        className="flex-grow px-6 py-4 rounded-full text-lg text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-purple-500 focus:outline-none focus:ring-0 transition-all"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-4 rounded-full text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? 'Analyzing...' : 'Analyze Now'}
                    </button>
                    </form>
                </div>
            </div>
      </div>
    </section>
  );
};

export default SeoAudit; 