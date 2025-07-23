import React from 'react';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-8 py-16">
        <div className="grid md:grid-cols-5 gap-12">
          {/* Brand and Social */}
          <div className="md:col-span-1">
            <a href="/" className="mb-4 inline-block">
              <img src="/logo.svg" alt="OutBlog Logo" className="h-8 w-auto text-gray-900 dark:text-white" />
            </a>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The AI co-pilot that writes SEO content that actually ranks.
            </p>
            <div className="flex space-x-5">
              <div className="text-gray-500 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <FaXTwitter size={24} />
              </div>
              <div className="text-gray-500 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <FaGithub size={24} />
              </div>
              <div className="text-gray-500 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <FaLinkedin size={24} />
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 tracking-wider uppercase">Product</h4>
            <ul className="space-y-3">
              <li><a href="#how-it-works" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">How it Works</a></li>
              <li><a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Features</a></li>
              <li><a href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Pricing</a></li>
              <li><a href="/updates" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Updates</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 tracking-wider uppercase">Company</h4>
            <ul className="space-y-3">
              <li><a href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Blog</a></li>
              <li><a href="mailto:support@outblogai.com" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Contact</a></li>
            </ul>
          </div>
          
          {/* Ventures Links */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 tracking-wider uppercase">Ventures</h4>
            <ul className="space-y-3">
              <li><a href="https://www.photogptai.com/" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">PhotoGPT - AI photography</a></li>
              <li><a href="https://www.cosmi.skin/" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Cosmi Skin - AI skincare</a></li>
              <li><a href="https://dubit.live/" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Dubit - Realtime live translation</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 tracking-wider uppercase">Legal</h4>
            <ul className="space-y-3">
              <li><a href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
          <p>&copy; {currentYear} OutBlogs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 