# Workflow Builder & Publishing Pipeline TODOs

| # | Priority | Task | Success Condition |
|---|----------|------|-------------------|
| 8 | 1 | Implement file upload helper for BlogGenerator outputs | MD/MDX uploaded to storage, URLs returned in node output. |
| 9 | 2 | Output viewer modal – Core UI | Clicking an output badge opens a modal; tabs for every output key; pretty code block etc. |
|10 | 2 | Cron scheduler for workflows | Workflows with `cron_expr` auto-run at correct time. |
|11 | 2 | Canvas multi-select delete/copy & snap-grid toggle | User can box-select and delete/copy nodes; grid toggle works. |
|12 | 3 | Render custom node icons on canvas | Nodes display their icon from catalogue. |
|13 | 3 | Search/filter & drag-reorder palette | Sidebar palette supports text search and custom ordering. |
|14 | 3 | Improve mini-map & zoom-to-fit styling | Matches design guidelines. |
|15 | 3 | Workflow versioning / rollback | User can view past versions and restore one. |
|16 | 3 | Project-level role permissions for workflows | Viewer cannot edit; editor can; admin can delete. |
|17 | 3 | Accessibility & color-blind audit | Meets WCAG AA for contrast; screen-reader landmarks present. |
|18 | 3 | Undo/Redo canvas actions | Ctrl+Z / Ctrl+Shift+Z cycles through history. |
|19 | 2 | Admin API & UI to edit workflow_blocks catalogue | Able to add/disable blocks without code change. |
|24 | 2 | Output viewer – Historical runs | Secondary selector for past runs of a block. |
|25 | 2 | Output viewer – Block navigation | Prev/Next arrow buttons navigate blocks in modal. |
|26 | 1 | Realtime output refresh bug | setNodeResult accumulates results rather than overwriting. |
|27 | 1 | Set up Sanity Studio container service | **DONE** |
|28 | 1 | Define `blogPost` schema & i18n plugin in Sanity | **DONE (v1 schema)** |
|29 | 1 | Implement FastAPI `sanity_service.py` to publish posts | Publishing endpoint returns Sanity document ID. |
|30 | 1 | Hook BlogGenerator node to call `sanity_service` on publish | After markdown generation, post is pushed to Sanity automatically. |
|31 | 1 | Scaffold Next.js blog-site with MDX & Dockerfile | `docker compose up blog_site` serves static pages at :3000. |
|32 | 1 | Implement ISR revalidate API route & secure webhook | Sanity webhook triggers immediate page re-build; secret validated. |
|33 | 1 | Integrate `next-seo`, `next-sitemap`, `next-rss` | Meta tags, JSON-LD, sitemap and RSS generated on build. |
|34 | 1 | Add MDX pipeline with lazy video + responsive images | Videos load on intersection, images have `loading="lazy"` and `alt` fallback. |
|35 | 2 | CI/CD or compose env vars for Sanity & blog_site | `.env` values documented, deployment works end-to-end. |
|36 | 1 | Add slugify utility for deterministic slugs | Utility `backend/utils/slugify.py` in place |

