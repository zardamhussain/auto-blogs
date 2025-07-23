import {defineField, defineType} from "sanity"

export default defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  groups: [
    {name: "content", title: "Content"},
    {name: "seo", title: "SEO"},
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "content",
      validation: r => r.required().min(8).max(120),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "content",
      options: {
        source: "title",
        maxLength: 64,
        slugify: (input: string) => input
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, ""),
        isUnique: async (slug, ctx) => {
          const {document, getClient} = ctx
          const id = document?._id?.replace(/^drafts\./, "")
          const query = "!defined(*[_type=='blogPost' && slug.current==$slug && _id!=$id][0]._id)"
          return await getClient({apiVersion: "2023-10-24"}).fetch(query, {slug, id})
        }
      },
    }),
    defineField({
      name: "body",
      title: "Body (Markdown)",
      type: "text",
      group: "content",
      validation: r => r.required(),
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      group: "content",
      initialValue: () => new Date().toISOString(),
    }),
    // --- SEO ---
    defineField({
      name: "metaTitle",
      type: "string",
      group: "seo",
      validation: r => r.max(60),
    }),
    defineField({
      name: "metaDescription",
      type: "text",
      rows: 2,
      group: "seo",
      validation: r => r.max(160),
    }),
    defineField({
      name: "canonicalUrl",
      type: "url",
      group: "seo",
      validation: r => r.uri({scheme: ["http","https"], allowRelative: false}),
    }),
    defineField({
      name: "openGraphImage",
      type: "image",
      group: "seo",
      options: {hotspot: true},
    }),
    defineField({
      name: "structuredData",
      type: "text",
      group: "seo",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{type: "string"}],
      group: "content",
    }),
    defineField({
      name: "categories",
      type: "array",
      of: [{type: "string"}],
      group: "content",
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{
        type: "object",
        fields: [
          {name: "image", type: "image", options: {hotspot: true}},
          {name: "alt", type: "string", validation: r=>r.max(120)},
          {name: "caption", type: "string"},
        ]
      }],
      group: "content",
    }),
    defineField({
      name: "readingTime",
      type: "number",
      readOnly: true,
      group: "seo",
      description: "Estimated reading time (minutes)",
    }),
  ],
  preview: {
    select: {title: "title", publishedAt: "publishedAt"},
    prepare({title, publishedAt}) {
      return {
        title,
        subtitle: publishedAt ? new Date(publishedAt).toLocaleDateString() : undefined,
      }
    }
  }
}) 