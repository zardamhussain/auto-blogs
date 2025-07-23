import { useEffect, useState } from 'react';
import Header from './Header';

const ProgressBar = () => {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const scrollPosition = window.scrollY;
      const progress = totalHeight > 0 ? (scrollPosition / totalHeight) * 100 : 0;
      setScroll(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50 }}>
      <div
        style={{
          height: '4px',
          width: `${scroll}%`,
          background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
          transition: 'width 0.2s',
        }}
      />
    </div>
  );
};

const Layout = ({ project, children, languages = ['en'], selectedLanguage = 'en', onLanguageChange, showProgressBar = false }) => {
  if (!project) {
    // A fallback layout for pages that may not have project data yet,
    // or for a potential future global marketing site.
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header project={project} languages={languages} selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange} />
      {showProgressBar && <ProgressBar />}
      <main className="flex-grow">{children}</main>
    </div>
  );
};

export default Layout; 