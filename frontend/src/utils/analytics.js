// Analytics utility for OutBlogs - GTM-based implementation
import { getAnalyticsConfig, isAhrefsEnabled, isGTMEnabled } from '../config/analytics';

const config = getAnalyticsConfig();
const GA_TRACKING_ID = config.GA_TRACKING_ID;
const AHREFS_TRACKING_KEY = config.AHREFS_TRACKING_KEY;
const GTM_CONTAINER_ID = config.GTM_CONTAINER_ID;

// Privacy and consent management (auto-enabled for now)
let analyticsConsent = true; // Auto-enabled
let userOptOut = false;
let isInitialized = false; // Prevent multiple initializations

// Initialize dataLayer if not present
const ensureDataLayer = () => {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    window.dataLayer = window.dataLayer || [];
  }
  return window.dataLayer;
};

// Initialize Google Tag Manager
export const initGTM = () => {
  if (typeof window !== 'undefined' && isGTMEnabled() && !isInitialized) {
    const dataLayer = ensureDataLayer();
    
    // Push initial GTM event
    dataLayer.push({
      'event': 'gtm.init',
      'page_title': document.title,
      'page_location': window.location.href,
      'gtm.start': new Date().getTime(),
    });
    
    // Initialize gtag function for GA4 compatibility
    if (typeof window.gtag === 'undefined') {
      window.gtag = function() {
        dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      // GA4 config will be handled by GTM, not here
    }
    
    isInitialized = true;
  }
};

// Initialize Ahrefs Analytics
export const initAhrefs = () => {
  if (typeof window !== 'undefined' && isAhrefsEnabled()) {
    // Ahrefs script is loaded via HTML
    // We can track custom events through dataLayer for GTM integration
    if (window.ahrefs) {
      console.log('Ahrefs Analytics initialized');
    }
  }
};

// Initialize all analytics
export const initAnalytics = () => {
  initGTM();
  initAhrefs();
};

// Privacy and consent functions (for future use)
export const setAnalyticsConsent = (consent) => {
  analyticsConsent = consent;
  if (consent) {
    initAnalytics();
  }
};

export const setUserOptOut = (optOut) => {
  userOptOut = optOut;
  if (optOut && typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      'allow_google_signals': false,
      'allow_ad_personalization_signals': false,
    });
  }
};

// Check if analytics should run (auto-enabled for now)
const shouldTrack = () => {
  return analyticsConsent && !userOptOut && typeof window !== 'undefined';
};

// Track page views through GTM
export const trackPageView = (path, title = null) => {
  if (!shouldTrack()) return;
  
  const dataLayer = ensureDataLayer();
  const pageTitle = title || document.title;
  const pageLocation = window.location.origin + path;
  
  // Push page view to dataLayer (GTM will handle GA4 and other tags)
  dataLayer.push({
    'event': 'page_view',
    'page_path': path,
    'page_title': pageTitle,
    'page_location': pageLocation,
    'page_referrer': document.referrer,
  });
  
  // Direct GA4 page view for immediate tracking
  if (window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: path,
      page_title: pageTitle,
      page_location: pageLocation,
    });
  }
  
  // Ahrefs page view tracking (if available)
  if (window.ahrefs && isAhrefsEnabled()) {
    console.log('Ahrefs page view tracked:', path);
  }
};

// Track custom events through GTM with proper GA4 structure
export const trackEvent = (action, category, label = null, value = null) => {
  if (!shouldTrack()) return;
  
  const dataLayer = ensureDataLayer();
  
  // Push event to dataLayer with proper GA4 structure
  const eventData = {
    'event': action,
    'event_category': category,
    'custom_event': true, // Flag for GTM custom event trigger
  };
  
  // Add optional parameters only if they exist
  if (label !== null && label !== undefined) {
    eventData.event_label = label;
  }
  if (value !== null && value !== undefined) {
    eventData.value = value;
  }
  
  dataLayer.push(eventData);
  
  // Direct GA4 event for immediate tracking
  if (window.gtag) {
    const ga4EventData = {
      event_category: category,
    };
    if (label !== null && label !== undefined) {
      ga4EventData.event_label = label;
    }
    if (value !== null && value !== undefined) {
      ga4EventData.value = value;
    }
    window.gtag('event', action, ga4EventData);
  }
  
  // Ahrefs event tracking (if available)
  if (window.ahrefs && isAhrefsEnabled()) {
    console.log('Ahrefs event tracked:', action, category, label, value);
  }
};

// User identification and properties
export const setUserProperties = (userId, properties = {}) => {
  if (!shouldTrack()) return;
  
  const dataLayer = ensureDataLayer();
  const userData = {
    user_id: userId,
    user_plan: properties.plan || 'free',
    user_role: properties.role || 'user',
    account_type: properties.accountType || 'individual',
  };
  
  // Push user properties to dataLayer
  dataLayer.push({
    'event': 'user_properties_set',
    ...userData,
  });
  
  // Direct GA4 user properties for immediate tracking
  if (window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      user_id: userId,
      custom_map: {
        'user_plan': 'custom_parameter_1',
        'user_role': 'custom_parameter_2',
        'account_type': 'custom_parameter_3',
      },
      user_plan: userData.user_plan,
      user_role: userData.user_role,
      account_type: userData.account_type,
    });
  }
  
  // Ahrefs user identification
  if (window.ahrefs && isAhrefsEnabled()) {
    console.log('Ahrefs user properties set:', userId, properties);
  }
};

// Revenue and e-commerce tracking
export const trackPurchase = (transactionId, value, currency = 'USD', items = []) => {
  if (!shouldTrack()) return;
  
  const dataLayer = ensureDataLayer();
  const purchaseData = {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items,
  };
  
  // Push purchase to dataLayer
  dataLayer.push({
    'event': 'purchase',
    ...purchaseData,
  });
  
  // Direct GA4 purchase event for immediate tracking
  if (window.gtag) {
    window.gtag('event', 'purchase', purchaseData);
  }
  
  // Ahrefs e-commerce tracking
  if (window.ahrefs && isAhrefsEnabled()) {
    console.log('Ahrefs purchase tracked:', purchaseData);
  }
};

export const trackSubscription = (planName, value, billingCycle = 'monthly') => {
  if (!shouldTrack()) return;
  
  trackEvent('subscription_started', 'ecommerce', planName, value);
  trackEvent('subscription_details', 'ecommerce', billingCycle, value);
};

// Feature usage tracking
export const trackFeatureUsage = (featureName, usageDetails = {}) => {
  if (!shouldTrack()) return;
  
  trackEvent('feature_used', 'feature_analytics', featureName);
  if (Object.keys(usageDetails).length > 0) {
    trackEvent('feature_details', 'feature_analytics', JSON.stringify(usageDetails));
  }
};

// Performance and error tracking
export const trackPerformance = (metricName, value) => {
  if (!shouldTrack()) return;
  
  trackEvent('performance_metric', 'performance', metricName, value);
};

export const trackError = (errorType, errorMessage, details = {}) => {
  if (!shouldTrack()) return;
  
  trackEvent('error', errorType, errorMessage);
  if (Object.keys(details).length > 0) {
    trackEvent('error_details', errorType, JSON.stringify(details));
  }
};

// User engagement events
export const trackUserAction = (action, details = {}) => {
  if (!shouldTrack()) return;
  
  trackEvent(action, 'user_engagement', JSON.stringify(details));
};

// Blog-related events
export const trackBlogEvent = (action, blogId = null, details = {}) => {
  if (!shouldTrack()) return;
  
  trackEvent(action, 'blog_interaction', blogId, null);
  if (Object.keys(details).length > 0) {
    trackEvent(`${action}_details`, 'blog_interaction', JSON.stringify(details));
  }
};

// Workflow events
export const trackWorkflowEvent = (action, workflowId = null, details = {}) => {
  if (!shouldTrack()) return;
  
  trackEvent(action, 'workflow_interaction', workflowId, null);
  if (Object.keys(details).length > 0) {
    trackEvent(`${action}_details`, 'workflow_interaction', JSON.stringify(details));
  }
};

// Conversion events
export const trackConversion = (conversionType, value = null, details = {}) => {
  if (!shouldTrack()) return;
  
  trackEvent('conversion', conversionType, JSON.stringify(details), value);
};

// Funnel tracking
export const trackFunnelStep = (funnelName, stepName, stepNumber, details = {}) => {
  if (!shouldTrack()) return;
  
  trackEvent('funnel_step', funnelName, `${stepName}_${stepNumber}`, stepNumber);
  if (Object.keys(details).length > 0) {
    trackEvent('funnel_details', funnelName, JSON.stringify(details));
  }
};

// A/B testing support
export const trackExperiment = (experimentId, variant, details = {}) => {
  if (!shouldTrack()) return;
  
  trackEvent('experiment_view', 'ab_testing', `${experimentId}_${variant}`);
  if (Object.keys(details).length > 0) {
    trackEvent('experiment_details', 'ab_testing', JSON.stringify(details));
  }
};

// Session and user journey tracking
export const trackSessionStart = (sessionId, source = 'direct') => {
  if (!shouldTrack()) return;
  
  trackEvent('session_start', 'user_journey', source);
  trackEvent('session_id', 'user_journey', sessionId);
};

export const trackSessionEnd = (sessionDuration, pagesViewed) => {
  if (!shouldTrack()) return;
  
  trackEvent('session_end', 'user_journey', null, sessionDuration);
  trackEvent('pages_viewed', 'user_journey', null, pagesViewed);
};

// Ahrefs-specific tracking functions
export const trackAhrefsEvent = (eventName, eventData = {}) => {
  if (!shouldTrack() || !isAhrefsEnabled()) return;
  
  const dataLayer = ensureDataLayer();
  
  // Push Ahrefs event to dataLayer for GTM integration
  dataLayer.push({
    'event': 'ahrefs_event',
    'ahrefs_event_name': eventName,
    'ahrefs_event_data': eventData,
  });
  
  if (window.ahrefs) {
    console.log('Ahrefs custom event:', eventName, eventData);
  }
};

// GTM-specific tracking functions
export const pushGTMEvent = (eventName, eventData = {}) => {
  if (!shouldTrack() || !isGTMEnabled()) return;
  
  const dataLayer = ensureDataLayer();
  dataLayer.push({
    'event': eventName,
    ...eventData,
  });
};

// Enhanced GTM event with custom parameters
export const pushGTMEventWithParameters = (eventName, eventData = {}, customParameters = {}) => {
  if (!shouldTrack() || !isGTMEnabled()) return;
  
  const dataLayer = ensureDataLayer();
  dataLayer.push({
    'event': eventName,
    ...eventData,
    'custom_parameters': customParameters,
  });
};

// Check if GTM is loaded and ready
export const isGTMReady = () => {
  return typeof window !== 'undefined' && 
         window.dataLayer && 
         isGTMEnabled() && 
         shouldTrack();
};

// Get current dataLayer for debugging
export const getDataLayer = () => {
  return ensureDataLayer();
};

/*
USAGE EXAMPLES:

// Set user properties when user logs in
import { setUserProperties } from '../utils/analytics';
const handleLogin = (user) => {
  setUserProperties(user.id, {
    plan: user.subscription?.plan || 'free',
    role: user.role,
    accountType: user.accountType
  });
};

// Track subscription
import { trackSubscription } from '../utils/analytics';
const handleSubscription = (plan) => {
  trackSubscription(plan.name, plan.price, plan.billingCycle);
};

// Track feature usage
import { trackFeatureUsage } from '../utils/analytics';
const handleBlogGeneration = () => {
  trackFeatureUsage('blog_generation', { 
    template_used: 'seo_optimized',
    word_count: 1500 
  });
};

// Track funnel steps
import { trackFunnelStep } from '../utils/analytics';
const handleSignupStep = (step) => {
  trackFunnelStep('signup', step.name, step.number, { 
    time_spent: step.duration 
  });
};

// Track experiments
import { trackExperiment } from '../utils/analytics';
const handleExperimentView = (experimentId, variant) => {
  trackExperiment(experimentId, variant, { 
    page: 'landing',
    user_type: 'new' 
  });
};

// Ahrefs-specific tracking
import { trackAhrefsEvent } from '../utils/analytics';
const handleAhrefsTracking = () => {
  trackAhrefsEvent('custom_action', { 
    action_type: 'button_click',
    page_section: 'hero' 
  });
};

// GTM-specific tracking
import { pushGTMEvent } from '../utils/analytics';
const handleGTMEvent = () => {
  pushGTMEvent('custom_gtm_event', { 
    event_category: 'engagement',
    event_action: 'scroll',
    event_label: 'page_bottom' 
  });
};

// Enhanced GTM tracking with custom parameters
import { pushGTMEventWithParameters } from '../utils/analytics';
const handleEnhancedGTMEvent = () => {
  pushGTMEventWithParameters('enhanced_event', {
    event_category: 'engagement',
    event_action: 'form_submit'
  }, {
    form_type: 'contact',
    user_segment: 'premium'
  });
};
*/ 