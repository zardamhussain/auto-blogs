import React from 'react';
import { FaMousePointer, FaRandom, FaChartBar } from 'react-icons/fa';

const CtaSection = () => {
  return (
    <section className="relative py-24 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="hidden lg:block absolute inset-0 blueprint-grid z-0"></div>
      <div className="relative z-10 container mx-auto px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl mb-4">
            Create CTAs That Actually Convert
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-16">
            Go beyond simple buttons. Design, test, and track Calls-to-Action that drive measurable results for your business.
          </p>
        </div>

        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* Step 1: Design */}
          <div className="w-full lg:w-1/3">
            <div className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-lg text-center">
              <div className="flex justify-center items-center h-16 w-16 mx-auto bg-purple-100 dark:bg-purple-900/50 rounded-full mb-6">
                <FaMousePointer className="h-8 w-8 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">1. Design with AI</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Generate dozens of high-impact CTA styles and copy variations in seconds.</p>
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="hidden lg:block transform rotate-90 lg:rotate-0">
            <svg width="80" height="20" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 10 L70 10 L60 5 M70 10 L60 15" stroke="#9ca3af" strokeWidth="2" />
            </svg>
          </div>

          {/* Step 2: Test */}
          <div className="w-full lg:w-1/3">
            <div className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-lg text-center">
              <div className="flex justify-center items-center h-16 w-16 mx-auto bg-purple-100 dark:bg-purple-900/50 rounded-full mb-6">
                <FaRandom className="h-8 w-8 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">2. A/B Test Variants</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Automatically rotate your CTAs to find the version that performs best.</p>
            </div>
          </div>

          {/* Arrow 2 */}
          <div className="hidden lg:block transform rotate-90 lg:rotate-0">
            <svg width="80" height="20" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 10 L70 10 L60 5 M70 10 L60 15" stroke="#9ca3af" strokeWidth="2" />
            </svg>
          </div>

          {/* Step 3: Track */}
          <div className="w-full lg:w-1/3">
            <div className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-lg text-center">
              <div className="flex justify-center items-center h-16 w-16 mx-auto bg-purple-100 dark:bg-purple-900/50 rounded-full mb-6">
                <FaChartBar className="h-8 w-8 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">3. Track Performance</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Get clear analytics on clicks and conversions to see what's working.</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-20">
            <a href="#pricing" className="py-4 px-10 rounded-full font-semibold text-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity">
                Get Started with Advanced CTAs
            </a>
        </div>
      </div>
    </section>
  );
};

export default CtaSection; 