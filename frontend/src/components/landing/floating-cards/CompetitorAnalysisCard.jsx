import React from 'react';
import { FaSearchengin } from 'react-icons/fa';

const CompetitorAnalysisCard = ({ position, animation, rotation }) => {
  return (
    <div className={`absolute ${position} p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-xl ${animation} ${rotation}`}>
      <div className="flex items-center gap-4 mb-2">
        <FaSearchengin className="text-purple-500" size={20} />
        <h3 className="text-gray-800 dark:text-white font-bold text-sm sm:text-base">Competitor Analysis</h3>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Competitor A</p>
          <div className="w-1/2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Competitor B</p>
          <div className="w-1/2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysisCard; 