import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

const Header = ({ project, languages = ['en'], selectedLanguage = 'en', onLanguageChange }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="py-4 px-6 md:px-8 border-b bg-white/50 border-gray-200 dark:bg-black/50 dark:border-gray-800 sticky top-0 z-10 backdrop-blur-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href={`/`} passHref legacyBehavior>
          <a className="flex items-center space-x-3">
            {project.logo_url && (
              <img src={project.logo_url} alt={`${project.name} Logo`} className="h-8 w-8 object-contain" />
            )}
            <span className="text-xl font-semibold text-gray-800 dark:text-white">{project.name}</span>
          </a>
        </Link>

        <div className="flex items-center space-x-4">
          {/* Language Dropdown - improved UI */}
          <div className="relative flex items-center">
            <GlobeAltIcon className="h-5 w-5 text-gray-400 dark:text-gray-300 mr-2 hidden sm:inline" />
            <label htmlFor="header-language-select" className="sr-only sm:not-sr-only sm:mr-2 font-medium text-gray-700 dark:text-gray-300 text-sm">Language</label>
            <select
              id="header-language-select"
              value={selectedLanguage}
              onChange={e => onLanguageChange && onLanguageChange(e.target.value)}
              className={`appearance-none px-3 py-2 rounded-md border bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm font-medium pr-8 min-w-[80px]`}
              aria-label="Select language"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
            {/* Dropdown arrow */}
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-6 w-6" />
            ) : (
              <MoonIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 