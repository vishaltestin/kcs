"use client";

import { useRef, useState } from "react";
import { Film, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describeVideoSource, parseVideoSource } from "@/lib/video";

/**
 * A video slot — the home page showreel band or a product page clip.
 *
 * Two ways in, in the order they actually work: paste a YouTube/Vimeo link (no
 * storage, no bandwidth bill, always survives a deploy) or upload a file (kept
 * on our own disk — fine for a short clip, unreliable on a serverless host that
 * wipes `public/uploads` on the next build). The preview under the input is the
 * point of this component: it says out loud what the saved value will become,
 * instead of leaving the editor to guess whether a link "took".
 */
export function VideoField({
  name,
  value,
  onChange,
  hint,
  ...aria
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
} & Pick<React.InputHTMLAttributes<HTMLInputElement>, "id" | "aria-describedby" | "aria-invalid">) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const source = parseVideoSource(value);
  const unrecognised = value.trim().length > 0 && !source;

  function uploadFile(file: File) {
    const body = new FormData();
    body.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/uploads/video");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      setProgress(null);
      let result: { ok?: boolean; path?: string; message?: string } = {};
      try {
        result = JSON.parse(request.responseText);
      } catch {
        /* fall through to the generic message below */
      }
      if (result.ok && result.path) {
        onChange(result.path);
        toast.success("Video uploaded.");
      } else {
        toast.error(result.message ?? "Upload failed. The file may be larger than this host allows.");
      }
    };
    request.onerror = () => {
      setProgress(null);
      toast.error("Upload failed. The file is probably larger than this host allows for one request — a YouTube link has no such limit.");
    };
    request.send(body);
  }

  return (
    <div className="space-y-2">
      <Input
        {...aria}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={300}
        placeholder="https://www.youtube.com/watch?v=… or /video/promo.mp4"
        className="font-mono text-[13px]"
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) uploadFile(file);
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={progress !== null} onClick={() => fileInput.current?.click()}>
          {progress === null ? <Upload aria-hidden /> : <Loader2 className="animate-spin" aria-hidden />}
          {progress === null ? "Upload a file" : `Uploading ${progress}%`}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => onChange("")}>
            Clear
          </Button>
        )}
      </div>

      {source ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
          <div className="relative size-[92px] shrink-0 overflow-hidden rounded bg-black">
            {source.kind === "youtube" ? (
              // Plain <img> on purpose: an admin-only preview of an asset we do
              // not own. Routing it through next/image would make the server
              // fetch it, which only adds a failure mode to a form field.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={source.thumbnailUrl} alt="Video thumbnail" width={320} height={180} className="size-full object-cover" />
            ) : (
              <span className="grid size-full place-items-center text-muted-foreground">
                <Film className="size-6" aria-hidden />
              </span>
            )}
          </div>
          <div className="min-w-0 space-y-0.5 text-xs">
            <p className="font-medium">
              {source.kind === "youtube" ? "YouTube" : source.kind === "vimeo" ? "Vimeo" : "Video file"} —{" "}
              {source.kind === "file" ? "plays in our own player" : "embedded player, nothing stored here"}
            </p>
            <p className="truncate text-muted-foreground">{describeVideoSource(source)}</p>
            {source.kind === "file" && <p className="text-muted-foreground">Seeking works; the file stays in public/uploads/.</p>}
          </div>
        </div>
      ) : unrecognised ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
          This is neither a YouTube/Vimeo link nor a file we recognise. It will still be saved and handed to the browser&rsquo;s player as{" "}
          <code className="font-mono">{value.trim().slice(0, 48)}</code> — double-check it before publishing.
        </p>
      ) : null}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
