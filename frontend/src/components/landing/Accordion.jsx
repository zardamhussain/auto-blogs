import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-5 text-left"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
        <FaChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
            <div className="pb-5 text-gray-600 dark:text-gray-300">
              {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Accordion; 