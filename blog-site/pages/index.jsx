import Link from 'next/link';
import { sanityClient } from '../lib/sanity';
import { postListQuery } from '../lib/queries';
import { NextSeo } from 'next-seo';
import ClientDate from '../components/ClientDate';

export default function Home({ posts }) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <NextSeo title="Home" description="Latest posts from Auto Blogs." />
      <h1 className="text-4xl font-display font-bold mb-8 text-center">
        Latest Posts
      </h1>
      <div className="space-y-8">
        {posts?.map((post) => (
          <Link key={post._id} href={`/blog/en/${post.slug}`} className="block p-6 bg-bg-surface rounded-lg hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-2xl font-bold text-text-primary">{post.title}</h2>
            <p className="text-text-muted mt-2">{post.metaDescription}</p>
            <p className="text-sm text-text-muted mt-4">
              <ClientDate date={post.publishedAt} />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const posts = await sanityClient.fetch(postListQuery);
  return {
    props: {
      posts,
    },
    revalidate: 60, // Re-generate the page every 60 seconds
  };
} 