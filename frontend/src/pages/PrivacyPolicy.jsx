import React from 'react';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import HeadMeta from '../components/HeadMeta';

const PrivacyPolicy = () => {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <HeadMeta
        title="Privacy Policy"
        description="Privacy Policy for OutBlogs, a service of TAIC LLC."
        url="https://outblogai.com/privacy"
      />
      <Header />
      <main className="container mx-auto px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <div className="prose dark:prose-invert max-w-none space-y-4">
            <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

            <p>
              This Privacy Policy describes the policies and procedures of TAIC LLC ("we", "our", or "us") on the collection,
              use, and disclosure of your information when you use OutBlogs (the "Service"). We use your Personal
              Data to provide and improve the Service. By using the Service, you agree to the collection and use of
              information in accordance with this Privacy Policy.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">1. Information We Collect</h2>
            <p>We may collect several different types of information for various purposes to provide and improve our Service to you.</p>
            <h3 className="text-xl font-bold pt-4 pb-1">a. Personal Data</h3>
            <p>
              While using our Service, we may ask you to provide us with certain personally identifiable information that
              can be used to contact or identify you ("Personal Data"). Personally identifiable information may include,
              but is not limited to: Email address, First name and last name, Usage Data.
            </p>
            <h3 className="text-xl font-bold pt-4 pb-1">b. Usage Data</h3>
            <p>
              Usage Data is collected automatically when using the Service. Usage Data may include information such as your
              device's Internet Protocol address (e.g., IP address), browser type, browser version, the pages of our
              Service that you visit, the time and date of your visit, the time spent on those pages, unique device
              identifiers, and other diagnostic data.
            </p>
            <h3 className="text-xl font-bold pt-4 pb-1">c. Cookies and Tracking Technologies</h3>
            <p>
              We use cookies and similar tracking technologies to track the activity on our Service and hold certain
              information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being
              sent. However, if you do not accept cookies, you may not be able to use some parts of our Service.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">2. How We Use Your Information</h2>
            <p>TAIC LLC uses the collected data for various purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our Service.</li>
              <li>To notify you about changes to our Service.</li>
              <li>To allow you to participate in interactive features of our Service when you choose to do so.</li>
              <li>To provide customer support.</li>
              <li>To gather analysis or valuable information so that we can improve our Service.</li>
              <li>To monitor the usage of our Service.</li>
              <li>To detect, prevent and address technical issues.</li>
            </ul>

            <h2 className="text-2xl font-bold pt-6 pb-2">3. Data Retention and Deletion</h2>
            <p>
              We will retain your Personal Data only for as long as is necessary for the purposes set out in this
              Privacy Policy. You may request the deletion of your personal data by contacting us.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">4. Disclosure of Your Information</h2>
            <p>
              We may disclose your Personal Data in the good faith belief that such action is necessary to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
                <li>To comply with a legal obligation.</li>
                <li>To protect and defend the rights or property of TAIC LLC.</li>
                <li>To prevent or investigate possible wrongdoing in connection with the Service.</li>
                <li>To protect the personal safety of users of the Service or the public.</li>
                <li>To protect against legal liability.</li>
            </ul>

            <h2 className="text-2xl font-bold pt-6 pb-2">5. Security of Your Data</h2>
            <p>
              The security of your data is important to us but remember that no method of transmission over the Internet,
              or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to
              protect your Personal Data, we cannot guarantee its absolute security.
            </p>
            
            <h2 className="text-2xl font-bold pt-6 pb-2">6. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
              Changes to this Privacy Policy are effective when they are posted on this page.
            </p>

            <h2 className="text-2xl font-bold pt-6 pb-2">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, you can contact us:
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

export default PrivacyPolicy; 