import React from 'react';
import { FaPalette } from 'react-icons/fa';

const BrandedImagesCard = ({ position, animation, rotation }) => {
  const brandColors = [
    { name: 'Primary', hex: '#2563eb', bgClass: 'bg-blue-600' },
    { name: 'Secondary', hex: '#ec4899', bgClass: 'bg-pink-500' },
    { name: 'Accent', hex: '#2dd4bf', bgClass: 'bg-teal-400' },
  ];

  return (
    <div className={`absolute ${position} p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-xl ${animation} ${rotation}`}>
      <div className="flex items-center gap-4 mb-3">
        <FaPalette className="text-purple-500" size={20} />
        <h3 className="text-gray-800 dark:text-white font-bold text-sm sm:text-base">Brand Color Palette</h3>
      </div>
      <div className="space-y-2">
        {brandColors.map((color) => (
          <div key={color.name} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-md ${color.bgClass}`}></div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">{color.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{color.hex}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandedImagesCard; 