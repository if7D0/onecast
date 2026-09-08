"use client";

import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const CONTENT_MAX = 5000;
const FILE_MAX_BYTES = 200 * 1024;
const ACCEPTED_TYPES = [".txt", ".md", "text/plain", "text/markdown"];

interface ContentInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContentInput({ value, onChange }: ContentInputProps) {
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    setFileError("");
    if (!file) return;
    const okType =
      ACCEPTED_TYPES.some((t) => file.name.toLowerCase().endsWith(t)) ||
      file.type === "text/plain" ||
      file.type === "text/markdown";
    if (!okType) {
      setFileError("Hanya file .txt atau .md yang didukung.");
      return;
    }
    if (file.size > FILE_MAX_BYTES) {
      setFileError("Ukuran file maksimal 200 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setFileError("Gagal membaca file. Coba lagi.");
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setFileName(file.name);
      onChange(text.slice(0, CONTENT_MAX));
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="content" className="text-sm font-medium">
          Konten sumber
        </label>
        <span className="text-muted-foreground text-xs" aria-live="polite">
          {value.length}/{CONTENT_MAX}
        </span>
      </div>
      <Textarea
        id="content"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, CONTENT_MAX))}
        placeholder="Tempel blog post, transkrip, atau catatan Anda di sini…"
        rows={8}
        className="resize-y"
      />
      <div className="flex items-center gap-2">
        <Input
          ref={fileRef}
          id="content-file"
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
        >
          <Upload className="h-4 w-4" aria-hidden />
          Unggah .txt/.md
        </button>
        {fileName && (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {fileName}
          </span>
        )}
      </div>
      {fileError && (
        <p role="alert" aria-live="polite" className="text-sm text-red-600">
          {fileError}
        </p>
      )}
    </div>
  );
}
