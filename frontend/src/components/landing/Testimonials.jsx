import React from 'react';

const testimonials = [
  {
    quote: "OutBlogs has been a game-changer for our content strategy. We've doubled our organic traffic in just three months!",
    name: "Sarah Johnson",
    title: "Marketing Manager",
    company: "TechCorp",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    quote: "The quality of the AI-generated content is outstanding. It's well-researched, engaging, and requires minimal editing.",
    name: "Michael Chen",
    title: "Founder",
    company: "Creative Solutions",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    quote: "I was skeptical about AI content, but OutBlogs proved me wrong. Our blog is now a lead-generation machine.",
    name: "Jessica Williams",
    title: "CEO",
    company: "Innovate Inc.",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  }
];

const Testimonials = () => {
  return (
    <section className="relative py-24 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="hidden lg:block absolute inset-0 blueprint-grid z-0"></div>
      <div className="relative z-10 container mx-auto px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Don't Just Take Our Word For It</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
            See how businesses like yours are achieving their content goals with OutBlogs.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <figure key={index} className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-lg flex flex-col h-full">
              <blockquote className="flex-grow text-lg text-gray-800 dark:text-gray-200">
                <p>"{testimonial.quote}"</p>
              </blockquote>
              <figcaption className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full mr-4 object-cover" />
                <div className="flex-grow">
                  <div className="font-bold text-gray-900 dark:text-white">{testimonial.name}</div>
                  <div className="text-gray-600 dark:text-gray-400">{testimonial.title}</div>
                </div>
                <p className="font-bold text-gray-900 dark:text-white ml-4">{testimonial.company}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 