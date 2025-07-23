import { useEffect } from 'react';
import { getAnalyticsConfig, isAhrefsEnabled, isGTMEnabled } from '../config/analytics';

const AnalyticsInitializer = () => {
  useEffect(() => {
    const config = getAnalyticsConfig();
    
    // Ensure dataLayer is available
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
    }
    
    // Ensure Ahrefs script is loaded
    if (isAhrefsEnabled() && !document.querySelector('script[src*="analytics.ahrefs.com"]')) {
      try {
        const ahrefsScript = document.createElement('script');
        ahrefsScript.async = true;
        ahrefsScript.src = 'https://analytics.ahrefs.com/analytics.js';
        ahrefsScript.setAttribute('data-key', config.AHREFS_TRACKING_KEY);
        ahrefsScript.onerror = () => console.warn('Ahrefs script failed to load');
        document.head.appendChild(ahrefsScript);
      } catch (error) {
        console.warn('Failed to load Ahrefs script:', error);
      }
    }

    // Ensure GTM is properly initialized
    if (isGTMEnabled()) {
      // GTM script is already in HTML, but ensure dataLayer is available
      if (typeof window.gtag === 'undefined' && window.dataLayer) {
        window.gtag = function() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        // GA4 configuration will be handled by GTM, not here
      }
      
      // Push initial GTM event only once
      if (window.dataLayer && window.dataLayer.length === 0) {
        window.dataLayer.push({
          'event': 'gtm.init',
          'page_title': document.title,
          'page_location': window.location.href,
          'gtm.start': new Date().getTime(),
        });
      }
    }

    // Log analytics status in development
    if (config.ENABLE_DEBUG_MODE) {
      console.log('Analytics Status:', {
        googleAnalytics: !!window.gtag,
        ahrefs: isAhrefsEnabled(),
        gtm: isGTMEnabled() && !!window.dataLayer,
        dataLayer: window.dataLayer || [],
        config: {
          GA_TRACKING_ID: config.GA_TRACKING_ID,
          AHREFS_TRACKING_KEY: config.AHREFS_TRACKING_KEY,
          GTM_CONTAINER_ID: config.GTM_CONTAINER_ID,
        }
      });
    }
  }, []);

  // This component doesn't render anything
  return null;
};

export default AnalyticsInitializer; 