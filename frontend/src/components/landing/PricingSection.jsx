import React, { useState, useEffect, useRef } from 'react';
import { FaCheckCircle, FaArrowRight, FaInfoCircle } from 'react-icons/fa';

const FeatureItem = ({ children, tooltipText, popular }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const modalRef = useRef(null);

    const checkClasses = popular ? "h-6 w-6 text-white" : "h-6 w-6 text-green-500";
    const textClasses = popular ? "ml-3 text-base text-purple-100" : "ml-3 text-base text-gray-700 dark:text-gray-300";
    const iconClasses = popular ? "h-4 w-4 text-purple-200" : "h-4 w-4 text-gray-400";

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsModalOpen(false);
            }
        };
        if (isModalOpen) {
            document.body.classList.add('overflow-hidden');
            document.addEventListener('mousedown', handleOutsideClick);
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => {
            document.body.classList.remove('overflow-hidden');
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isModalOpen]);

    return (
        <li className="flex items-start">
            <div className="flex-shrink-0">
                <FaCheckCircle className={checkClasses} aria-hidden="true" />
            </div>
            <p className={textClasses}>{children}</p>
            {tooltipText && (
                <>
                    <div 
                        className="flex items-center ml-1 cursor-pointer"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <FaInfoCircle className={iconClasses} />
                    </div>

                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
                            <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full transform transition-all duration-300 scale-100">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Feature Details</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">{tooltipText}</p>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </li>
    );
};

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const tiers = [
    {
        name: 'Free',
        id: 'tier-free',
        href: '#',
        price: { monthly: 0, annually: 0 },
        description: 'For individuals & hobbyists getting started.',
        features: [
          { text: '2 blogs per month' },
          { text: '+ 3 Bonus blogs on signup' },
          { text: 'Standard AI generation' },
          { text: 'Basic SEO suggestions' },
        ],
        cta: 'Start for Free',
        popular: false,
    },
    {
      name: 'Starter',
      id: 'tier-starter',
      href: '#',
      price: { monthly: 49, annually: 490 },
      description: 'For creators ready to scale their content.',
      features: [
        { text: '15 blogs per month' },
        { text: 'Advanced AI generation' },
        { text: 'High-quality image generation' },
        { text: 'Advanced SEO optimization' },
        { text: 'Competitor analysis' },
      ],
      cta: 'Get Started',
      popular: false,
      valueContext: 'vs. $800/mo for a writer'
    },
    {
      name: 'Pro',
      id: 'tier-pro',
      href: '#',
      price: { monthly: 99, annually: 990 },
      originalPrice: { monthly: 199 },
      description: 'For serious bloggers & marketers who want to rank.',
      features: [
        { text: '30 blogs per month' },
        { text: 'Everything in Starter, plus:' },
        { text: 'Automated Internal Linking' },
        { text: 'Multi-language Support (10+)' },
        { text: 'Priority support' },
      ],
      cta: 'Get Started with Pro',
      popular: false,
      badge: 'Limited Time Offer',
      valueContext: 'vs. $1,500/mo for a content team'
    },
    {
      name: 'Scale',
      id: 'tier-scale',
      href: '#',
      price: { monthly: 599, annually: 5990 },
      originalPrice: { monthly: 999 },
      description: 'The all-in-one solution for businesses that want to dominate.',
      features: [
        { text: 'Unlimited blogs & content plans' },
        { text: 'Our Best AI (Proprietary Model)', tooltip: 'Our most advanced AI, trained on a massive dataset for superior quality and nuance.' },
        { text: 'Full SEO & Content Strategy Suite' },
        { text: 'Multi-language Support (100+)' },
        { text: 'Dedicated Account Manager' },
        // { text: 'API Access', tooltip: 'Integrate OutBlogs with your existing tools and workflows for seamless automation.' },
        { text: 'Priority Support (< 1-hour response)' },
      ],
      cta: 'Choose Scale Plan',
      popular: true,
      badge: 'Best Value',
      valueContext: 'vs. $5,000+/mo for an agency'
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-gray-900 scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl mb-4">The Right Plan for Your Growth</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Start for free, then choose a plan that's right for you. Get 2 months free with any annual plan.
          </p>
          <div className="flex justify-center">
            <div className="relative flex p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
              <button onClick={() => setBillingCycle('monthly')} className={`w-1/2 px-6 py-2 text-sm font-semibold rounded-full transition-colors ${billingCycle === 'monthly' ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                Monthly
              </button>
              <div className="relative">
                <button onClick={() => setBillingCycle('annually')} className={`w-full px-6 py-2 text-sm font-semibold rounded-full transition-colors ${billingCycle === 'annually' ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    Annually
                </button>
                <span className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/4 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Save 20%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-20 max-w-7xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-4 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-8 flex flex-col h-full shadow-lg ${
                tier.popular ? 'bg-purple-600 text-white transform lg:-translate-y-4' : 'bg-white dark:bg-gray-800'
              }`}
            >
              {tier.badge && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <span className={`text-xs font-semibold px-4 py-1 rounded-full uppercase tracking-wider ${
                    tier.popular ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'
                  }`}>
                    {tier.badge}
                  </span>
                </div>
              )}
              <div className="flex-grow">
                <h3 className={`text-2xl font-semibold ${tier.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{tier.name}</h3>
                <p className={`mt-2 h-12 ${tier.popular ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'}`}>{tier.description}</p>
                <div className="mt-6 flex items-baseline">
                  {tier.originalPrice?.monthly && billingCycle === 'monthly' && (
                    <span className={`text-3xl line-through mr-2 ${tier.popular ? 'text-purple-300' : 'text-gray-400'}`}>
                      ${tier.originalPrice.monthly}
                    </span>
                  )}
                  <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${tier.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    ${tier.price[billingCycle]}
                  </span>
                  {tier.price.monthly > 0 && <span className={`ml-1 text-xl font-semibold ${tier.popular ? 'text-purple-200' : 'text-gray-500'}`}>/mo</span>}
                </div>
                {tier.valueContext && (
                    <div className="mt-2">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${tier.popular ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                            {tier.valueContext}
                        </span>
                    </div>
                )}
                
                <ul role="list" className="mt-8 space-y-4">
                  {tier.features.map((feature, index) => (
                    <FeatureItem key={index} tooltipText={feature.tooltip} popular={tier.popular}>
                        {feature.text}
                    </FeatureItem>
                  ))}
                </ul>
              </div>

              {tier.name === 'Scale' && (
                <div className="mt-6 text-center">
                    <p className="text-sm font-bold text-yellow-300">Only 3 Spots Left This Month!</p>
                </div>
              )}

              <div className="mt-8">
                <a
                  href={tier.href}
                  className={`block w-full text-center rounded-lg py-3 text-base font-semibold transition-colors ${
                    tier.popular
                      ? 'bg-white text-purple-600 hover:bg-purple-50'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {tier.cta} <FaArrowRight className="inline-block ml-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 