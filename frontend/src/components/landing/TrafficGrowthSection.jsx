import React from 'react';
import { FaSearch, FaFeatherAlt, FaShieldAlt, FaArrowRight, FaCog, FaChartBar, FaBolt } from 'react-icons/fa';
import './TrafficGrowthSection.css';

const FloatingIcon = ({ icon, className }) => {
    return (
        <div className={`hidden lg:block absolute text-purple-300/50 dark:text-purple-700/50 ${className}`}>
            {icon}
        </div>
    );
};

const PainPoint = ({ text, className, style }) => (
    <div className={`pain-point-cloud ${className}`} style={style}>
        {text}
    </div>
);

const TrafficGrowthSection = () => {
  return (
    <section className="relative py-24 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 blueprint-grid z-0"></div>
        {/* Floating background icons */}
        <FloatingIcon icon={<FaCog size={32} className="animate-spin-slow" />} className="top-1/4 left-[10%]" />
        <FloatingIcon icon={<FaChartBar size={24} />} className="top-1/2 right-[12%]" />
        <FloatingIcon icon={<FaBolt size={28} />} className="bottom-1/4 left-[20%]" />
        <FloatingIcon icon={<FaCog size={20} className="animate-spin" />} className="bottom-[15%] right-[15%]" />

      <div className="container mx-auto px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            This Isn't a Tool. It's a <span className="text-purple-600">Growth Flywheel.</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            The top 5 search results get more traffic than the next 50 combined. We don't just give you features; we give you a proprietary system designed for domination.
          </p>
        </div>

        {/* --- Desktop View: The Growth Gear Wheel --- */}
        <div className="hidden lg:flex relative items-center justify-center min-h-[550px]">
            {/* Pain Point Clouds */}
            <PainPoint text="How to rank on Google?" className="top-[10%] left-[5%] animate-float" />
            <PainPoint text="Why am I stuck on page 2?" className="top-[20%] right-[8%] animate-float" style={{ animationDelay: '-2s' }} />
            <PainPoint text="Is SEO even worth it?" className="bottom-[15%] left-[12%]" style={{ animationDelay: '-4s' }} />
            <PainPoint text="How to get more backlinks?" className="bottom-[5%] right-[20%] animate-float" />

            {/* The Gear */}
            <div className="gear-container">
                <div className="gear-wheel">
                    <div className="gear-center-text">
                        <h3 className="text-2xl lg:text-3xl font-bold text-white">Rank Acceleration <br/> Engine</h3>
                        <div className="my-4 w-16 h-1 bg-purple-500 rounded-full"></div>
                        <p className="text-purple-200 text-sm lg:text-base">Our proprietary AI core that powers the entire flywheel.</p>
                    </div>
                </div>
            </div>

            {/* Component 1: Competitor Blindspots */}
            <div className="absolute w-64 p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg transform -translate-x-48 -translate-y-48 lg:-translate-x-64 lg:-translate-y-64 z-20">
                <div className="flex items-center gap-3 mb-2">
                    <FaSearch className="h-7 w-7 text-purple-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Competitor Blindspots</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uncover high-value, <span className="font-bold text-purple-500">long-tail keywords</span> your competitors ignore.</p>
            </div>

            {/* Component 2: Content that Converts */}
            <div className="absolute w-64 p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg transform translate-x-48 -translate-y-24 lg:translate-x-80 lg:-translate-y-24 z-20">
                <div className="flex items-center gap-3 mb-2">
                    <FaFeatherAlt className="h-7 w-7 text-purple-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Content that Converts</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generate articles that build trust and <span className="font-bold text-purple-500">convert readers</span> into customers.</p>
            </div>

            {/* Component 3: #1 Authority & Trust */}
            <div className="absolute w-64 p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg transform -translate-x-16 translate-y-64 lg:-translate-x-24 lg:translate-y-72 z-20">
                <div className="flex items-center gap-3 mb-2">
                    <FaShieldAlt className="h-7 w-7 text-purple-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">#1 Authority & Trust</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Build a <span className="font-bold text-purple-500">strong SERP presence</span> and earn high-value backlinks.</p>
            </div>
        </div>

        {/* --- Mobile View: Simplified Vertical Layout --- */}
        <div className="lg:hidden space-y-8">
            {/* Engine */}
            <div className="p-6 bg-gray-800 dark:bg-gray-900 border border-purple-500/50 rounded-xl text-center">
                <h3 className="text-2xl font-bold text-white">Rank Acceleration Engine</h3>
                <p className="text-purple-200 mt-2 text-sm">Our proprietary AI core that powers the entire flywheel.</p>
            </div>

            {/* Components */}
            <div className="p-5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <FaSearch className="h-7 w-7 text-purple-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Competitor Blindspots</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uncover high-value, <span className="font-bold text-purple-500">long-tail keywords</span> your competitors ignore.</p>
            </div>
            <div className="p-5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <FaFeatherAlt className="h-7 w-7 text-purple-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Content that Converts</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generate articles that build trust and <span className="font-bold text-purple-500">convert readers</span> into customers.</p>
            </div>
            <div className="p-5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <FaShieldAlt className="h-7 w-7 text-purple-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">#1 Authority & Trust</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Build a <span className="font-bold text-purple-500">strong SERP presence</span> and earn high-value backlinks.</p>
            </div>
        </div>

        {/* Supercharged CTA */}
        <div className="mt-20 max-w-2xl mx-auto">
            <div className="relative p-8 bg-white dark:bg-gray-800 border-2 border-purple-400/50 rounded-2xl shadow-2xl shadow-purple-500/10">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Activate Your Growth Flywheel</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Get a free, instant analysis of your website's biggest opportunities.</p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <input 
                        type="url" 
                        placeholder="https://yourwebsite.com"
                        className="w-full px-5 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity transform hover:scale-105">
                        <span>Find My Competitor's Blindspots</span>
                        <FaArrowRight />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default TrafficGrowthSection; 