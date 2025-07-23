import React, { useState, useEffect } from 'react';
import { setAnalyticsConsent, setUserOptOut } from '../utils/analytics';

const PrivacyConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // Auto-enable analytics for now (until 10k users)
    // TODO: Enable consent banner when user base grows
    const ENABLE_CONSENT_BANNER = false; // Set to true when ready for consent
    
    if (ENABLE_CONSENT_BANNER) {
      // Check if user has already made a choice
      const hasConsented = localStorage.getItem('analytics_consent');
      if (hasConsented === null) {
        setShowConsent(true);
      } else {
        setConsentGiven(hasConsented === 'true');
        setAnalyticsConsent(hasConsented === 'true');
      }
    } else {
      // Auto-enable analytics
      setConsentGiven(true);
      setAnalyticsConsent(true);
    }
  }, []);

  const handleConsent = (consent) => {
    setConsentGiven(consent);
    setShowConsent(false);
    localStorage.setItem('analytics_consent', consent.toString());
    setAnalyticsConsent(consent);
    setUserOptOut(!consent);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-2">Privacy & Analytics</h3>
          <p className="text-gray-300 text-sm">
            We use cookies and analytics to improve your experience and understand how you use our platform. 
            This helps us provide better features and support.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleConsent(false)}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => handleConsent(true)}
            className="px-4 py-2 bg-primary-purple hover:bg-primary-purple/90 text-white text-sm rounded-lg transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsent; 