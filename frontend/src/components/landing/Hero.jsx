import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CompetitorAnalysisCard from "./floating-cards/CompetitorAnalysisCard";
import KeywordResearcherCard from "./floating-cards/KeywordResearcherCard";
import SeoScoreCard from "./SeoScoreCard";
import FastestBlogPagesCard from "./floating-cards/FastestBlogPagesCard";
import BrandedImagesCard from "./floating-cards/BrandedImagesCard";
import { FaArrowUp } from "react-icons/fa";
import { trackEvent } from "../../utils/analytics";

const blogResults = [
    { 
        title: "How AI is Revolutionizing Product Photography", 
        company: "PhotoGPT", 
        logo: "https://www.photogptai.com/Assets/logo/logoNew.webp",
        metric: "Ranking #1",
        image: "https://images.unsplash.com/photo-1520004434532-668416487153?q=80&w=2080&auto=format&fit=crop"
    },
    { 
        title: "Breaking Language Barriers with Live Audio Translation", 
        company: "Dubit", 
        logo: "/dubit-logo.svg",
        metric: "+300% Engagement",
        image: "https://images.unsplash.com/photo-1557825835-b4527f242af7?q=80&w=2070&auto=format&fit=crop"
    },
    { 
        title: "The Future of Skincare: AI-Personalized Routines", 
        company: "Cosmi",
        logo: "https://www.cosmi.skin/images/cosmi_signature.png",
        metric: "+150% Conversions",
        image: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=2070&auto=format&fit=crop"
    },
    { 
        title: "Dogfooding Our Way to the Top of Google", 
        company: "OutBlogs",
        logo: "/logo.svg",
        metric: "Page 1 in 3 Weeks",
        image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop"
    },
    { 
        title: "How We Built a Content Engine That Sells Itself", 
        company: "OutBlogs",
        logo: "/logo.svg",
        metric: "2x Organic Traffic",
        image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop"
    },
];

const BlogResultCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % blogResults.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);
    
    return (
        <div className="absolute bottom-[-5rem] left-0 right-0 h-48 z-20">
            <div className="relative w-full h-full flex items-center justify-center">
                {blogResults.map((item, index) => {
                    const offset = (index - currentIndex + blogResults.length) % blogResults.length;
                    let transform = '';
                    let opacity = 0;
                    let zIndex = 0;

                    if (offset === 0) { // Center item
                        transform = 'scale(1) translateX(0)';
                        opacity = 1;
                        zIndex = 10;
                    } else if (offset === 1) { // Right item
                        transform = 'scale(0.8) translateX(80%) rotateY(-15deg)';
                        opacity = 0.5;
                        zIndex = 5;
                    } else if (offset === blogResults.length - 1) { // Left item
                        transform = 'scale(0.8) translateX(-80%) rotateY(15deg)';
                        opacity = 0.5;
                        zIndex = 5;
                    } else { // Hidden items
                        transform = 'scale(0.7) translateX(0)';
                        opacity = 0;
                    }

                    // Mobile view: only show the current item
                    const mobileClasses = index === currentIndex ? 'opacity-100' : 'opacity-0';

                    return (
                        <div 
                            key={index}
                            className={`absolute w-full max-w-md lg:max-w-xl h-full transition-all duration-700 ease-in-out lg:opacity-100 ${mobileClasses}`}
                            style={{ 
                                transform: window.innerWidth >= 1024 ? transform : 'none', 
                                opacity: window.innerWidth < 1024 ? (index === currentIndex ? 1 : 0) : opacity,
                                zIndex
                            }}
                        >
                            <div className="relative w-full h-full p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex items-end">
                                <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <div className="relative z-10 w-full">
                                    <p className="font-bold text-white text-lg">{item.title}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <img src={item.logo} alt={`${item.company} logo`} className="h-6 invert dark:invert-0 brightness-0 dark:brightness-100" />
                                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/80 text-white rounded-full">
                                            <FaArrowUp className="h-3 w-3"/>
                                            <span className="text-sm font-bold">{item.metric}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Hero = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSignInClick = (buttonType) => {
    trackEvent('cta_click', 'engagement', `hero_${buttonType}`, 1);
    signInWithGoogle();
  };

  const handleDashboardClick = () => {
    trackEvent('navigation_click', 'engagement', 'hero_dashboard', 1);
    navigate("/dashboard");
  };

  return (
    <section className="relative text-center py-40 px-8 bg-white dark:bg-gray-900 overflow-visible font-sans">
      <div className="hidden lg:block absolute inset-0 blueprint-grid" style={{ maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, transparent 30%, black 100%)' }}></div>
      <div className="hidden lg:block absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

      <div className="hidden lg:block">
        <CompetitorAnalysisCard position="top-28 left-[15%]" animation="animate-float" rotation="transform -rotate-12 scale-90 opacity-90" />
        <KeywordResearcherCard position="top-24 right-[12%]" animation="animate-float-slow" rotation="transform rotate-12 scale-95 opacity-95" />
        <SeoScoreCard position="top-1/2 left-[8%]" animation="animate-float-fast" rotation="transform rotate-6" />
        <FastestBlogPagesCard position="bottom-28 right-[10%]" animation="animate-float" rotation="transform -rotate-12 scale-90 opacity-90" />
        <BrandedImagesCard position="bottom-32 left-[18%]" animation="animate-float-slow" rotation="transform rotate-12 scale-80 opacity-80" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6">
          The Unfair Advantage.
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600">
            Rank #1 on Google, Automatically.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          Writing is easy. Distribution is hard.
        </p>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8 break-words">
          OutBlogs is an automated engine that turns your expertise into #1 ranked articles, making you the undeniable authority in your niche.
        </p>
        <div className="flex flex-col items-center gap-6">
          <div className="w-full px-4 sm:px-0 flex flex-col sm:flex-row items-center justify-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <button onClick={handleDashboardClick} className="w-full sm:w-auto py-3 px-8 rounded-full text-lg font-semibold flex items-center justify-center gap-3 text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity">
                    Go to console &rarr;
                  </button>
                ) : (
                  <>
                    <button onClick={() => handleSignInClick('google_join')} className="w-full sm:w-auto py-3 px-6 rounded-full text-lg font-semibold flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="w-6 h-6" />
                      Join with Google
                    </button>
                    <button onClick={() => handleSignInClick('claim_advantage')} className="w-full sm:w-auto py-3 px-8 rounded-full text-lg font-semibold flex items-center justify-center gap-3 text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity">
                      Claim Your Unfair Advantage &rarr;
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex justify-center items-center gap-4 mt-4">
            <div className="flex -space-x-4">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Happy customer of OutBlogs" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 object-cover"/>
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Happy customer of OutBlogs" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 object-cover"/>
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Happy customer of OutBlogs" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 object-cover"/>
                <img src="https://randomuser.me/api/portraits/men/41.jpg" alt="Happy customer of OutBlogs" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 object-cover"/>
                <img src="https://randomuser.me/api/portraits/women/52.jpg" alt="Happy customer of OutBlogs" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 object-cover"/>
            </div>
            <div className="text-left">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}
              </div>
              <p className="m-0 text-sm font-medium text-gray-600 dark:text-gray-400">
                13k+ Articles Created
              </p>
            </div>
          </div>
        </div>
      </div>
      <BlogResultCarousel />
    </section>
  );
};

export default Hero;
