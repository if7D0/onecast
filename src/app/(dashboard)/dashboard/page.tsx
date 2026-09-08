"use client";

import { useState } from "react";
import { ContentInput } from "@/components/forms/content-input";
import { GenerateButton } from "@/components/forms/generate-button";
import { PlatformSelector } from "@/components/forms/platform-selector";
import { ToneSelector } from "@/components/forms/tone-selector";
import { ResultList } from "@/components/results/result-list";
import { PLATFORM_LABELS, type MockResult, type Platform, type Tone } from "@/types/generation";

type Status = "idle" | "loading" | "done";

interface ApiSuccess {
  success: true;
  data: Record<string, { variations: { text: string; characterCount: number }[] }>;
}

interface ApiError {
  success: false;
  error: string;
  retryAfterSec?: number;
}

export default function DashboardPage() {
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["twitter", "linkedin"]);
  const [tone, setTone] = useState<Tone>("professional");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<MockResult[]>([]);
  const [formError, setFormError] = useState("");

  async function handleGenerate() {
    setFormError("");
    if (!content.trim()) {
      setFormError("Isi konten dulu sebelum generate.");
      return;
    }
    if (platforms.length === 0) {
      setFormError("Pilih minimal 1 platform.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, platforms, tone }),
        // AI sequential bisa ~35 dtk; 120 dtk batas aman browser.
        signal: AbortSignal.timeout(120_000),
      });
      const json = (await res.json().catch(() => null)) as ApiSuccess | ApiError | null;
      if (!res.ok || !json || !json.success) {
        setFormError(
          json && !json.success && json.error ? json.error : "Generate gagal. Coba lagi."
        );
        setStatus("idle");
        return;
      }
      const mapped: MockResult[] = platforms.flatMap((p) => {
        const text = json.data[p]?.variations?.[0]?.text;
        if (!text) return [];
        return [{ platform: p, title: `${PLATFORM_LABELS[p]} — hasil AI`, body: text }];
      });
      setResults(mapped);
      setStatus("done");
    } catch {
      setFormError("Koneksi terputus atau terlalu lama. Coba lagi.");
      setStatus("idle");
    }
  }

  const loading = status === "loading";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Buat konten baru</h1>
        <p className="text-muted-foreground text-sm">
          Tempel konten, pilih platform dan gaya bahasa, lalu generate.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ContentInput value={content} onChange={setContent} />
          <PlatformSelector selected={platforms} onChange={setPlatforms} />
          <ToneSelector value={tone} onChange={setTone} />
          {formError && (
            <p role="alert" aria-live="polite" className="text-sm text-red-600">
              {formError}
            </p>
          )}
          <GenerateButton
            loading={loading}
            disabled={!content.trim() || platforms.length === 0}
            onClick={handleGenerate}
          />
          {loading && (
            <p className="text-muted-foreground text-sm" aria-live="polite">
              Membuat dengan AI… bisa sekitar 30 detik untuk beberapa platform.
            </p>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Hasil</h2>
          <ResultList results={results} loading={loading} tone={tone} badge="AI" />
        </div>
      </div>
    </div>
  );
}
