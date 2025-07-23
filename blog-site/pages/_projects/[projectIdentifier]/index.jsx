import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import ClientDate from '../../../components/ClientDate';
import Loader from '@/components/Loader';

const ProjectHomePage = ({ project, posts, debugMode, languages }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState(
    languages && languages.includes('en') ? 'en' : (languages && languages.length > 0 ? languages[0] : 'en')
  );
  const postsPerPage = 9;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router.events]);

  if (router.isFallback || isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader /></div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  // Use project-specific domain or fallback
  const projectDomain = project.domain || `${process.env.NEXT_PUBLIC_SITE_URL}/_projects/${project.id}`;
  
  // Filter posts by selected language
  const filteredPosts = posts
    .map(post => {
      if (selectedLanguage === 'en') {
        return post;
      } else if (post.translations && Array.isArray(post.translations)) {
        const translation = post.translations.find(t => t.language_code === selectedLanguage);
        if (translation) {
          // Return a post-like object with translation fields
          return {
            ...post,
            title: translation.title || post.title,
            content: translation.content || post.content,
            // Optionally override other fields if needed
            language_code: translation.language_code,
          };
        }
        // If no translation, skip this post
        return null;
      }
      // If no translations array, skip this post
      return null;
    })
    .filter(Boolean);

  // Pagination logic (use filteredPosts)
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  // Function to parse frontmatter from content
  const parseFrontmatter = (content) => {
    if (!content) return {};
    
    const lines = content.split('\n');
    const frontmatter = {};
    let inFrontmatter = false;
    let frontmatterEnd = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
        } else {
          frontmatterEnd = i;
          break;
        }
      } else if (inFrontmatter && line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        frontmatter[key.trim()] = value;
      }
    }
    
    return { frontmatter, frontmatterEnd };
  };

  // Function to calculate reading time
  const calculateReadingTime = (content) => {
    if (!content) return null;
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  };

  // Structured data for project home page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": project.name,
    "url": projectDomain,
    "description": project.description || `Blog posts from ${project.name}`,
    "publisher": {
      "@type": "Organization",
      "name": project.name,
      "url": projectDomain,
      "logo": {
        "@type": "ImageObject",
        "url": project.logo_url || `${projectDomain}/logo.png`
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${projectDomain}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <Head>
        {/* Basic SEO Meta Tags */}
        <title>{`${project.name} - Blog`}</title>
        <meta name="description" content={project.description || `Latest blog posts and insights from ${project.name}`} />
        <meta name="author" content={project.name} />
        <link rel="canonical" href={projectDomain} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={`${project.name} - Blog`} />
        <meta property="og:description" content={project.description || `Latest blog posts and insights from ${project.name}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={projectDomain} />
        <meta property="og:image" content={project.logo_url} />
        <meta property="og:site_name" content={project.name} />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${project.name} - Blog`} />
        <meta name="twitter:description" content={project.description || `Latest blog posts and insights from ${project.name}`} />
        <meta name="twitter:image" content={project.logo_url} />
        
        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      
      <Layout
        project={project}
        languages={languages}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      >
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Project Title and Stats Row */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
              <div className="flex-1">
                <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {project.name}
                </h1>
                
                {/* Project Description */}
                {project.description && (
                  <p className={`text-lg md:text-xl leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {project.description}
                  </p>
                )}
              </div>
              
              {/* Stats - Right Side */}
              <div className="flex flex-col space-y-2 mt-4 lg:mt-0 lg:ml-8">
                <span className={`px-3 py-1 rounded-full border text-center lg:text-left ${
                  theme === 'dark' 
                    ? 'bg-black border-gray-800 text-gray-300' 
                    : 'bg-gray-100 border-gray-200 text-gray-600'
                }`}>
                  {posts.length} articles {debugMode ? 'total' : 'published'}
                </span>
                {project.created_at && (
                  <span className={`px-3 py-1 rounded-full border text-center lg:text-left ${
                    theme === 'dark' 
                      ? 'bg-black border-gray-800 text-gray-300' 
                      : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}>
                    Since <ClientDate date={project.created_at} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Blog Posts Grid */}
          <div className="max-w-7xl mx-auto px-6 pb-8">
            {currentPosts.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                  {currentPosts.map((post) => {
                    // Parse frontmatter and content
                    const { frontmatter, frontmatterEnd } = parseFrontmatter(post.content);
                    const contentWithoutFrontmatter = post.content ? 
                      post.content.split('\n').slice(frontmatterEnd + 1).join('\n') : '';
                    
                    // Extract data with frontmatter priority
                    let title = frontmatter.title || post.title || 'Untitled';
                    let description = frontmatter.description || frontmatter.excerpt || post.description || post.excerpt || '';
                    let featuredImage = frontmatter.featured_image || post.featured_image;
                    let date = post.created_at;
                    let readingTime = frontmatter.reading_time || post.reading_time || calculateReadingTime(contentWithoutFrontmatter);
                    let tags = frontmatter.tags ? frontmatter.tags.split(',').map(tag => tag.trim()) : [];
                    let author = frontmatter.author || post.author;
                    let category = frontmatter.category || post.category;

                    // If no description from frontmatter, extract from content
                    if (!description && contentWithoutFrontmatter) {
                      const lines = contentWithoutFrontmatter.split('\n');
                      for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed && !trimmed.startsWith('#') && trimmed.length > 20) {
                          description = trimmed.substring(0, 150) + (trimmed.length > 150 ? '...' : '');
                          break;
                        }
                      }
                    }

                    return (
                      <article key={post.id} className="group">
                        <Link href={`/blog/${selectedLanguage}/${post.slug}`}>
                          <div className={`relative rounded-xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] ${
                            theme === 'dark' 
                              ? 'bg-black border-gray-800 hover:border-gray-700' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}>
                            {/* Featured Image */}
                            {featuredImage && (
                              <div className="aspect-video overflow-hidden">
                                <img 
                                  src={featuredImage} 
                                  alt={title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            
                            {/* Content */}
                            <div className="p-6">
                              <h2 className={`text-xl font-semibold mb-3 transition-colors duration-200 line-clamp-2 ${
                                theme === 'dark' 
                                  ? 'text-white group-hover:text-gray-300' 
                                  : 'text-gray-900 group-hover:text-blue-600'
                              }`}>
                                {title}
                              </h2>
                              
                              {/* Tags */}
                              {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className={`px-2 py-1 text-xs rounded ${
                                      theme === 'dark' 
                                        ? 'bg-gray-900 text-gray-400' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {tag}
                                    </span>
                                  ))}
                                  {tags.length > 3 && (
                                    <span className={`px-2 py-1 text-xs rounded ${
                                      theme === 'dark' 
                                        ? 'bg-gray-900 text-gray-400' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      +{tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {description && (
                                <p className={`mb-4 line-clamp-3 leading-relaxed ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {description}
                                </p>
                              )}
                              
                              {/* Meta */}
                              <div className="flex items-center justify-between text-sm">
                                <time dateTime={date} className={`px-2 py-1 rounded ${
                                  theme === 'dark' 
                                    ? 'bg-gray-900 text-gray-300' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <ClientDate date={date} />
                                </time>
                                <div className="flex items-center space-x-2">
                                  {readingTime && (
                                    <span className={`px-2 py-1 rounded ${
                                      theme === 'dark' 
                                        ? 'bg-gray-900 text-gray-300' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {readingTime} min read
                                    </span>
                                  )}
                                  {category && (
                                    <span className={`px-2 py-1 rounded ${
                                      theme === 'dark' 
                                        ? 'bg-gray-900 text-gray-300' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        theme === 'dark'
                          ? 'bg-black border border-gray-800 text-gray-300 hover:bg-gray-900'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : theme === 'dark'
                                ? 'bg-black border border-gray-800 text-gray-300 hover:bg-gray-900'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        theme === 'dark'
                          ? 'bg-black border border-gray-800 text-gray-300 hover:bg-gray-900'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <h2 className={`text-2xl font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  No posts yet
                </h2>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  Check back soon for new articles.
                </p>
              </div>
            )}
          </div>

          {/* Debug Info at Bottom */}
          {debugMode && (
            <div className="max-w-7xl mx-auto px-6 pb-8">
              <div className={`rounded-lg p-4 border ${
                theme === 'dark' 
                  ? 'bg-black border-gray-800' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-yellow-600 font-semibold">🔧 DEBUG MODE</span>
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Showing all posts regardless of status
                  </span>
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>Total posts: {posts.length}</p>
                  <p>Post statuses: {[...new Set(posts.map(p => p.status))].join(', ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default ProjectHomePage;

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { projectIdentifier } = params;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8020';

  // Debug flag - set to true to show all posts regardless of status
  const DEBUG_SHOW_ALL_POSTS = false;

  const projectUrl = `${API_BASE_URL}/projects/${projectIdentifier}`;
  const postsUrl = `${API_BASE_URL}/blogs/posts/${projectIdentifier}`;
  const languagesUrl = `${API_BASE_URL}/projects/${projectIdentifier}/languages`;

  // console.log('🔍 DEBUG: Starting getStaticProps for project:', projectIdentifier);
  console.log('🔍 DEBUG: Project URL:', projectUrl);
  console.log('🔍 DEBUG: Posts URL:', postsUrl);
  // console.log('🔍 DEBUG: Show all posts (debug mode):', DEBUG_SHOW_ALL_POSTS);

  try {
    const [projectRes, postsRes, languagesRes] = await Promise.all([
      fetch(projectUrl),
      fetch(postsUrl),
      fetch(languagesUrl)
    ]);

    console.log('🔍 DEBUG: Project response status:', projectRes.status);
    console.log('🔍 DEBUG: Posts response status:', postsRes.status);

    if (!projectRes.ok) {
      console.log('❌ DEBUG: Project fetch failed with status:', projectRes.status);
      if (projectRes.status === 404) return { notFound: true };
      throw new Error(`Failed to fetch project data: ${projectRes.status}`);
    }

    const project = await projectRes.json();
    // console.log('✅ DEBUG: Project data received:', JSON.stringify(project, null, 2));

    let posts = [];
    let languages = ['en'];

    if (postsRes.ok) {
      posts = await postsRes.json();
      // console.log('✅ DEBUG: Posts data received:', JSON.stringify(posts, null, 2));
      console.log('📊 DEBUG: Total posts before filtering:', posts.length);
      
      // Show all posts if debug mode is enabled, otherwise filter for published only
      if (!DEBUG_SHOW_ALL_POSTS) {
        posts = posts.filter(post => post.status === 'published' || post.status === 'PUBLISHED');
        console.log('📊 DEBUG: Published posts after filtering:', posts.length);
      } else {
        console.log('🔧 DEBUG: Debug mode - showing all posts regardless of status');
        console.log('📊 DEBUG: Post statuses found:', [...new Set(posts.map(p => p.status))]);
      }
    } else {
      console.log('❌ DEBUG: Posts fetch failed with status:', postsRes.status);
      // console.log('❌ DEBUG: Posts response text:', await postsRes.text());
    }

    if (languagesRes.ok) {
      languages = await languagesRes.json();
    }

    const finalProps = {
      project,
      posts,
      debugMode: DEBUG_SHOW_ALL_POSTS,
      languages,
    };

    // console.log('🎯 DEBUG: Final props being returned:', JSON.stringify(finalProps, null, 2));

    return {
      props: finalProps,
      revalidate: 60,
    };
  } catch (error) {
    console.error('💥 DEBUG: Error in getStaticProps:', error);
    return { notFound: true };
  }
} 