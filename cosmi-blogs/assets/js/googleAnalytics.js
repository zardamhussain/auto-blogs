(function() {
    // Replace with your tracking ID
    const trackingId = "G-JFNF9XEFRY";
  
    // Google Analytics setup for Universal Analytics
    if (trackingId.startsWith('UA-')) {
      (function(i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function() {
          (i[r].q = i[r].q || []).push(arguments);
        }, i[r].l = 1 * new Date(); a = s.createElement(o),
          m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m);
      })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
  
      ga('create', trackingId, 'auto');
      ga('send', 'pageview');
  
      window.logPageView = function() {
        ga('set', 'page', window.location.pathname);
        ga('send', 'pageview');
      };
  
      window.triggerGAEvent = function(category, action, label, value) {
        ga('send', 'event', category, action, label, value);
      };
    }
  
    // Google Analytics setup for GA4
    if (trackingId.startsWith('G-')) {
      (function(w, d, s, l, i) {
        w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
        j.async = true; j.src = 'https://www.googletagmanager.com/gtag/js?id=' + i + dl; f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', trackingId);
  
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', trackingId);
  
      window.logPageView = function() {
        gtag('event', 'page_view', {
          page_path: window.location.pathname
        });
      };
  
      window.triggerGAEvent = function(category, action, label, value) {
        gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value
        });
      };
    }
  })();