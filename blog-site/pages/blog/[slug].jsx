import { useRouter } from 'next/router';
import Head from 'next/head';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Layout from '@/components/Layout';
import ClientDate from '@/components/ClientDate';

const BlogPostPage = ({ mdxSource, frontmatter, project }) => {
  const router = useRouter();

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

  console.log('🔍 DEBUG: Project domain::', process.env.NEXT_PUBLIC_SITE_URL);
  const projectDomain = project.domain || `${process.env.NEXT_PUBLIC_SITE_URL}/_projects/${project.id}`;
  const canonicalUrl = `${projectDomain}/blog/${router.query.slug}`;

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
      <Layout project={project} showProgressBar={true}>
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
  // You should implement fetching all slugs for the project here
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { projectIdentifier, slug } = params;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8020';

  const projectUrl = `${API_BASE_URL}/projects/${projectIdentifier}`;
  const postUrl = `${API_BASE_URL}/blogs/projects/${projectIdentifier}/lang/en/slug/${slug}`;

  try {
    const [projectRes, postRes] = await Promise.all([
      fetch(projectUrl),
      fetch(postUrl)
    ]);

    if (!projectRes.ok || !postRes.ok) {
        if (projectRes.status === 404 || postRes.status === 404) return { notFound: true };
        throw new Error(`Failed to fetch data`);
    }

    const project = await projectRes.json();
    const postData = await postRes.json();
    
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
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
}