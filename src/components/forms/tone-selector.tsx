"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TONE_DESCRIPTIONS, TONE_LABELS, TONES, type Tone } from "@/types/generation";

interface ToneSelectorProps {
  value: Tone;
  onChange: (tone: Tone) => void;
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="tone" className="text-sm font-medium">
        Gaya bahasa
      </label>
      <Select
        value={value}
        onValueChange={(v) => {
          // Tolak nilai tak dikenal (jangan cast buta dari komponen UI).
          if (typeof v === "string" && (TONES as readonly string[]).includes(v)) {
            onChange(v as Tone);
          }
        }}
      >
        <SelectTrigger id="tone" className="w-full">
          <SelectValue placeholder="Pilih gaya bahasa" />
        </SelectTrigger>
        <SelectContent>
          {TONES.map((tone) => (
            <SelectItem key={tone} value={tone}>
              {TONE_LABELS[tone]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-xs">{TONE_DESCRIPTIONS[value]}</p>
    </div>
  );
}
