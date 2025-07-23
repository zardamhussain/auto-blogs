import React from 'react';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import HeadMeta from '../components/HeadMeta';

const TermsOfService = () => {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <HeadMeta
        title="Terms of Service"
        description="Terms of Service for OutBlogs, a service of TAIC LLC."
        url="https://outblogai.com/terms"
      />
      <Header />
      <main className="container mx-auto px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <div className="prose dark:prose-invert max-w-none space-y-4">
            <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

            <p>
              Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the OutBlogs
              website (the "Service") operated by TAIC LLC ("us", "we", or "our").
            </p>
            <p>
              Your access to and use of the Service is conditioned on your acceptance of and compliance with these
              Terms. These Terms apply to all visitors, users, and others who access or use the Service.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">1. Accounts</h2>
            <p>
              When you create an account with us, you must provide us with information that is accurate, complete, and
              current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate
              termination of your account on our Service.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">2. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive
              property of TAIC LLC and its licensors. The Service is protected by copyright, trademark, and other laws
              of both the United States and foreign countries.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">3. Links To Other Web Sites</h2>
            <p>
              Our Service may contain links to third-party web sites or services that are not owned or controlled by
              TAIC LLC. We have no control over, and assume no responsibility for, the content, privacy policies, or
              practices of any third-party web sites or services.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">4. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason
              whatsoever, including without limitation if you breach the Terms.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">5. Limitation Of Liability</h2>
            <p>
              In no event shall TAIC LLC, nor its directors, employees, partners, agents, suppliers, or affiliates, be
              liable for any indirect, incidental, special, consequential or punitive damages, including without
              limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your
              access to or use of or inability to access or use the Service.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">6. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the United States, without
              regard to its conflict of law provisions.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">7. Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will
              provide at least 30 days' notice prior to any new terms taking effect.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">8. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-disc pl-6">
              <li>By email: support@outblogai.com</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService; 