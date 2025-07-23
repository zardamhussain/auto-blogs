import React from 'react';
import { FaUserTie, FaBuilding, FaBullseye, FaChartLine, FaClipboardList, FaUsers, FaDollarSign, FaRocket, FaCheckCircle } from 'react-icons/fa';

const MiniGraph = ({ title, color }) => (
  <div className="mt-auto pt-6">
      <p className="text-sm font-semibold text-center text-gray-800 dark:text-gray-200 mb-3">{title}</p>
      <div className="w-full h-24 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 flex items-end">
          <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none" className="overflow-visible">
              <defs>
                  <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
              </defs>
              <path d="M 0 50 L 10 40 L 30 42 L 50 25 L 70 20 L 90 10 L 100 0" fill="none" stroke={color} strokeWidth="2" />
              <path d="M 0 50 L 10 40 L 30 42 L 50 25 L 70 20 L 90 10 L 100 0 V 50 H 0 Z" fill={`url(#gradient-${color.replace('#', '')})`} />
          </svg>
      </div>
  </div>
);


const personas = [
  {
    icon: <FaUserTie className="h-8 w-8" />,
    title: 'The Ambitious Founder',
    description: "You're building a category-defining company and need to scale your authority yesterday.",
    solutions: [
        { icon: <FaRocket className="text-green-500" />, text: 'Build a powerful inbound marketing engine' },
        { icon: <FaChartLine className="text-green-500" />, text: 'Generate qualified leads on autopilot' },
        { icon: <FaDollarSign className="text-green-500" />, text: 'Get enterprise-level content on a budget' },
    ],
    graph: { title: "Organic Traffic", color: "#8B5CF6" }
  },
  {
    icon: <FaBuilding className="h-8 w-8" />,
    title: 'The Lean Marketing Team',
    description: 'You have aggressive traffic goals but lack the headcount to run a full-scale content operation.',
    solutions: [
        { icon: <FaClipboardList className="text-green-500" />, text: 'Automate content briefs & first drafts' },
        { icon: <FaChartLine className="text-green-500" />, text: 'Dominate keywords, not just compete' },
        { icon: <FaRocket className="text-green-500" />, text: 'Free up your team for high-level strategy' },
    ],
    graph: { title: "Inbound Leads", color: "#6366F1" }
  },
  {
    icon: <FaBullseye className="h-8 w-8" />,
    title: 'The SEO Agency',
    description: 'You need to deliver consistent, high-quality results for your clients without ballooning your overhead.',
    solutions: [
        { icon: <FaDollarSign className="text-green-500" />, text: 'Increase margins on content services' },
        { icon: <FaUsers className="text-green-500" />, text: 'Scale your client-base without hiring' },
        { icon: <FaCheckCircle className="text-green-500" />, text: 'Ensure consistent quality, every time' },
    ],
    graph: { title: "Client Growth", color: "#EC4899" }
  },
];

const WhoIsItForSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Built for Builders, Not Bloggers.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            You didn't start a business to write articles. You started it to change an industry. OutBlogs is for the ambitious, the impatient—the builders who know their time is better spent on the product, not the promotion.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
          {personas.map((persona) => (
            <div
              key={persona.title}
              className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/70 dark:to-indigo-900/70 text-purple-600 dark:text-indigo-300">
                    {persona.icon}
                </div>
                <h3 className="ml-4 text-xl font-bold text-gray-900 dark:text-white">
                    {persona.title}
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {persona.description}
              </p>

              <ul className="space-y-4 mb-6">
                {persona.solutions.map((solution, index) => (
                    <li key={index} className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                            {solution.icon}
                        </div>
                        <span className="ml-3 text-gray-700 dark:text-gray-200 font-medium">{solution.text}</span>
                    </li>
                ))}
              </ul>
              
              <MiniGraph title={persona.graph.title} color={persona.graph.color} />

            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center max-w-2xl mx-auto">
            <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">
                We handle the <span className="text-purple-500">distribution</span>, so you can focus on the <span className="text-purple-500">disruption</span>.
            </h4>
        </div>

      </div>
    </section>
  );
};

export default WhoIsItForSection; 