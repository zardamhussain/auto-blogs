import React from "react";
import {
  FaRobot,
  FaShieldAlt,
  FaBullhorn,
  FaImages,
  FaChartLine,
  FaGlobeAmericas
} from "react-icons/fa";

const FeaturesSection = () => {
  const features = [
    {
      icon: <FaRobot className="h-8 w-8 text-white" />,
      title: "Automated Authority",
      description: "Generate expert-level articles that establish you as the #1 voice in your niche, automatically.",
      keyword: "AI Content Generation",
    },
    {
      icon: <FaShieldAlt className="h-8 w-8 text-white" />,
      title: "Your Voice, Amplified",
      description: "Our AI learns your unique style, ensuring every article is a perfect extension of your brand.",
      keyword: "Brand Voice AI",
    },
    {
      icon: <FaChartLine className="h-8 w-8 text-white" />,
      title: "Perfection on Every Page",
      description: "Every heading, link, and image is perfectly optimized. Stop thinking about checklists, start thinking about your business.",
      keyword: "SEO Optimization",
    },
    {
      icon: <FaImages className="h-8 w-8 text-white" />,
      title: "Multimedia Content",
      description: "Keep readers engaged with automatically embedded videos and (soon) audio versions of your articles.",
      keyword: "Video & Audio SEO",
    },
     {
      icon: <FaBullhorn className="h-8 w-8 text-white" />,
      title: "Effortless Distribution",
      description: "Schedule and publish content directly to your blog, turning your website into a traffic-generating machine.",
      keyword: "Automated Publishing",
    },
    {
      icon: <FaGlobeAmericas className="h-8 w-8 text-white" />,
      title: "Global Domination",
      description: "Instantly translate and localize your content to rank in any country and capture an international audience.",
      keyword: "Multilingual SEO",
    },
  ];
  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-800 relative">
        <div className="absolute inset-0 blueprint-grid"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-800"></div>

        <div className="container mx-auto px-8 relative">
            <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                    Your Arsenal for Market Domination
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    OutBlogs isn't a tool, it's a complete distribution engine. Each feature is designed to give you an unfair advantage in the race to the top of Google.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                {features.map((feature, index) => (
                    <div key={index} className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl">
                        <div className="relative inline-block">
                            <div className="relative z-10 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600">
                                {feature.icon}
                            </div>
                            <div className="absolute -inset-2 rounded-full bg-purple-500 opacity-20 blur-lg"></div>
                        </div>
                        <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">{feature.title}</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default FeaturesSection; 