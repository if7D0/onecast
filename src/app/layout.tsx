import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { getAppUrl } from "@/lib/app-url";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = getAppUrl();
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "OneCast";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "OneCast — Ubah Satu Konten Jadi Banyak Format",
    template: "%s | OneCast",
  },
  description:
    "Tempel satu konten, dapatkan versi siap-post untuk X, LinkedIn, Instagram, dan newsletter dalam kurang dari 5 menit. Gratis dan open-source.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: APP_NAME,
    title: "OneCast — Ubah Satu Konten Jadi Banyak Format",
    description:
      "Tempel satu konten, dapatkan versi siap-post untuk X, LinkedIn, Instagram, dan newsletter dalam kurang dari 5 menit.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneCast — Ubah Satu Konten Jadi Banyak Format",
    description:
      "Tempel satu konten, dapatkan versi siap-post untuk X, LinkedIn, Instagram, dan newsletter dalam kurang dari 5 menit.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
