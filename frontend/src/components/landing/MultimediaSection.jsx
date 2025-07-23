import React from 'react';
import { FaYoutube, FaHeadphones, FaPlayCircle, FaImage } from 'react-icons/fa';

const MultimediaSection = () => {
  // Generate a random waveform array for visual effect
  const waveform = Array.from({ length: 60 }, () => Math.floor(Math.random() * 20) + 4);

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800 overflow-hidden">
      <div className="container mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Create Content That Captivates
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              In today's digital landscape, plain text isn't enough. OutBlogs automatically enriches your articles with multimedia to boost engagement and keep readers hooked.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-red-500 text-white">
                    <FaYoutube className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Automatic Video Embedding</h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Our AI intelligently finds and embeds relevant YouTube videos directly into your articles, increasing watch time.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-600 text-white">
                    <FaHeadphones className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Powered Audio Blogs (Coming Soon)</h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Cater to your audience on the go with natural-sounding audio versions of your articles.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Blog Post Mockup with depth and annotations */}
          <div className="relative h-96 flex items-center justify-center overflow-hidden">
             <div className="relative w-full max-w-lg">
                {/* Background card for depth */}
                <div className="absolute w-full h-full bg-white dark:bg-gray-700/50 rounded-xl shadow-lg transform rotate-[-2deg] top-0 left-0"></div>

                {/* Main card */}
                <div 
                  className="relative z-10 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6"
                  style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  }}
                >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">The Future of Renewable Energy</h3>
                    <div className="flex items-center space-x-2 mt-3 mb-4">
                        <span className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 dark:bg-purple-900 dark:text-purple-200 rounded-full">English</span>
                        <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 dark:bg-gray-600 dark:text-gray-200 rounded-full">Español</span>
                        <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 dark:bg-gray-600 dark:text-gray-200 rounded-full">中文</span>
                    </div>

                    {/* Audio Player Mockup */}
                    <div className="relative flex items-center space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <FaPlayCircle className="h-10 w-10 text-purple-600 dark:text-purple-400 cursor-pointer"/>
                        <div className="flex items-center space-x-1 w-full h-8">
                            {waveform.map((height, i) => (
                                <div key={i} className="w-1 rounded-full bg-purple-300 dark:bg-purple-500" style={{ height: `${height}px` }}></div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <div className="h-2 w-5/6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    </div>
                </div>
                
                {/* Popping-out element */}
                <div className="hidden lg:block absolute -top-4 -left-8 z-20 flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                    <FaImage className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Branded Images</span>
                </div>

                {/* Arrow annotation */}
                <div className="hidden lg:block absolute -bottom-16 right-4 z-20">
                    <svg width="85" height="55" viewBox="0 0 85 55" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-500">
                        <path d="M2.36015 52.4849C10.2368 44.8016 26.6341 32.593 43.1493 25.1093C59.6644 17.6256 72.8443 12.822 82.204 11.0543" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M74.1942 2.00001C76.9069 5.03774 80.4285 8.1691 82.2039 11.0543C78.3149 14.1205 73.8115 16.4866 70.3633 18.2381" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="-mt-2 text-sm text-right font-semibold text-purple-500">AI-Powered Audio</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MultimediaSection; 