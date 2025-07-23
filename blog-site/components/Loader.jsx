import React from 'react';
import { useTheme } from '../context/ThemeContext';

const Loader = () => {
  const { theme } = useTheme();
  // Set loader color based on theme
  const loaderColor = theme === 'dark' ? '#fff' : '#2563eb'; // white for dark, blue-600 for light
  return (
    <div className="loader" style={{ '--loader-color': loaderColor }}></div>
  );
};

export default Loader; 