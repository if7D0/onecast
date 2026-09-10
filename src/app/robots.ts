import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

/** Publik boleh di-crawl; API + area login diblokir. */
export default function robots(): MetadataRoute.Robots {
  const APP_URL = getAppUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/history"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
