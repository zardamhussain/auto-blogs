import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaSearch, FaRobot, FaFileAlt } from 'react-icons/fa';

const ComparisonSection = () => {
  const features = [
    { name: 'Content Strategy', outblogs: true, traditional: false },
    { name: 'Keyword Research', outblogs: true, traditional: false },
    { name: 'SEO Optimization', outblogs: true, traditional: true },
    { name: 'Article Writing', outblogs: true, traditional: true },
    { name: 'Image Generation', outblogs: true, traditional: false },
    { name: 'Publishing', outblogs: true, traditional: true },
    { name: 'Cost', outblogs: 'Low & predictable', traditional: 'High & variable' },
    { name: 'Speed', outblogs: 'Minutes', traditional: 'Days or weeks' },
  ];

  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            The OutBlogs Advantage
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-16">
            See how we stack up against traditional content creation methods.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Feature</th>
                            <th className="py-4 px-6 text-center text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700">
                                <img src="/logo.svg" alt="OutBlog Logo" className="h-6 mx-auto" />
                            </th>
                            <th className="py-4 px-6 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700">
                                <div className="flex justify-center items-center gap-4 opacity-70">
                                    <FaSearch size={22} title="SEO Analysis Tools" />
                                    <FaRobot size={22} title="AI Writing Assistants" />
                                    <FaFileAlt size={22} title="Document Editors" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {features.map((feature, index) => (
                            <tr key={index} className="bg-white dark:bg-gray-800/50">
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">{feature.name}</td>
                                <td className="py-4 px-6 text-center border-l border-gray-200 dark:border-gray-700">
                                    {typeof feature.outblogs === 'boolean' ? (
                                        feature.outblogs ? <FaCheckCircle className="h-6 w-6 text-green-500 mx-auto" /> : <FaTimesCircle className="h-6 w-6 text-red-500 mx-auto" />
                                    ) : (
                                        <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{feature.outblogs}</span>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-center border-l border-gray-200 dark:border-gray-700">
                                    {typeof feature.traditional === 'boolean' ? (
                                        feature.traditional ? <FaCheckCircle className="h-6 w-6 text-green-500 mx-auto" /> : <FaTimesCircle className="h-6 w-6 text-red-500 mx-auto" />
                                    ) : (
                                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature.traditional}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {features.map((feature, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3">{feature.name}</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">OutBlogs</span>
                                {typeof feature.outblogs === 'boolean' ? (
                                    feature.outblogs ? <FaCheckCircle className="h-5 w-5 text-green-500" /> : <FaTimesCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">{feature.outblogs}</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-600 dark:text-gray-400">Traditional</span>
                                {typeof feature.traditional === 'boolean' ? (
                                    feature.traditional ? <FaCheckCircle className="h-5 w-5 text-green-500" /> : <FaTimesCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                    <span className="text-gray-600 dark:text-gray-300">{feature.traditional}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection; 