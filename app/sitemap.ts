import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://sketchviz.app",
      lastModified: "2026-01-04",
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: "https://sketchviz.app/pricing",
      lastModified: "2026-01-04",
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
