import React from 'react';
import { FaBolt } from 'react-icons/fa';

const FastestBlogPagesCard = ({ position, animation, rotation }) => {
  return (
    <div className={`absolute ${position} p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-xl ${animation} ${rotation}`}>
      <div className="flex items-center gap-4 mb-2">
        <FaBolt className="text-purple-500" size={20} />
        <h3 className="text-gray-800 dark:text-white font-bold text-sm sm:text-base">Fastest Blog Pages</h3>
      </div>
      <div className="flex items-end gap-2">
        <div className="w-4 h-8 bg-green-400 rounded-t-sm"></div>
        <div className="w-4 h-12 bg-green-500 rounded-t-sm"></div>
        <div className="w-4 h-6 bg-green-300 rounded-t-sm"></div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 ml-2">+200% More Views</p>
      </div>
    </div>
  );
};

export default FastestBlogPagesCard; 