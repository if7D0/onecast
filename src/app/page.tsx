import Link from "next/link";
import { AtSign, Briefcase, Camera, Clock, Copy, Mail, Sparkles, Zap } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultCard } from "@/components/results/result-card";
import { mockGenerate } from "@/lib/mock/generation";

const FEATURES = [
  {
    icon: AtSign,
    title: "X (Twitter)",
    desc: "Thread dan cuitan ≤280 karakter.",
  },
  {
    icon: Briefcase,
    title: "LinkedIn",
    desc: "Hook + insight + CTA dengan nada profesional.",
  },
  {
    icon: Camera,
    title: "Instagram",
    desc: "Caption + hashtag relevan.",
  },
  {
    icon: Mail,
    title: "Email Newsletter",
    desc: "Subjek + isi + ajakan yang siap kirim.",
  },
];

const STEPS = [
  {
    icon: Copy,
    title: "1. Tempel konten",
    desc: "Blog post, transkrip, atau catatan — tempel teks atau unggah file .txt/.md.",
  },
  {
    icon: Sparkles,
    title: "2. Pilih platform & tone",
    desc: "Centang target dan pilih gaya: profesional, santai, jenaka, atau inspiratif.",
  },
  {
    icon: Zap,
    title: "3. Salin & posting",
    desc: "Hasil tiap platform siap disalin dengan satu klik.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section aria-labelledby="hero-heading" className="relative overflow-hidden">
          <div aria-hidden className="bg-dot-grid absolute inset-0 opacity-60" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <p className="bg-cta text-cta-foreground mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold">
                Gratis &amp; open-source
              </p>
              <h1
                id="hero-heading"
                className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
              >
                Ubah satu konten jadi siap-post di semua platform
              </h1>
              <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                Tempel blog, transkrip, atau catatan. Dapat versi X, LinkedIn, Instagram, dan
                newsletter dalam hitungan menit.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href="/register" className={buttonVariants({ size: "lg" })}>
                  Mulai Gratis
                </Link>
                <Link
                  href="#cara-kerja"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Lihat cara kerja
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-3 lg:justify-start">
                {[AtSign, Briefcase, Camera, Mail].map((Icon, i) => (
                  <span
                    key={i}
                    className="bg-card flex h-10 w-10 items-center justify-center rounded-xl border"
                  >
                    <Icon className="text-primary h-5 w-5" aria-hidden />
                  </span>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div
                aria-hidden
                className="bg-card absolute -top-4 -right-4 h-full w-full rotate-3 rounded-2xl border"
              />
              <div
                aria-hidden
                className="bg-muted absolute -bottom-4 -left-4 h-full w-full -rotate-2 rounded-2xl border"
              />
              <div className="animate-float-slow relative">
                <ResultCard
                  result={mockGenerate(
                    "OneCast mengubah satu konten menjadi siap-post di semua platform dalam hitungan menit.",
                    "twitter",
                    "casual"
                  )}
                  tone="casual"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Demo produk */}
        <section aria-labelledby="demo-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2
            id="demo-heading"
            className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl"
          >
            Lihat contoh hasilnya
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-center">
            Satu konten masuk, empat format keluar. Contoh statis, bukan hasil AI.
          </p>
          <div className="mt-8 grid items-start gap-4 md:grid-cols-3">
            <ResultCard
              result={mockGenerate(
                "OneCast mengubah satu konten menjadi siap-post di semua platform dalam hitungan menit.",
                "twitter",
                "casual"
              )}
              tone="casual"
            />
            <ResultCard
              result={mockGenerate(
                "OneCast mengubah satu konten menjadi siap-post di semua platform dalam hitungan menit.",
                "linkedin",
                "professional"
              )}
              tone="professional"
            />
            <ResultCard
              result={mockGenerate(
                "OneCast mengubah satu konten menjadi siap-post di semua platform dalam hitungan menit.",
                "instagram",
                "casual"
              )}
              tone="casual"
            />
          </div>
          <div className="mt-8 text-center">
            <Link href="/register" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Coba sekarang
            </Link>
          </div>
        </section>

        {/* Fitur */}
        <section
          aria-labelledby="fitur-heading"
          id="fitur"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6"
        >
          <h2
            id="fitur-heading"
            className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl"
          >
            Satu konten, empat format
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-center">
            Setiap platform punya gayanya sendiri. Pilih target, AI menulis ulang nadanya.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="hover:border-primary transition-colors duration-200">
                <CardHeader>
                  <span className="bg-primary/10 mb-1 flex h-11 w-11 items-center justify-center rounded-xl">
                    <f.icon className="text-primary h-6 w-6" aria-hidden />
                  </span>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cara kerja */}
        <section
          aria-labelledby="cara-kerja-heading"
          id="cara-kerja"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6"
        >
          <h2
            id="cara-kerja-heading"
            className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl"
          >
            Cara kerja
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Card key={s.title} className="relative overflow-hidden">
                <span
                  aria-hidden
                  className="text-primary/10 pointer-events-none absolute -top-3 right-3 text-8xl font-extrabold tabular-nums select-none"
                >
                  {i + 1}
                </span>
                <CardHeader>
                  <s.icon className="text-primary h-6 w-6" aria-hidden />
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-muted-foreground mt-8 flex items-center justify-center gap-2 text-sm">
            <Clock className="h-4 w-4" aria-hidden />
            <p>Tanpa tulis ulang manual untuk tiap platform.</p>
          </div>
        </section>

        {/* CTA */}
        <section aria-labelledby="cta-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Card className="bg-primary text-primary-foreground border-primary overflow-hidden text-center">
            <CardHeader>
              <CardTitle
                id="cta-heading"
                className="text-2xl font-extrabold tracking-tight sm:text-3xl"
              >
                Siap posting ke mana-mana?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="mx-auto max-w-xl opacity-90">
                Daftar gratis, tanpa kartu kredit. Kami simpan semua hasil di riwayat.
              </p>
              <Link
                href="/register"
                className="bg-cta text-cta-foreground inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-6 text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
              >
                Buat akun gratis
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
