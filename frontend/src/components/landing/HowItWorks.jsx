import React from "react";
import { useAuth } from "../../context/AuthContext"; // Import useAuth
import { trackEvent } from "../../utils/analytics";

const HowItWorks = () => {
  const { signInWithGoogle } = useAuth();

  const handleCtaClick = () => {
    trackEvent('cta_click', 'engagement', 'how_it_works_dominate', 1);
    signInWithGoogle();
  };

  const steps = [
    {
      title: "Step 1: Calibrate the Engine",
      description: "Connect your website and OutBlogs instantly learns your brand voice, analyzes your competitors, and identifies the keywords your customers are searching for.",
      visual: (
        <div className="w-full text-center p-4">
          <h4 className="font-semibold text-gray-700">
            Connect your website
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Publish your new blog post automatically.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between p-2 bg-white border rounded-lg">
              <span className="font-semibold text-sm text-black">
                yourwebsite.com
              </span>
              <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">
                Connected
              </span>
            </div>
          </div>
          <button
            className="w-full mt-4 py-3 font-semibold text-white bg-purple-600 rounded-lg flex items-center justify-center gap-2"
            disabled
          >
            Connect Now
          </button>
        </div>
      )
    },
    {
      title: "Step 2: Deploy Your Content Strategy",
      description: "With one click, deploy a 30-day content plan designed to capture high-value keywords and systematically steal traffic from your competitors.",
      visual: (
        <div className="flex justify-center items-start space-x-2">
          <div className="w-1/2 p-3 bg-white border border-gray-200 rounded-lg text-center">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-black">4</span>
              <span className="text-xs font-semibold text-purple-500">
                Sat
              </span>
            </div>
            <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
              Published
            </span>
            <p className="mt-2 text-sm text-black">
              how to write blog posts
            </p>
            <p className="mt-1 text-xs text-gray-500">Volume: 2154</p>
            <p className="text-xs text-gray-500">Difficulty: 9</p>
            <button
              className="w-full mt-2 py-2 text-sm font-semibold text-white bg-gray-800 rounded-md"
              disabled
            >
              Visit Article
            </button>
          </div>
          <div className="w-1/2 p-3 bg-white border border-gray-200 rounded-lg opacity-60 text-center">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-black">5</span>
              <span className="text-xs font-semibold text-purple-500">
                Sun
              </span>
            </div>
            <p className="mt-2 text-sm text-black">how to monetize b...</p>
            <p className="mt-1 text-xs text-gray-500">Volume: 1950</p>
            <p className="text-xs text-gray-500">Difficulty: 12</p>
          </div>
        </div>
      )
    },
    {
      title: "Step 3: Automate Your Authority",
      description: "Articles are automatically written, optimized, and published directly to your blog. You don't lift a finger. You just watch your rankings climb.",
      visual: (
        <div className="w-full text-center">
          <div className="w-10 h-10 mx-auto mb-4 bg-green-400 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white transform -rotate-45"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-700">
            Publish to your website
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Your article is live and ready to rank.
          </p>
          <div className="flex items-center justify-center mt-1 text-lg font-bold text-gray-900">
            <span>yourwebsite.com</span>
            <svg
              className="w-6 h-6 ml-2 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <button
            className="w-full mt-4 py-3 font-semibold text-white bg-purple-600 rounded-lg flex items-center justify-center gap-2"
            disabled
          >
            View Live Post
          </button>
        </div>
      )
    }
  ];

  return (
    <section id="how-it-works" className="bg-white dark:bg-gray-900 font-sans py-24 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-sm font-semibold tracking-widest text-purple-600 uppercase">
              The Path to Victory
            </p>
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mt-4">
              Your 3-Step Path to Market Domination
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-6">
              Our process is designed for one thing: to make you the undisputed authority in your field. Here’s how you’ll start winning.
            </p>
        </div>


        {/* Steps Section */}
        <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700" style={{transform: 'translateY(-50%)', zIndex: 0}}></div>

            <div className="grid md:grid-cols-3 gap-12 relative">
            {steps.map((step, index) => (
                <div key={index} className="text-center relative z-10">
                    <div className="mb-6 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg flex items-center justify-center min-h-[280px]">
                        {step.visual}
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                        {step.title}
                    </h3>
                    <p className="text-base text-gray-600 dark:text-gray-400">
                        {step.description}
                    </p>
                </div>
            ))}
            </div>
        </div>

        <div className="text-center mt-20">
            <button
              className="py-3 px-8 rounded-full font-semibold text-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity"
              onClick={handleCtaClick}
            >
              Start Dominating Your Niche &rarr;
            </button>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
