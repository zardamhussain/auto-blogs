import React, { useState, useEffect } from 'react';

const companies = [
  {
    name: 'PhotoGPT',
    logo: '/photogptai.webp',
    alt: 'PhotoGPT logo',
    className: 'h-12 sm:h-14 object-contain transition-all duration-500 ease-in-out invert dark:invert-0',
  },
  {
    name: 'Dubit',
    logo: '/dubit-logo.svg',
    alt: 'Dubit logo',
    className: 'h-10 sm:h-12 object-contain transition-all duration-500 ease-in-out dark:invert',
  },
  {
    name: 'Cosmi',
    logo: '/cosmi.png',
    alt: 'Cosmi logo',
    className: 'h-12 sm:h-14 object-contain transition-all duration-500 ease-in-out dark:invert',
  },
];

const TrustedBy = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % companies.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="trusted-by" className="py-20 px-8 relative bg-white dark:bg-gray-900 scroll-mt-24">
      <div className="hidden lg:block absolute inset-0 blueprint-grid"></div>
      <div className="hidden lg:block absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

      <div className="container mx-auto text-center">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
          Trusted by the most innovative companies
        </h2>

        <div className="mt-8 hidden md:flex justify-center items-center gap-x-8 sm:gap-x-12 lg:gap-x-16">
          {companies.map((company) => (
            <img
              key={company.name}
              className={`${company.className} opacity-80 hover:opacity-100`}
              src={company.logo}
              alt={company.alt}
            />
          ))}
        </div>

        <div className="mt-8 md:hidden h-14 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full">
            {companies.map((company, index) => (
              <div
                key={company.name}
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
                  index === currentIndex ? 'opacity-80' : 'opacity-0'
                }`}
              >
                <img
                  className={company.className}
                  src={company.logo}
                  alt={company.alt}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
