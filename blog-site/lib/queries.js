export const postListQuery = `*[_type == "blogPost" && defined(slug.current)] | order(publishedAt desc){
  _id,
  title,
  "slug": slug.current,
  "mainImage": openGraphImage,
  publishedAt,
  metaDescription
}`;

export const postBySlugQuery = `*[_type == "blogPost" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  "mainImage": openGraphImage,
  body,
  publishedAt,
  "author": *[_type=='author' && _id == ^.author._ref][0]{
    "name": title,
    "avatarUrl": image.asset->url
  },
  // SEO fields
  metaTitle,
  metaDescription,
  canonicalUrl,
  "ogImage": openGraphImage.asset->url,
  structuredData
}`;

export const postSlugsQuery = `*[_type == "blogPost" && defined(slug.current)][].slug.current`; 