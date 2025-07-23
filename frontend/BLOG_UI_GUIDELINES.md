# Blog UI & UX Design Guidelines

Inspired by high-quality editorial sites (e.g. OpenAI Index, getimg.ai), these rules ensure every post is both beautiful and extremely SEO-/performance-friendly.

---
## 1. Page Anatomy

1. **Breadcrumb** – semantic `<nav aria-label="breadcrumb">` with JSON-LD `BreadcrumbList`.
2. **Hero Title Block**
   • Category label + reading-time meta<br>
   • `<h1>` headline (42-52 px desktop, 32 px tablet, 26 px mobile).<br>
   • Author & published-date row (avatar 32 px).
3. **Hero Media** – responsive image or video (16∶9). Uses Next.js `<Image>` with `placeholder="blur"`.
4. **Body Content** – Max width 720 px desktop, 640 px tablet, full-bleed mobile.
5. **Inline TOC** (desktop only) – sticky on right once viewport ≥ 1280 px.
6. **Rich CTA** – optional block after second H2: gradient card with button.
7. **Footer Navigation** – «previous/next» posts & social share buttons.

---
## 2. Typography

| Element   | Font           | Weight | Line-height | Letter-spacing |
|-----------|----------------|--------|-------------|----------------|
| h1        | Inter Display  | 700    | 110%        | -0.02em        |
| h2        | Inter Display  | 600    | 120%        | -0.01em        |
| body text | Inter          | 400    | 160%        | 0              |
| captions  | Inter          | 400    | 140%        | 0.01em         |

---
## 3. Colour & Theme

Dark-mode first.  Use Tailwind `slate` scale:

```
--bg           #0f0f0f
--bg-surface   #181818
--text-primary #fafafa
--text-muted   #a1a1aa
--accent       #4f46e5  /* indigo-600 */
```
`prefers-color-scheme` media query swaps to light palette.

---
## 4. Images & Media

* Always include `alt` (<= 120 chars).
* `sizes` attribute tuned per breakpoint.
* Use Sanity's `auto=format,compress` params for CDN.
* Lazy-load below viewport with `loading="lazy"` + `decoding="async"`.

---
## 5. Performance Budget

* LCP < 2.5 s on 3G.
* CLS < 0.1 (reserve aspect-ratio boxes).
* Total JS < 160 KB (gz).  Use Next.js `app` router & dynamic imports.

---
## 6. Accessibility

* Heading outline never skips levels.
* Colour contrast AA.
* Keyboard-navigable TOC & share buttons.
* `prefers-reduced-motion` → disable parallax.

---
## 7. Responsive Breakpoints

| Token  | Min-Width |
|--------|-----------|
| sm     | 480 px    |
| md     | 768 px    |
| lg     | 1024 px   |
| xl     | 1280 px   |

---
## 8. Next.js Implementation Checklist

1. Tailwind configured with above palette + typography plugin.
2. Layout component wraps MDX with `<Prose>` (tailwind-typography).
3. TOC auto-generated via `rehype-slug` + custom `useToc` hook.
4. Hero images use `priority` prop when above-the-fold.
5. `next-seo` configured at `_app.tsx` with defaults.
6. Sitemap/RSS generated at build (`next-sitemap.js`).
7. `@vercel/analytics` script deferred.

---
## 9. Future Enhancements

* Progressive Web App manifest & `service-worker.js` (static assets).
* reading-progress bar (mobile hidden).
* Comment system via giscus (optional). 