# Blog Site Development Roadmap

This document outlines the development tasks for the multi-tenant blog platform. It's structured by epics and prioritized to deliver a scalable, feature-rich product.

---

### **Epic: Core Multi-Tenant Architecture (P0)**

*This is the foundational work for the entire platform. All other features depend on this.*

| ID | Task | Success Criteria & Edge Cases |
| :-- | :--- | :--- |
| **MT-1** | **Implement Subdomain & Path-Based Routing Middleware** | **Success:**<br/>- Requests to `subdomain.outblogai.com/path` are internally rewritten to `/_projects/subdomain/path`.<br/>- Requests to `outblogai.com/projects/project-slug/path` are rewritten to `/_projects/project-slug/path`.<br/>- The user-facing URL remains unchanged in the browser.<br/>- The middleware correctly identifies and forwards special Next.js paths (`/_next`, `/api`, etc.) without rewriting.<br/>**Edge Cases:**<br/>- **404 Handling:** Requests for non-existent subdomains or project slugs result in a clean "not found" page.<br/>- **Root Domain:** Requests to the root domain (`outblogai.com`) are routed to the main marketing/landing site, not a project. |
| **MT-2** | **Create Dynamic Project-Based Page Structure** | **Success:**<br/>- A new directory structure `pages/_projects/[projectIdentifier]/...` is created.<br/>- A `[slug].jsx` page inside this structure can successfully render a blog post by fetching its content based on the `projectIdentifier` and `slug` parameters.<br/>**Edge Cases:**<br/>- Handles cases where a blog post (`slug`) doesn't exist for a given `projectIdentifier`. |
| **MT-3** | **Implement Incremental Static Regeneration (ISR) with `getStaticProps`** | **Success:**<br/>- Blog pages are rendered using ISR (`revalidate` timer is set).<br/>- `getStaticProps` successfully fetches project-specific data (branding, GA ID, etc.) and post content (MDX) from the backend API/database based on `projectIdentifier`.<br/>- The initial visit to an uncached page is server-rendered, and subsequent visits are served statically.<br/>**Edge Cases:**<br/>- **API Failure:** Gracefully handles failures when fetching data from the backend in `getStaticProps`.<br/>- **Build Failure:** The site remains operational even if one page fails to build/revalidate. |
| **MT-4** | **Setup Centralized, Multi-Tenant Analytics** | **Success:**<br/>- The `_app.jsx` component correctly initializes GA4.<br/>- Every analytics event (pageview, custom clicks) is sent with the `project_id` as a custom dimension.<br/>- The system can simultaneously send events to both a platform-wide GA account and a client-specific GA account if `project.gaId` is provided.<br/>**Edge Cases:**<br/>- Correctly handles projects where `gaId` or `projectId` are not present without crashing. |

---

### **Epic: Branded User Experience (P1)**

*Once the core architecture is in place, we must ensure each blog feels like it belongs to the client.*

| ID | Task | Success Criteria & Edge Cases |
| :-- | :--- | :--- |
| **UX-1** | **Dynamically Themed Blog Layout** | **Success:**<br/>- The main blog layout (header, footer, etc.) uses brand colors, logo, and project name fetched in `getStaticProps`.<br/>- Custom fonts (if specified by the project) are loaded and applied.<br/>- The header logo links to the client's specified homepage URL, not back to the blog index.<br/>**Edge Cases:**<br/>- Falls back to a clean, default theme if branding information is missing. |
| **UX-2** | **MDX Component Styling** | **Success:**<br/>- All standard markdown elements (`h1`, `p`, `blockquote`, `code`) are styled elegantly within the blog content area.<br/>- `next-mdx-remote` is used to render the MDX content, with custom components provided for enhanced elements (e.g., syntax-highlighted code blocks). |
| **UX-3** | **Author & Metadata Component** | **Success:**<br/>- A component below the post title displays the author's name, avatar, and estimated reading time. This data is part of the post's metadata. |

---

### **Epic: SEO & Discoverability (P1)**

*Ensuring blogs are optimized for search engines is a core value proposition.*

| ID | Task | Success Criteria & Edge Cases |
| :-- | :--- | :--- |
| **SEO-1** | **Dynamic SEO & Metadata** | **Success:**<br/>- Each page has unique and correct `<title>`, `<meta name="description">`, and `<link rel="canonical">` tags.<br/>- Open Graph tags (`og:title`, `og:description`, `og:image`) are dynamically generated from post metadata.<br/>- All metadata is fetched on a per-post basis. |
| **SEO-2** | **Dynamic `sitemap.xml` & `robots.txt`** | **Success:**<br/>- A `sitemap.xml` is generated on-demand, listing all published posts for the specific project requested.<br/>- A `robots.txt` is generated, allowing crawlers to index all public blog pages and the sitemap. |
| **SEO-3**| **Implement Advanced Schema Markup (JSON-LD)** | **Success:**<br/>- JSON-LD schema for `Article`, `BreadcrumbList`, and `Organization` is added to blog pages. The `Organization` schema uses the specific client's project data. |

---

### **Epic: Growth & Conversion (P2)**

*Features focused on helping clients achieve their business goals through their blogs.*

| ID | Task | Success Criteria & Edge Cases |
| :-- | :--- | :--- |
| **G-1** | **Dynamic CTA Injection** | **Success:**<br/>- A component can fetch and display CTAs from an API endpoint (`/api/cta?projectId=...`).<br/>- CTAs can be embedded within or after the blog content.<br/>- Clicks on CTAs are tracked with specific analytics events.<br/>**Edge Cases:**<br/>- The page layout doesn't break if the CTA API fails or returns no CTAs. |
| **G-2** | **A/B Testing Framework for CTAs** | **Success:**<br/>- The CTA API endpoint can serve different CTA variations based on simple logic (e.g., random assignment).<br/>- The analytics event for a CTA click includes a parameter identifying which variation was shown (`data-analytics-param-variation="A"`). |

---
*Existing feature ideas from the old TODO have been re-prioritized and integrated into the epics above. Some marketing-specific tasks for the root `outblogai.com` site have been omitted for now to focus on the core multi-tenant product.* 