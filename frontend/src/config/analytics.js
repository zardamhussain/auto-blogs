// Analytics Configuration for OutBlogs
export const ANALYTICS_CONFIG = {
  // Google Analytics
  GA_TRACKING_ID: 'G-3CGYYBY7SM',
  
  // Ahrefs Analytics
  AHREFS_TRACKING_KEY: 'qbLBBY7HYG2QDARypEFTyA',
  
  // Google Tag Manager
  GTM_CONTAINER_ID: 'GTM-W2XCJKPX',
  
  // Feature flags
  ENABLE_ANALYTICS: true,
  ENABLE_AHREFS: true,
  ENABLE_GTM: true,
  ENABLE_DEBUG_MODE: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_TRACKING: true,
  ENABLE_ERROR_TRACKING: true,
  ENABLE_USER_JOURNEY_TRACKING: true,
  
  // Privacy settings (auto-enabled until 10k users)
  // TODO: Enable consent requirements when user base grows
  REQUIRE_CONSENT: false, // Set to true when ready for GDPR compliance
  ANONYMIZE_IP: true,
  RESPECT_DNT: true, // Do Not Track
  COOKIE_EXPIRY_DAYS: 365,
  
  // Custom dimensions and metrics
  CUSTOM_DIMENSIONS: {
    USER_PLAN: 'custom_parameter_1',
    USER_ROLE: 'custom_parameter_2',
    ACCOUNT_TYPE: 'custom_parameter_3',
    FEATURE_USAGE: 'custom_parameter_4',
    WORKFLOW_TYPE: 'custom_parameter_5',
  },
  
  // Event categories
  EVENT_CATEGORIES: {
    USER_ENGAGEMENT: 'user_engagement',
    BLOG_INTERACTION: 'blog_interaction',
    WORKFLOW_INTERACTION: 'workflow_interaction',
    ECOMMERCE: 'ecommerce',
    FEATURE_ANALYTICS: 'feature_analytics',
    PERFORMANCE: 'performance',
    USER_JOURNEY: 'user_journey',
    AB_TESTING: 'ab_testing',
    FUNNEL_ANALYTICS: 'funnel_analytics',
  },
  
  // Conversion goals
  CONVERSION_GOALS: {
    SIGNUP: 'signup',
    SUBSCRIPTION: 'subscription',
    BLOG_CREATION: 'blog_creation',
    WORKFLOW_EXECUTION: 'workflow_execution',
    FEATURE_ADOPTION: 'feature_adoption',
  },
  
  // Funnel definitions
  FUNNELS: {
    SIGNUP: {
      name: 'signup',
      steps: ['landing_view', 'signup_start', 'email_entered', 'verification', 'onboarding_complete'],
    },
    BLOG_CREATION: {
      name: 'blog_creation',
      steps: ['project_selected', 'template_chosen', 'content_generated', 'published'],
    },
    WORKFLOW_SETUP: {
      name: 'workflow_setup',
      steps: ['workflow_started', 'nodes_added', 'configured', 'executed'],
    },
  },
  
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    PAGE_LOAD_TIME: 3000, // 3 seconds
    INTERACTION_DELAY: 100, // 100ms
    ERROR_RATE: 0.01, // 1%
  },
  
  // User segments
  USER_SEGMENTS: {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise',
    NEW_USER: 'new_user',
    POWER_USER: 'power_user',
    INACTIVE: 'inactive',
  },
  
  // Feature tracking
  FEATURES: {
    BLOG_GENERATION: 'blog_generation',
    WORKFLOW_BUILDER: 'workflow_builder',
    SEO_ANALYSIS: 'seo_analysis',
    CONTENT_CALENDAR: 'content_calendar',
    TEAM_COLLABORATION: 'team_collaboration',
    API_INTEGRATION: 'api_integration',
  },
};

// Environment-specific overrides
export const getAnalyticsConfig = () => {
  const config = { ...ANALYTICS_CONFIG };
  
  if (process.env.NODE_ENV === 'development') {
    config.ENABLE_DEBUG_MODE = true;
    config.GA_TRACKING_ID = 'G-DEVELOPMENT'; // Use development GA property
    config.GTM_CONTAINER_ID = 'GTM-W2XCJKPX'; // Use same GTM container for development
  }
  
  if (process.env.NODE_ENV === 'test') {
    config.ENABLE_ANALYTICS = false;
    config.ENABLE_AHREFS = false;
    config.ENABLE_GTM = false;
  }
  
  return config;
};

// Helper functions
export const isAnalyticsEnabled = () => {
  const config = getAnalyticsConfig();
  return config.ENABLE_ANALYTICS;
};

export const isAhrefsEnabled = () => {
  const config = getAnalyticsConfig();
  return config.ENABLE_AHREFS;
};

export const isGTMEnabled = () => {
  const config = getAnalyticsConfig();
  return config.ENABLE_GTM;
};

export const shouldTrackInEnvironment = () => {
  return process.env.NODE_ENV !== 'test' && isAnalyticsEnabled();
};

// Future consent management
export const shouldRequireConsent = () => {
  const config = getAnalyticsConfig();
  return config.REQUIRE_CONSENT;
}; 