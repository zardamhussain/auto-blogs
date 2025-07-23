import React from 'react';
import { Helmet } from 'react-helmet-async';

const HeadMeta = ({ title, description, url, imageUrl, type = 'website' }) => {
  const siteName = 'OutBlogs';
  const fullTitle = `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      <link rel='canonical' href={url} />

      {/* Open Graph tags for social media */}
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:url' content={url} />
      <meta property='og:image' content={imageUrl} />
      <meta property='og:type' content={type} />
      <meta property='og:site_name' content={siteName} />

      {/* Twitter Card tags */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={imageUrl} />
    </Helmet>
  );
};

export default HeadMeta; 