import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

/** Hanya landing publik — halaman auth thin content, jangan diindeks. */
export default function sitemap(): MetadataRoute.Sitemap {
  const APP_URL = getAppUrl();
  return [{ url: `${APP_URL}/`, changeFrequency: "weekly", priority: 1 }];
}
