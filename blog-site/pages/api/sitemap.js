export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8020';
    
    // Fetch specific project
    const projectResponse = await fetch(`${API_BASE_URL}/projects/${projectId}`);
    if (!projectResponse.ok) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = await projectResponse.json();

    // Build project-specific sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

    // Use project-specific domain or fallback
    const baseUrl = project.domain || `${process.env.NEXT_PUBLIC_SITE_URL}/_projects/${projectId}`;

    // Project landing page
    sitemap += `
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date(project.updated_at || project.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Fetch blog posts for this specific project
    try {
      const postsResponse = await fetch(`${API_BASE_URL}/blogs/projects/${projectId}/posts`);
      if (postsResponse.ok) {
        const posts = await postsResponse.json();

        for (const post of posts) {
          sitemap += `
  <url>
    <loc>${baseUrl}/blog/en/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at || post.created_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    ${post.featured_image ? `<image:image>
      <image:loc>${post.featured_image}</image:loc>
      <image:title>${post.title}</image:title>
    </image:image>` : ''}
  </url>`;
        }
      }
    } catch (error) {
      console.error(`Error fetching posts for project ${projectId}:`, error);
    }

    sitemap += `
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.status(200).send(sitemap);

  } catch (error) {
    console.error('Error generating project sitemap:', error);
    res.status(500).json({ error: 'Error generating sitemap' });
  }
} 