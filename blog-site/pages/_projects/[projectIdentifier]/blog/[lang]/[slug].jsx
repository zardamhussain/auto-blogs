import { useRouter } from 'next/router';
import Head from 'next/head';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Layout from '@/components/Layout';
import ClientDate from '@/components/ClientDate';
import { useCallback } from 'react';

const BlogPostPage = ({ mdxSource, frontmatter, project, lang, languages = ['en'] }) => {
  const router = useRouter();
  const langCode = router.query.lang || lang || 'en';

  // Handler to change language and navigate to the same post in the new language
  const handleLanguageChange = useCallback(
    (newLang) => {
      if (newLang === langCode) return;
      router.push({
        pathname: router.pathname,
        query: { ...router.query, lang: newLang },
      });
    },
    [router, langCode]
  );

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  if (!project || !mdxSource) {
    return <div>Error loading page data. Please try again later.</div>;
  }

  const title = frontmatter?.title || 'Untitled Post';
  const description = frontmatter?.description || frontmatter?.excerpt || `Read about ${title} on ${project.name}`;
  const keywords = frontmatter?.keywords?.join(', ') || '';
  const tags = frontmatter?.tags?.join(', ') || '';

  const projectDomain = project.domain || `${process.env.NEXT_PUBLIC_SITE_URL}/_projects/${project.id}`;
  const canonicalUrl = `${projectDomain}/blog/${langCode}/${router.query.slug}`;

  console.log('🔍 DEBUG: Project domain:', projectDomain);
  console.log('🔍 DEBUG: Canonical URL:', canonicalUrl);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Organization",
      "name": project.name,
      "url": projectDomain,
      "logo": {
        "@type": "ImageObject",
        "url": project.logo_url || `${projectDomain}/logo.png`
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": project.name,
      "url": projectDomain,
      "logo": {
        "@type": "ImageObject",
        "url": project.logo_url || `${projectDomain}/logo.png`
      }
    },
    "datePublished": frontmatter?.date || new Date().toISOString(),
    "dateModified": frontmatter?.last_modified || frontmatter?.date || new Date().toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "image": frontmatter?.featured_image || project.logo_url,
    "keywords": keywords,
    "articleSection": frontmatter?.category || "Blog",
    "wordCount": mdxSource.compiledSource?.length || 0,
    "timeRequired": frontmatter?.reading_time ? `PT${frontmatter.reading_time}M` : undefined,
    "inLanguage": "en-US",
    "isAccessibleForFree": true
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": projectDomain
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": project.name,
        "item": projectDomain
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": canonicalUrl
      }
    ]
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": project.name,
    "url": projectDomain,
    "logo": {
      "@type": "ImageObject",
      "url": project.logo_url || `${projectDomain}/logo.png`
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={frontmatter?.featured_image || project.logo_url} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }} />
      </Head>
      <Layout
        project={project}
        languages={languages}
        selectedLanguage={langCode}
        onLanguageChange={handleLanguageChange}
        showProgressBar={true}
      >
        <article className="prose dark:prose-invert max-w-4xl mx-auto py-8">
          <h1>{title}</h1>
          {frontmatter?.date && (
            <p className="text-sm text-gray-500"><ClientDate date={frontmatter.date} /></p>
          )}
          {frontmatter?.featured_image && (
            <img src={frontmatter.featured_image} alt={title} className="my-4 rounded-lg" />
          )}
          <MDXRemote {...mdxSource} />
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
              <span>
                Last updated:{' '}
                <ClientDate date={frontmatter?.last_modified || frontmatter?.date} />
              </span>
              {frontmatter?.reading_time && (
                <span>Reading time: {frontmatter.reading_time} min</span>
              )}

              </div>
              <div className="flex items-center space-x-2"></div>
            </div>
          </div>
        </article>
      </Layout>
    </>
  );
};

export default BlogPostPage;

export async function getStaticPaths() {
  // Fetch all projects and their blog slugs, then generate paths for each with lang='en'
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8020';
  let paths = [];
  try {
    // Fetch all projects
    const projectsRes = await fetch(`${API_BASE_URL}/projects`);
    if (!projectsRes.ok) throw new Error('Failed to fetch projects');
    const projects = await projectsRes.json();
    for (const project of projects) {
      const postsRes = await fetch(`${API_BASE_URL}/blogs/posts/${project.id}`);
      if (!postsRes.ok) continue;
      const posts = await postsRes.json();
      for (const post of posts) {
        paths.push({
          params: {
            projectIdentifier: project.id,
            lang: 'en',
            slug: post.slug,
          },
        });
      }
    }
  } catch (e) {
    // fallback to empty paths
    paths = [];
  }
  return {
    paths,
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { projectIdentifier, slug, lang } = params;
  const language = lang || 'en';
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8020';

  const projectUrl = `${API_BASE_URL}/projects/${projectIdentifier}`;
  const postUrl = `${API_BASE_URL}/blogs/projects/${projectIdentifier}/lang/${language}/slug/${slug}`;
  const languagesUrl = `${API_BASE_URL}/projects/${projectIdentifier}/languages`;

  console.log('🔍 [getStaticProps] Params:', params);
  console.log('🔍 [getStaticProps] Project URL:', projectUrl);
  console.log('🔍 [getStaticProps] Post URL:', postUrl);

  try {
    const [projectRes, postRes, languagesRes] = await Promise.all([
      fetch(projectUrl),
      fetch(postUrl),
      fetch(languagesUrl)
    ]);

    console.log('🔍 [getStaticProps] Project response status:', projectRes.status);
    console.log('🔍 [getStaticProps] Post response status:', postRes.status);

    if (!projectRes.ok || !postRes.ok) {
        if (projectRes.status === 404 || postRes.status === 404) return { notFound: true };
        throw new Error(`Failed to fetch data`);
    }

    const project = await projectRes.json();
    const postData = await postRes.json();
    let languages = ['en'];
    if (languagesRes && languagesRes.ok) {
      languages = await languagesRes.json();
    }
    console.log('🔍 [getStaticProps] Project data:', project);
    console.log('🔍 [getStaticProps] Post data:', postData);
    
    let rawContent = postData.raw_post?.content || '';
    const frontmatterTitle = postData.raw_post?.frontmatter?.title || '';
    if (frontmatterTitle && rawContent.trim().startsWith(`# ${frontmatterTitle}`)) {
      rawContent = rawContent.split('\n').slice(1).join('\n').trim();
    } else if (frontmatterTitle && rawContent.trim().startsWith(`# ${frontmatterTitle}\n`)) {
      rawContent = rawContent.split('\n').slice(1).join('\n').trim();
    }

    const mdxSource = await serialize(rawContent, {
      parseFrontmatter: true,
    });

    return {
      props: {
        project, 
        mdxSource,
        frontmatter: mdxSource.frontmatter,
        lang: language,
        languages,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('💥 [getStaticProps] Error:', error);
    return { notFound: true };
  }
}