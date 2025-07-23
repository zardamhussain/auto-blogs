import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, initAnalytics } from '../utils/analytics';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize all analytics systems on first load
    initAnalytics();
  }, []);

  useEffect(() => {
    // Track page view when location changes across all platforms
    trackPageView(location.pathname, document.title);
  }, [location]);

  // This component doesn't render anything
  return null;
};

export default AnalyticsTracker; 