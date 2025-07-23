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
    
    // Fetch specific project to get domain
    const projectResponse = await fetch(`${API_BASE_URL}/projects/${projectId}`);
    if (!projectResponse.ok) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = await projectResponse.json();

    // Use project-specific domain or fallback
    const baseUrl = project.domain || `${process.env.NEXT_PUBLIC_SITE_URL}/_projects/${projectId}`;
  
    const robotsTxt = `User-agent: *
Allow: /

# Project-specific sitemap
Sitemap: ${baseUrl}/api/sitemap?projectId=${projectId}

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Disallow admin and API routes
Disallow: /api/
Disallow: /_next/
Disallow: /admin/

# Allow important pages for this project
Allow: /blog/*
Allow: /

# Google specific
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Bing specific
User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Project: ${project.name}
# Domain: ${baseUrl}`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.status(200).send(robotsTxt);

  } catch (error) {
    console.error('Error generating project robots.txt:', error);
    res.status(500).json({ error: 'Error generating robots.txt' });
  }
} 