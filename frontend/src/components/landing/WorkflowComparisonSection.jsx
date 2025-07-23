import React from 'react';
import { FaArrowRight, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ToolPill = ({ name, cost }) => (
    <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg mb-2">
        <span className="font-semibold text-gray-800 dark:text-gray-200">{name}</span>
        <span className="text-sm text-red-500 dark:text-red-400">{cost}</span>
    </div>
);

const OutcomePill = ({ name }) => (
    <div className="flex items-center p-3 bg-green-100/50 dark:bg-green-900/50 rounded-lg mb-2">
        <FaCheckCircle className="h-5 w-5 text-green-500 mr-3" />
        <span className="font-semibold text-gray-800 dark:text-gray-200">{name}</span>
    </div>
);


const WorkflowComparisonSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Stop Juggling Tools. Start Dominating SERPs.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your current content workflow is a tangled, expensive mess. It's time to evolve.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* The Old Way */}
            <div className="p-8 border-2 border-red-400/30 bg-red-50/20 dark:bg-red-900/10 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <FaTimesCircle className="h-8 w-8 text-red-500"/>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">The Old, Broken Workflow</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">A chaotic, expensive mix of subscriptions and manual work.</p>
                <ToolPill name="Ahrefs / SEMRush" cost="$199/mo" />
                <ToolPill name="SurferSEO / Frase" cost="$129/mo" />
                <ToolPill name="ChatGPT Plus" cost="$20/mo" />
                <ToolPill name="Freelance Writer" cost="$500/article" />
                <ToolPill name="Manual Analytics" cost="Hours/week" />
            </div>

            {/* The New Way */}
            <div className="p-8 border-2 border-green-400/30 bg-green-50/20 dark:bg-green-900/10 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <FaCheckCircle className="h-8 w-8 text-green-500"/>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">The OutBlogs Engine</h3>
                </div>
                 <p className="text-gray-600 dark:text-gray-400 mb-6">One platform, one price. It's your new AI employee that loves to see you win.</p>
                <OutcomePill name="Finds Competitor Blindspots" />
                <OutcomePill name="Writes Content That Ranks" />
                <OutcomePill name="Optimizes in Real-Time" />
                <OutcomePill name="Builds Topical Authority" />
                <OutcomePill name="Tracks Your ROI" />
            </div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowComparisonSection; 