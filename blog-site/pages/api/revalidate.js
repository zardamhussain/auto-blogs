export default async function handler(req, res) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const slugToRevalidate = req.body?.slug?.current;
    if (!slugToRevalidate) {
      return res.status(400).json({ message: 'No slug to revalidate' });
    }

    // this will revalidate the page with the given slug
    await res.revalidate(`/blog/${slugToRevalidate}`);
    
    // also revalidate the homepage
    await res.revalidate('/');

    return res.json({ revalidated: true });
  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send('Error revalidating');
  }
} 