"use client";

import { useEffect, useRef, useState } from "react";
import { ContentInput } from "@/components/forms/content-input";
import { GenerateButton } from "@/components/forms/generate-button";
import { PlatformSelector } from "@/components/forms/platform-selector";
import { ToneSelector } from "@/components/forms/tone-selector";
import { ResultList } from "@/components/results/result-list";
import { mockGenerate } from "@/lib/mock/generation";
import type { MockResult, Platform, Tone } from "@/types/generation";

type Status = "idle" | "loading" | "done";

export default function DashboardPage() {
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["twitter", "linkedin"]);
  const [tone, setTone] = useState<Tone>("professional");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<MockResult[]>([]);
  const [formError, setFormError] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  function handleGenerate() {
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
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      // Fase 5: ganti blok ini dengan fetch POST /api/generate.
      setResults(platforms.map((p) => mockGenerate(content, p, tone)));
      setStatus("done");
    }, 1200);
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
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Hasil</h2>
          <ResultList results={results} loading={loading} tone={tone} />
        </div>
      </div>
    </div>
  );
}
