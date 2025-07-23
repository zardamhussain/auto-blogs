import '../styles/globals.css';
import { DefaultSeo } from 'next-seo';
import SEO from '../next-seo.config';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '../context/ThemeContext'; // Import the provider
import { Inter, Lora } from 'next/font/google';
import { useRouter } from 'next/router';
import Loader from '../components/Loader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
});

function MyApp({ Component, pageProps }) {
  const platformGaId = process.env.NEXT_PUBLIC_GA_ID;
  const clientGaId = pageProps.project?.gaId;
  const projectId = pageProps.project?.id; // Extract project ID from props

  // Global loader state
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router.events]);

  useEffect(() => {
    const handleAnalyticsClick = (event) => {
      let targetElement = event.target;
      while (targetElement && targetElement !== document.body) {
        const eventName = targetElement.getAttribute('data-analytics-event');
        if (eventName) {
          const eventParams = {
            // Automatically add project_id to all custom click events
            ...(projectId && { project_id: projectId }),
          };
          for (const attr of targetElement.attributes) {
            if (attr.name.startsWith('data-analytics-param-')) {
              const paramName = attr.name.replace('data-analytics-param-', '');
              eventParams[paramName] = attr.value;
            }
          }
          window.gtag('event', eventName, eventParams);
          return;
        }
        targetElement = targetElement.parentElement;
      }
    };

    document.addEventListener('click', handleAnalyticsClick);

    return () => {
      document.removeEventListener('click', handleAnalyticsClick);
    };
  }, [projectId]); // Re-run if projectId changes between pages

  const trackingIds = [platformGaId, clientGaId].filter(Boolean);

  const buildGaScript = () => {
    // Add project_id to the config object to include it with the initial page_view event.
    const configParams = projectId ? `, { 'project_id': '${projectId}' }` : '';
    const configCommands = trackingIds.map(id => `gtag('config', '${id}'${configParams});`).join('\n');

    return `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      ${configCommands}
    `;
  };

  return (
    <ThemeProvider>
      {/* Reverting to a simpler main wrapper */}
      <main className={`${inter.variable} ${lora.variable}`}> 
        {/* Global Loader Overlay */}
        {isLoading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Loader />
          </div>
        )}
        {/* 
        Only render analytics scripts if at least one tracking ID is present.
        We load the main gtag.js library using the first available ID.
      */}
      {trackingIds.length > 0 && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${trackingIds[0]}`}
          />
          <Script
            id="google-analytics-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: buildGaScript() }}
          />
        </>
      )}

      <DefaultSeo {...SEO} />
      <Component {...pageProps} />
      </main>
    </ThemeProvider>
  );
}

export default MyApp; 