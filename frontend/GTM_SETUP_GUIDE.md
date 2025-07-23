# Google Tag Manager Setup Guide for OutBlogs

This guide explains how to properly configure Google Tag Manager (GTM) for the OutBlogs application.

## GTM Container Configuration

### Container ID: `GTM-W2XCJKPX`

## Required Tags to Configure in GTM

### 1. Google Analytics 4 (GA4) Configuration Tag

**Tag Type:** Google Analytics: GA4 Configuration
**Tag ID:** `GA4-Config`

**Configuration:**
- Measurement ID: `G-3CGYYBY7SM`
- Event Parameters:
  - `anonymize_ip`: `true`
  - `page_title`: `{{Page Title}}`
  - `page_location`: `{{Page URL}}`

**Triggers:**
- All Pages (Page View)
- Custom Events (for specific tracking)

### 2. GA4 Event Tags

Create separate tags for different event types:

#### Page View Events
**Tag Type:** Google Analytics: GA4 Event
**Event Name:** `page_view`
**Parameters:**
- `page_path`: `{{Page Path}}`
- `page_title`: `{{Page Title}}`
- `page_location`: `{{Page URL}}`
- `page_referrer`: `{{Referrer}}`

#### Custom Events
**Tag Type:** Google Analytics: GA4 Event
**Event Name:** `{{Event Name}}`
**Parameters:**
- `event_category`: `{{Event Category}}`
- `event_label`: `{{Event Label}}`
- `value`: `{{Event Value}}`

### 3. Ahrefs Analytics Integration

**Tag Type:** Custom HTML
**HTML Code:**
```html
<script>
(function() {
  // Ahrefs event tracking
  if (typeof window.ahrefs !== 'undefined') {
    // Track custom Ahrefs events
    console.log('Ahrefs event:', {{Event Name}}, {{Event Data}});
  }
})();
</script>
```

**Triggers:** Custom Events with `ahrefs_event` event name

## Variables to Create

### 1. Built-in Variables
- Page URL
- Page Path
- Page Title
- Referrer
- Event Name
- Event Category
- Event Label
- Event Value

### 2. Custom Variables

#### User Properties
- `user_id` (Data Layer Variable)
- `user_plan` (Data Layer Variable)
- `user_role` (Data Layer Variable)
- `account_type` (Data Layer Variable)

#### Custom Parameters
- `custom_parameters` (Data Layer Variable)

## Triggers Configuration

### 1. All Pages
**Trigger Type:** Page View
**Fire on:** All Page Views

### 2. Custom Events
**Trigger Type:** Custom Event
**Event name:** `page_view`
**Fire on:** Custom Event

### 3. User Engagement Events
**Trigger Type:** Custom Event
**Event name:** `user_engagement`
**Fire on:** Custom Event

### 4. E-commerce Events
**Trigger Type:** Custom Event
**Event name:** `purchase`
**Fire on:** Custom Event

### 5. Feature Usage Events
**Trigger Type:** Custom Event
**Event name:** `feature_used`
**Fire on:** Custom Event

## Data Layer Events

The application pushes the following events to the dataLayer:

### Page Views
```javascript
{
  'event': 'page_view',
  'page_path': '/dashboard',
  'page_title': 'Dashboard - OutBlogs',
  'page_location': 'https://outblogs.com/dashboard',
  'page_referrer': 'https://google.com'
}
```

### Custom Events
```javascript
{
  'event': 'button_click',
  'event_category': 'engagement',
  'event_label': 'signup_button',
  'value': 1,
  'custom_event': true
}
```

### User Properties
```javascript
{
  'event': 'user_properties_set',
  'user_id': 'user123',
  'user_plan': 'pro',
  'user_role': 'admin',
  'account_type': 'business'
}
```

### E-commerce Events
```javascript
{
  'event': 'purchase',
  'transaction_id': 'order_123',
  'value': 99.99,
  'currency': 'USD',
  'items': [...]
}
```

### Ahrefs Events
```javascript
{
  'event': 'ahrefs_event',
  'ahrefs_event_name': 'custom_action',
  'ahrefs_event_data': {
    'action_type': 'button_click',
    'page_section': 'hero'
  }
}
```

## Testing and Debugging

### 1. GTM Preview Mode
1. Enable GTM Preview mode
2. Navigate to your website
3. Check that events are firing correctly
4. Verify data is being sent to GA4

### 2. Browser Console
Check for these console logs in development:
```javascript
// Analytics Status
{
  googleAnalytics: true,
  ahrefs: true,
  gtm: true,
  dataLayer: [...],
  config: {...}
}
```

### 3. Network Tab
Verify that requests are being sent to:
- Google Analytics: `https://www.google-analytics.com/g/collect`
- Ahrefs: `https://analytics.ahrefs.com/analytics.js`

## Common Issues and Solutions

### 1. Events Not Firing
- Check if GTM is loaded: `window.dataLayer`
- Verify trigger conditions
- Check for JavaScript errors

### 2. Duplicate Events
- Ensure GA4 is only configured through GTM
- Remove any direct GA4 script tags
- Check for multiple GTM containers

### 3. Missing Data
- Verify dataLayer variables are correctly mapped
- Check event parameter names
- Ensure triggers are firing

### 4. Performance Issues
- Use GTM's built-in performance monitoring
- Check for excessive event firing
- Optimize trigger conditions

## Best Practices

### 1. Event Naming
- Use consistent naming conventions
- Include event category and action
- Add descriptive labels

### 2. Data Quality
- Validate data before sending
- Use consistent parameter names
- Include relevant context

### 3. Privacy Compliance
- Enable IP anonymization
- Respect user consent
- Follow GDPR guidelines

### 4. Performance
- Minimize dataLayer size
- Use efficient triggers
- Monitor loading times

## Monitoring and Maintenance

### 1. Regular Checks
- Verify all events are firing
- Check data accuracy
- Monitor performance impact

### 2. Updates
- Keep GTM container updated
- Review and optimize tags
- Update tracking as needed

### 3. Documentation
- Maintain event documentation
- Update this guide regularly
- Document custom implementations

## Support

For GTM-related issues:
1. Check GTM debug mode
2. Review browser console
3. Verify dataLayer events
4. Test in different environments
5. Consult GTM documentation

## Notes

- All GA4 tracking should go through GTM
- Ahrefs tracking is handled separately
- Custom events should use consistent naming
- Monitor for performance impact
- Keep tracking IDs secure 