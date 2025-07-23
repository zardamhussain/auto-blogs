import React from 'react';
import { FaTachometerAlt } from 'react-icons/fa';

const SeoScoreCard = ({ position, animation, rotation }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  // 180-degree half-circle
  const progress = 0.5;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={`absolute ${position} p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl flex flex-col items-center gap-2 ${animation} ${rotation}`}>
      <div className="flex items-center gap-2">
        <FaTachometerAlt className="text-purple-500" />
        <h4 className="font-semibold text-gray-700 dark:text-gray-200">SEO Score</h4>
      </div>
      <div className="relative w-32 h-20">
        <svg className="w-full h-full" viewBox="0 0 100 55">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className="text-green-300" stopColor="currentColor" />
              <stop offset="100%" className="text-green-600" stopColor="currentColor" />
            </linearGradient>
          </defs>
          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            strokeWidth="8"
            className="stroke-gray-200 dark:stroke-gray-600"
          />
          {/* Progress Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference / 2,
              strokeDashoffset: (circumference / 2) * (1 - (195 / 180)) // Show 110% of the half arc
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600 text-2xl sm:text-3xl">110%</p>
        </div>
      </div>
    </div>
  );
};

export default SeoScoreCard; 