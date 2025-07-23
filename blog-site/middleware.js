import { NextResponse } from 'next/server';

// This is the middleware that will handle subdomain and path-based routing.
export function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host');

  // Use a hardcoded root domain or set it in Vercel project settings as NEXT_PUBLIC_ROOT_DOMAIN
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'outblogai.com';

  // If the path already starts with /_projects, it's an internal route for local dev.
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
  const subdomain = hostname.replace(`.${rootDomain}`, '');

  // Handle two routing strategies: subdomains and path-based projects.
  if (hostname === rootDomain) {
    // Path-based routing for projects on the root domain.
    if (pathname.startsWith('/projects/')) {
      const projectSlug = pathname.split('/')[2];
      url.pathname = `/_projects/${projectSlug}${pathname.replace(`/projects/${projectSlug}`, '')}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();

  } else if (subdomain !== '' && hostname !== `www.${rootDomain}`) {
    // Subdomain-based routing.
    url.pathname = `/_projects/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // If no routing strategy matches, proceed without rewriting.
  return NextResponse.next();
}

// Only export config if you need to specify matcher (optional, but recommended for performance)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 