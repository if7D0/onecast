import { AtSign, Briefcase, Camera, Mail } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TONE_LABELS, type MockResult, type Tone } from "@/types/generation";
import { CopyButton } from "./copy-button";

const PLATFORM_ICONS = {
  twitter: AtSign,
  linkedin: Briefcase,
  instagram: Camera,
  email: Mail,
} as const;

export function ResultCard({
  result,
  tone,
  badge = "Contoh",
}: {
  result: MockResult;
  tone: Tone;
  badge?: string;
}) {
  const Icon = PLATFORM_ICONS[result.platform];
  const fullText = result.footer ? `${result.body}\n\n${result.footer}` : result.body;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {result.title}
        </CardTitle>
        <div className="flex gap-2 text-xs">
          <span className="text-muted-foreground rounded-full border px-2 py-0.5">{badge}</span>
          <span className="text-muted-foreground rounded-full border px-2 py-0.5">
            {TONE_LABELS[tone]}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{result.body}</p>
        {result.footer && (
          <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">{result.footer}</p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{fullText.length} karakter</span>
        <CopyButton text={fullText} />
      </CardFooter>
    </Card>
  );
}
