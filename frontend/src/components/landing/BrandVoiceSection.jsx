import React from 'react';
import { FaPenFancy, FaArrowRight } from 'react-icons/fa';

const BrandVoiceSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="z-10 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Write Articles That Sound <span className="text-purple-600">Exactly</span> Like You
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Your brand has a unique voice. Don't lose it to robotic AI. Our engine analyzes your existing content to learn your tone, style, and nuances, then writes new articles that are a perfect extension of your brand.
            </p>
            <button className="inline-flex items-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg hover:opacity-90 transition-opacity">
              <span>Maintain Your Brand Voice</span>
              <FaArrowRight className="ml-2" />
            </button>
          </div>

          {/* Mockup */}
          <div className="relative h-96 flex items-center justify-center lg:order-1 overflow-hidden">
            <div className="relative w-full max-w-lg">
              {/* Background card */}
              <div className="absolute w-full h-full bg-white dark:bg-gray-700/50 rounded-xl shadow-lg transform rotate-[2deg] top-0 left-0"></div>

              {/* Main card */}
              <div 
                className="relative z-10 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div className="flex items-center space-x-2 mb-4">
                  <FaPenFancy className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Analyze Your Style</h3>
                </div>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300">https://yoursite.com/blog/article-1</div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300">https://yoursite.com/blog/article-2</div>
                   <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300">https://yoursite.com/blog/article-3</div>
                </div>
              </div>

              {/* Popping-out element 1 */}
              <div className="hidden lg:block absolute -bottom-6 -right-8 z-20 flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Write Similar</span>
                <FaArrowRight className="h-4 w-4 text-purple-500" />
              </div>

              {/* Popping-out element 2 */}
               <div className="hidden lg:block absolute top-1/2 -left-12 z-20 px-3 py-2 bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Just 3 URLs to learn</span>
              </div>


              {/* Arrow annotation */}
              <div className="hidden lg:block absolute -top-8 -left-20 z-20">
                <p className="text-sm text-left font-semibold text-purple-500">Mimic your style</p>
                <svg width="85" height="55" viewBox="0 0 85 55" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform scale-y-[-1] -ml-4 text-purple-500">
                    <path d="M2.36015 52.4849C10.2368 44.8016 26.6341 32.593 43.1493 25.1093C59.6644 17.6256 72.8443 12.822 82.204 11.0543" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M74.1942 2.00001C76.9069 5.03774 80.4285 8.1691 82.2039 11.0543C78.3149 14.1205 73.8115 16.4866 70.3633 18.2381" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandVoiceSection; 