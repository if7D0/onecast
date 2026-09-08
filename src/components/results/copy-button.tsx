"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback untuk konteks non-HTTPS / browser lama. execCommand memang
    // deprecated, tapi disengaja sebagai cadangan terakhir; primer tetap
    // navigator.clipboard di atas. Gagal total → false (tombol tetap "Salin").
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function handleClick() {
    const ok = await copyText(text);
    setCopied(ok);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
    if (!ok) {
      // Fallback terakhir: biarkan user blok manual — tandai via title.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      title={copied ? "Disalin!" : "Salin ke clipboard"}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden />
          Disalin
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden />
          Salin
        </>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Teks disalin ke clipboard" : ""}
      </span>
    </Button>
  );
}
