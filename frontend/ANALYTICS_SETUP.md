# Analytics Setup for OutBlogs

This document describes the analytics implementation for the OutBlogs frontend application, including Google Analytics 4 (GA4), Ahrefs Analytics, and Google Tag Manager (GTM).

## Overview

The analytics system is designed to track user behavior, conversions, and performance across all pages of outblogs.com. The implementation uses **Google Tag Manager as the primary tracking system** with the following components:

- **Google Tag Manager (GTM)**: Primary tag management and event tracking system
- **Google Analytics 4 (GA4)**: Configured through GTM for comprehensive analytics
- **Ahrefs Analytics**: SEO and traffic analytics (loaded separately)

## Architecture

### GTM-Based Implementation
- **GTM Container ID**: `GTM-W2XCJKPX`
- **GA4 Measurement ID**: `G-3CGYYBY7SM` (configured through GTM)
- **Ahrefs Tracking Key**: `qbLBBY7HYG2QDARypEFTyA`

### Data Flow
1. Application events → dataLayer
2. GTM processes dataLayer events
3. GTM sends data to GA4 and other configured services
4. Ahrefs tracks independently

## Configuration

### Analytics Configuration File
Location: `src/config/analytics.js`

Key configuration options:
- `GA_TRACKING_ID`: Google Analytics tracking ID
- `AHREFS_TRACKING_KEY`: Ahrefs Analytics tracking key
- `GTM_CONTAINER_ID`: Google Tag Manager container ID
- Feature flags for enabling/disabling specific tracking systems
- Privacy and consent settings

### Environment-Specific Settings

- **Development**: Uses same GTM container with debug logging
- **Production**: Uses production tracking IDs
- **Test**: Disables all analytics

## Implementation Details

### 1. HTML Script Tags
Location: `index.html`

The following scripts are loaded in the HTML head:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W2XCJKPX');</script>
<!-- End Google Tag Manager -->

<!-- Ahrefs Analytics -->
<script src="https://analytics.ahrefs.com/analytics.js" data-key="qbLBBY7HYG2QDARypEFTyA" async></script>
```

**Important**: GA4 is NOT loaded directly - it's configured through GTM to avoid conflicts.

### 2. Analytics Components

#### AnalyticsInitializer
Location: `src/components/AnalyticsInitializer.jsx`

- Ensures all analytics scripts are properly loaded
- Initializes GTM dataLayer and gtag function
- Provides debug logging in development mode
- Handles script loading errors gracefully

#### AnalyticsTracker
Location: `src/components/AnalyticsTracker.jsx`

- Tracks page views through GTM dataLayer
- Initializes analytics on app load
- Handles route changes

### 3. Analytics Utilities
Location: `src/utils/analytics.js`

Comprehensive tracking functions for:
- Page views (via dataLayer)
- Custom events (via dataLayer)
- User properties (via dataLayer)
- E-commerce tracking (via dataLayer)
- Feature usage (via dataLayer)
- Performance metrics (via dataLayer)
- Error tracking (via dataLayer)
- Funnel analysis (via dataLayer)
- A/B testing (via dataLayer)

## Usage Examples

### Basic Event Tracking
```javascript
import { trackEvent } from '../utils/analytics';

// Track a button click (pushes to dataLayer)
trackEvent('button_click', 'engagement', 'signup_button', 1);
```

### Page View Tracking
```javascript
import { trackPageView } from '../utils/analytics';

// Track a page view (pushes to dataLayer)
trackPageView('/dashboard', 'Dashboard - OutBlogs');
```

### User Properties
```javascript
import { setUserProperties } from '../utils/analytics';

// Set user properties after login (pushes to dataLayer)
setUserProperties(user.id, {
  plan: user.subscription?.plan || 'free',
  role: user.role,
  accountType: user.accountType
});
```

### E-commerce Tracking
```javascript
import { trackPurchase } from '../utils/analytics';

// Track a purchase (pushes to dataLayer)
trackPurchase('order_123', 99.99, 'USD', [
  { item_id: 'pro_plan', item_name: 'Pro Plan', price: 99.99 }
]);
```

### Ahrefs-Specific Tracking
```javascript
import { trackAhrefsEvent } from '../utils/analytics';

// Track custom Ahrefs events (pushes to dataLayer)
trackAhrefsEvent('custom_action', {
  action_type: 'button_click',
  page_section: 'hero'
});
```

### GTM-Specific Tracking
```javascript
import { pushGTMEvent, pushGTMEventWithParameters } from '../utils/analytics';

// Push custom GTM events
pushGTMEvent('custom_gtm_event', {
  event_category: 'engagement',
  event_action: 'scroll',
  event_label: 'page_bottom'
});

// Enhanced GTM tracking with custom parameters
pushGTMEventWithParameters('enhanced_event', {
  event_category: 'engagement',
  event_action: 'form_submit'
}, {
  form_type: 'contact',
  user_segment: 'premium'
});
```

## GTM Configuration

### Required GTM Setup
See `GTM_SETUP_GUIDE.md` for detailed GTM configuration instructions.

**Key Points:**
1. Configure GA4 through GTM (not directly)
2. Set up triggers for all dataLayer events
3. Create variables for dataLayer parameters
4. Configure Ahrefs integration through custom HTML tags

### DataLayer Events
The application pushes these events to the dataLayer:

```javascript
// Page views
{
  'event': 'page_view',
  'page_path': '/dashboard',
  'page_title': 'Dashboard - OutBlogs',
  'page_location': 'https://outblogs.com/dashboard',
  'page_referrer': 'https://google.com'
}

// Custom events
{
  'event': 'button_click',
  'event_category': 'engagement',
  'event_label': 'signup_button',
  'value': 1,
  'custom_event': true
}

// User properties
{
  'event': 'user_properties_set',
  'user_id': 'user123',
  'user_plan': 'pro',
  'user_role': 'admin',
  'account_type': 'business'
}
```

## Privacy and Consent

### Current Implementation
- Analytics are auto-enabled (no consent required)
- IP anonymization is enabled for GDPR compliance
- Do Not Track (DNT) is respected
- All tracking goes through GTM for better control

### Future Implementation
When user base grows beyond 10k users:
- Enable consent requirements (`REQUIRE_CONSENT: true`)
- Implement consent management UI
- Add opt-out mechanisms
- Use GTM's consent mode

## Testing

### Development Mode
- Analytics status is logged to console
- All tracking systems are enabled
- Debug information is available
- dataLayer events are visible in console

### Test Environment
- All analytics are disabled
- No tracking occurs during tests

### GTM Preview Mode
1. Enable GTM Preview mode
2. Navigate to your website
3. Check that events are firing correctly
4. Verify data is being sent to GA4

## Troubleshooting

### Common Issues

1. **Events not tracking**
   - Check if GTM is loaded: `window.dataLayer`
   - Verify dataLayer events in console
   - Check GTM Preview mode
   - Ensure triggers are configured in GTM

2. **Duplicate events**
   - Ensure GA4 is only configured through GTM
   - Remove any direct GA4 script tags
   - Check for multiple GTM containers

3. **Missing data**
   - Verify dataLayer variables are correctly mapped in GTM
   - Check event parameter names
   - Ensure triggers are firing in GTM

4. **GTM not loading**
   - Check network connectivity
   - Verify GTM container ID
   - Check browser console for errors

### Debug Mode
Enable debug mode in development to see analytics status:
```javascript
// Check analytics status
console.log('Analytics Status:', {
  googleAnalytics: !!window.gtag,
  ahrefs: isAhrefsEnabled(),
  gtm: isGTMEnabled() && !!window.dataLayer,
  dataLayer: window.dataLayer || []
});
```

### Network Tab
Verify that requests are being sent to:
- Google Analytics: `https://www.google-analytics.com/g/collect`
- Ahrefs: `https://analytics.ahrefs.com/analytics.js`

## Maintenance

### Regular Tasks
- Monitor analytics data quality
- Update tracking IDs when needed
- Review and optimize event tracking
- Ensure GDPR compliance
- Check GTM container performance

### Updates
- Keep GTM container updated
- Review analytics configuration regularly
- Update privacy settings as needed
- Monitor for performance impact

## Support

For analytics-related issues:
1. Check browser console for errors
2. Verify tracking IDs are correct
3. Test in GTM Preview mode
4. Review GTM configuration
5. Check dataLayer events

## Notes

- **GTM is the primary tracking system** - all events go through dataLayer
- GA4 is configured through GTM, not loaded directly
- Ahrefs tracking is handled separately but integrated via dataLayer
- Monitor GTM container performance and loading times
- Keep tracking IDs secure and environment-specific
- Use GTM's built-in debugging tools for troubleshooting

## Related Documentation

- `GTM_SETUP_GUIDE.md` - Detailed GTM configuration instructions
- `src/config/analytics.js` - Analytics configuration
- `src/utils/analytics.js` - Tracking utility functions 