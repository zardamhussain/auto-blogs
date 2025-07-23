import React, { useState, useEffect } from 'react';
import { FaGoogle, FaSafari, FaConnectdevelop, FaChartLine, FaTrophy } from 'react-icons/fa';
import { SiBrave, SiNaver } from 'react-icons/si';

const searchEngines = [
    { name: 'Google', icon: <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-8 inline-block -mt-1" />, IconComp: FaGoogle },
    { name: 'Perplexity', icon: <span className="font-bold">Perplexity</span>, IconComp: FaConnectdevelop },
    { name: 'Naver', icon: <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/Naver_Logotype.svg" alt="Naver" className="h-6 inline-block" />, IconComp: SiNaver },
    { name: 'Safari', icon: <span className="font-bold">Safari</span>, IconComp: FaSafari },
    { name: 'Brave', icon: <img src="https://brave.com/static-assets/images/brave-logo-text-dark.svg" alt="Brave" className="h-8 inline-block -mt-1" />, IconComp: SiBrave },
];

const MiniGraphCard = ({ title, metric, graphPath, icon: Icon }) => (
    <div className="w-full bg-white/80 dark:bg-gray-800/50 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-4">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-grow">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{metric}</p>
        </div>
        <div className="w-20 h-10">
            <svg width="100%" height="100%" viewBox="0 0 50 25" preserveAspectRatio="none">
                <path d={graphPath} fill="none" stroke="#10B981" strokeWidth="2.5" />
            </svg>
        </div>
    </div>
);

const SpeedSection = () => {
    const [currentEngineIndex, setCurrentEngineIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentEngineIndex(prevIndex => (prevIndex + 1) % searchEngines.length);
        }, 2500);
        return () => clearInterval(timer);
    }, []);

    const floatingIcons = [
        { Icon: FaGoogle, position: "top-5 left-5", size: "h-12 w-12", color: "text-red-500" },
        { Icon: SiBrave, position: "top-16 right-0", size: "h-13 w-13", color: "text-orange-500" },
        { Icon: FaSafari, position: "bottom-5 left-16", size: "h-8 w-8", color: "text-blue-500" },
        { Icon: SiNaver, position: "bottom-12 right-5", size: "h-5 w-5", color: "text-green-500" },
        { Icon: FaConnectdevelop, position: "top-1/3 left-0", size: "h-6 w-6", color: "text-purple-500" },
    ];

    return (
        <section className="py-24 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="container mx-auto px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Built for Speed, Loved by {searchEngines[currentEngineIndex].icon}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Site speed is a critical ranking factor. A slow blog is an invisible blog. That's why every OutBlogs site is built on a high-performance foundation, ensuring your pages load instantly for users and search engines.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column: Score Card and Floating Icons */}
                    <div className="relative flex justify-center items-center h-80">
                        <div className="absolute w-72 h-72 bg-purple-200 dark:bg-purple-900/50 rounded-full blur-3xl"></div>
                        
                        {floatingIcons.map(({ Icon, position, size, color }, index) => (
                            <div key={index} className={`hidden lg:block absolute ${position} ${color} transition-all duration-500 hover:scale-125 animate-float-slow`}>
                                <Icon className={size} />
                            </div>
                        ))}

                        <div 
                            className="relative w-72 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl p-6 transform-gpu lg:transform-gpu lg:perspective-1200 lg:rotate-y-10 lg:rotate-x-2"
                        >
                            <div className="flex flex-col items-center justify-center h-full border-2 border-white/20 rounded-lg">
                                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Performance Score</p>
                                <h3 className="text-7xl font-bold text-gray-900 dark:text-white my-2">
                                    100<span className="text-5xl text-gray-400 dark:text-gray-500">/100</span>
                                </h3>
                                <p className="text-lg font-semibold text-gray-800 dark:text-white mt-2">Lightning Fast</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Impact Row */}
                    <div className="flex flex-col gap-6">
                        <MiniGraphCard 
                            title="Average Traffic Growth"
                            metric="+250%"
                            icon={FaChartLine}
                            graphPath="M 0 25 C 10 25, 20 5, 50 5"
                        />
                        <MiniGraphCard 
                            title="Keyword Ranking"
                            metric="#1 Position"
                            icon={FaTrophy}
                            graphPath="M 0 25 L 10 22 L 20 15 L 30 10 L 40 5 L 50 2"
                        />
                         <div className="p-6 mt-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">Your Competitive Edge</h4>
                          <p className="mt-2 text-gray-600 dark:text-gray-300">
                            With OutBlogs, you don't need to be a technical expert to have a lightning-fast website. We handle the complexity, so you get the ranking benefits automatically.
                          </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SpeedSection; 