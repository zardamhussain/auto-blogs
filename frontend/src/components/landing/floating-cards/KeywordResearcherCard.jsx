import React from 'react';
import { FaChartLine } from 'react-icons/fa';

const KeywordResearcherCard = ({ position, animation, rotation }) => {
  return (
    <div className={`absolute ${position} p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-xl ${animation} ${rotation}`}>
      <div className="flex items-center gap-4 mb-2">
        <FaChartLine className="text-purple-500" size={20} />
        <h3 className="text-gray-800 dark:text-white font-bold text-sm sm:text-base">Keyword Researcher</h3>
      </div>
      <div className="space-y-2">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">"How to rank in Google" - <span className="font-bold text-green-500">High Potential</span></p>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">"SEO best practices" - <span className="font-bold text-yellow-500">Medium Potential</span></p>
      </div>
    </div>
  );
};

export default KeywordResearcherCard; 