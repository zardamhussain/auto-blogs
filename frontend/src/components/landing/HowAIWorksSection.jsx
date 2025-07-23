import React from 'react';
import { FaSearch, FaClipboardList, FaPencilAlt, FaCloudUploadAlt } from 'react-icons/fa';

const HowAIWorksSection = () => {
  const steps = [
    {
      icon: <FaSearch className="h-8 w-8 text-white" />,
      title: '1. Analysis & Strategy',
      description: 'We don\'t just guess. Our AI analyzes the top-ranking articles for your target keyword to understand search intent and identify strategic content gaps.',
    },
    {
      icon: <FaClipboardList className="h-8 w-8 text-white" />,
      title: '2. AI-Powered Outlining',
      description: 'Based on its analysis, the AI constructs a comprehensive, SEO-optimized outline designed to cover the topic more thoroughly than your competitors.',
    },
    {
      icon: <FaPencilAlt className="h-8 w-8 text-white" />,
      title: '3. High-Quality Content Creation',
      description: 'Our fine-tuned language model writes a long-form, engaging, and high-quality article based on the strategic outline, ready to capture and hold reader attention.',
    },
    {
      icon: <FaCloudUploadAlt className="h-8 w-8 text-white" />,
      title: '4. Instant Publishing',
      description: 'The final, ready-to-rank article is published directly to your blog, complete with professional formatting and relevant images. From idea to live in minutes.',
    },
  ];

  return (
    <section id="how-ai-works" className="py-24 bg-white dark:bg-gray-900 relative scroll-mt-24">
      <div className="hidden lg:block absolute inset-0 blueprint-grid"></div>
      <div className="hidden lg:block absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      
      <div className="container mx-auto px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            A Glimpse Inside Our AI Engine
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Our process is more than just writing. It's a strategic workflow designed for ranking.
          </p>
        </div>

        <div className="relative mt-20">
          {/* Vertical connecting line */}
          <div className="hidden md:block absolute left-1/2 -ml-px w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative mb-12 md:mb-20">
              <div className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                {/* Icon */}
                <div className="w-full md:w-1/2 flex justify-center md:justify-start">
                    <div className={`relative ${index % 2 === 0 ? 'md:ml-auto md:mr-12' : 'md:mr-auto md:ml-12'}`}>
                        <div className="relative z-10 flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
                            {/* Inner shadow for depth */}
                            <div className="absolute inset-0 rounded-full" style={{boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.2)'}}></div>
                            {step.icon}
                        </div>
                        {/* Glow effect */}
                        <div className="absolute -inset-2 rounded-full bg-purple-500 opacity-20 blur-lg"></div>
                    </div>
                </div>
                
                {/* Content */}
                <div className={`w-full md:w-1/2 mt-6 md:mt-0 ${index % 2 === 0 ? 'md:pl-12 text-center md:text-left' : 'md:pr-12 text-center md:text-right'}`}>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowAIWorksSection; 