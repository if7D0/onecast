"use client";

import { AtSign, Briefcase, Camera, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PLATFORM_LABELS, PLATFORMS, type Platform } from "@/types/generation";
import { cn } from "@/lib/utils";

const PLATFORM_HINTS: Record<Platform, string> = {
  twitter: "≤280 karakter",
  linkedin: "Hook + CTA",
  instagram: "+ hashtag",
  email: "Subjek + isi",
};

const PLATFORM_ICONS: Record<Platform, typeof AtSign> = {
  twitter: AtSign,
  linkedin: Briefcase,
  instagram: Camera,
  email: Mail,
};

interface PlatformSelectorProps {
  selected: Platform[];
  onChange: (selected: Platform[]) => void;
}

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  function toggle(platform: Platform) {
    onChange(
      selected.includes(platform) ? selected.filter((p) => p !== platform) : [...selected, platform]
    );
  }

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Platform target</legend>
      <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map((platform) => {
          const Icon = PLATFORM_ICONS[platform];
          const checked = selected.includes(platform);
          const id = `platform-${platform}`;
          return (
            <label
              key={platform}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors",
                checked ? "border-primary bg-muted" : "hover:bg-muted/50"
              )}
            >
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={() => toggle(platform)}
                aria-label={PLATFORM_LABELS[platform]}
              />
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{PLATFORM_LABELS[platform]}</span>
                <span className="text-muted-foreground text-xs">{PLATFORM_HINTS[platform]}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
