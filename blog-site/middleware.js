import { NextResponse } from 'next/server';

// This is the middleware that will handle subdomain and path-based routing.
export function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host');

  // Your primary domain, which will host the marketing site.
  // We'll extract this from an environment variable for flexibility.
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'outblogai.com';

  // If the request is not for the root domain or its subdomains, do not rewrite.
  if (!hostname.endsWith(rootDomain)) {
    return NextResponse.next();
  }

  // If the path already starts with /_projects, it's an internal route for local dev.
  // Do not rewrite it.
  if (pathname.startsWith('/_projects')) {
    return NextResponse.next();
  }

  // Prevent middleware from rewriting requests for static assets, API routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    /\.(jpe?g|png|gif|svg|ico|css|js|webmanifest)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Extract the potential project identifier from the hostname.
  // e.g., "project1.outblogai.com" -> "project1"
  const subdomain = hostname.replace(`.${rootDomain}`, '');

  // Handle two routing strategies: subdomains and path-based projects.
  if (hostname === rootDomain) {
    // Strategy 1: Path-based routing for projects on the root domain.
    // e.g., "outblogai.com/projects/my-project"
    if (pathname.startsWith('/projects/')) {
      const projectSlug = pathname.split('/')[2];
      // Rewrite to the internal project structure.
      url.pathname = `/_projects/${projectSlug}${pathname.replace(`/projects/${projectSlug}`, '')}`;
      return NextResponse.rewrite(url);
    }
    // Requests to the root domain that are not for a project path are left alone.
    // They will be handled by your main marketing site pages (e.g., pages/index.jsx).
    return NextResponse.next();

  } else if (subdomain !== '' && hostname !== `www.${rootDomain}`) {
    // Strategy 2: Subdomain-based routing.
    // Rewrite any request on a subdomain to the internal project structure.
    console.log('subdomain', subdomain);
    console.log('pathname', pathname);
    url.pathname = `/_projects/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // If no routing strategy matches, proceed without rewriting.
  return NextResponse.next();
} 