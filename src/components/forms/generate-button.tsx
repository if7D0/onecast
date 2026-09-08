"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function GenerateButton({ loading, disabled, onClick }: GenerateButtonProps) {
  return (
    <Button
      type="button"
      className="w-full sm:w-auto"
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Membuat…
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" aria-hidden />
          Generate
        </>
      )}
    </Button>
  );
}
