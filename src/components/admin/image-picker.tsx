"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Link2,
  Loader2,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listPublicImagesAction } from "@/actions/admin/engagements";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Shared upload helper                                                        */
/* -------------------------------------------------------------------------- */

export type UploadedFile = { path: string; width: number; height: number; bytes: number; name: string };

type UploadResult = { ok: boolean; files?: UploadedFile[]; errors?: { name: string; message: string }[]; message?: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const ACCEPT_TYPES = ACCEPT.split(",");

/** XHR upload so we can report real progress (fetch has no upload progress). */
function uploadFiles(files: File[], onProgress: (pct: number) => void): Promise<UploadResult> {
  return new Promise((resolve) => {
    const fd = new FormData();
    files.forEach((file) => fd.append("files", file));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as UploadResult);
      } catch {
        resolve({ ok: false, message: "Unexpected server response." });
      }
    };
    xhr.onerror = () => resolve({ ok: false, message: "Upload failed. Check your connection and try again." });
    xhr.send(fd);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function pickImageFiles(list: FileList | File[] | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => ACCEPT_TYPES.includes(file.type));
}

/* -------------------------------------------------------------------------- */
/* Drop zone                                                                   */
/* -------------------------------------------------------------------------- */

function DropZone({
  multiple,
  onFiles,
  progress,
  compact = false,
  className,
}: {
  multiple: boolean;
  onFiles: (files: File[]) => void;
  progress: number | null;
  compact?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = progress !== null;

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const files = pickImageFiles(e.dataTransfer.files);
          if (files.length === 0) {
            toast.error("Only JPG, PNG, WebP, AVIF or GIF images are accepted.");
            return;
          }
          onFiles(multiple ? files : files.slice(0, 1));
        }}
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition-all",
          compact ? "px-4 py-6" : "px-6 py-10",
          dragging
            ? "border-primary bg-primary/[0.05] ring-4 ring-primary/10"
            : "border-border hover:border-primary/50 hover:bg-muted/40",
          busy && "cursor-progress opacity-80",
          className
        )}
        aria-label={multiple ? "Choose images to upload" : "Choose an image to upload"}
      >
        <span
          className={cn(
            "grid place-items-center rounded-2xl bg-primary/[0.08] text-primary transition-transform",
            compact ? "size-10" : "size-14",
            dragging && "scale-110"
          )}
        >
          {busy ? (
            <Loader2 className={cn("animate-spin", compact ? "size-5" : "size-6")} aria-hidden />
          ) : (
            <Upload className={compact ? "size-5" : "size-6"} aria-hidden />
          )}
        </span>
        <span className="text-sm font-semibold">
          {busy
            ? `Uploading… ${progress}%`
            : dragging
              ? "Drop to upload"
              : multiple
                ? "Drop images here or click to browse"
                : "Drop an image here or click to browse"}
        </span>
        <span className="text-xs text-muted-foreground">
          JPG, PNG, WebP, AVIF or GIF · up to 12 MB{multiple ? " each · up to 12 at once" : ""} · auto-optimised to WebP
        </span>
        {busy && (
          <span className="absolute inset-x-6 bottom-3 h-1 overflow-hidden rounded-full bg-foreground/10">
            <span className="block h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = pickImageFiles(e.target.files);
          e.target.value = "";
          if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Library grid                                                                */
/* -------------------------------------------------------------------------- */

function LibraryGrid({
  selected,
  onPick,
  multiple = false,
}: {
  selected: string[];
  onPick: (path: string) => void;
  multiple?: boolean;
}) {
  const [images, setImages] = useState<string[] | null>(null);
  const [filter, setFilter] = useState("");
  const [isLoading, startTransition] = useTransition();

  useEffect(() => {
    if (images !== null) return;
    startTransition(async () => {
      setImages(await listPublicImagesAction());
    });
  }, [images]);

  const filtered = (images ?? []).filter((img) => !filter || img.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by file name…" className="pl-9" />
      </div>
      {isLoading || images === null ? (
        <div className="grid h-[360px] place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : (
        <div className="h-[360px] overflow-y-auto rounded-xl border bg-muted/30 p-2">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {filtered.map((img) => {
              const isSelected = selected.includes(img);
              return (
                <button
                  key={img}
                  type="button"
                  onClick={() => onPick(img)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-lg bg-background ring-2 transition-all",
                    isSelected ? "ring-primary" : "ring-transparent hover:ring-primary/50"
                  )}
                  title={img}
                >
                  <Image src={img} alt="" fill sizes="120px" className="object-cover" />
                  {isSelected && (
                    <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" aria-hidden />
                    </span>
                  )}
                  {multiple && !isSelected && (
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Add
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No images match your filter.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Single image picker                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Picks ONE image: upload (auto-optimised), choose from the library, or paste a URL.
 */
export function ImagePicker({
  value,
  onChange,
  label = "Image",
  hint,
}: {
  value: string;
  onChange: (path: string) => void;
  label?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [urlDraft, setUrlDraft] = useState("");

  const handleFiles = useCallback(
    async (files: File[]) => {
      setProgress(0);
      const result = await uploadFiles(files, setProgress);
      setProgress(null);
      const first = result.files?.[0];
      if (result.ok && first) {
        onChange(first.path);
        toast.success("Image uploaded", { description: `${first.width}×${first.height} · ${formatBytes(first.bytes)}` });
        setOpen(false);
      } else {
        toast.error(result.message ?? "Upload failed.");
      }
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/[0.08]",
            !value && "grid place-items-center"
          )}
        >
          {value ? (
            <Image src={value} alt="Selected" fill className="object-cover" sizes="96px" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <DropZone multiple={false} onFiles={handleFiles} progress={progress} compact />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
              <ImagePlus aria-hidden /> Choose from library
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setUrlDraft(value);
                setOpen(true);
              }}
            >
              <Link2 aria-hidden /> Paste URL
            </Button>
            {value && (
              <>
                <span className="truncate text-xs text-muted-foreground" title={value}>
                  {value}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onChange("")}
                >
                  <X aria-hidden /> Remove
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>Pick from the image library or paste a path / URL.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="library">
            <TabsList className="w-full">
              <TabsTrigger value="library" className="flex-1">
                <ImagePlus className="mr-1.5 size-4" aria-hidden /> Library
              </TabsTrigger>
              <TabsTrigger value="url" className="flex-1">
                <Link2 className="mr-1.5 size-4" aria-hidden /> URL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="mt-4">
              <LibraryGrid
                selected={value ? [value] : []}
                onPick={(path) => {
                  onChange(path);
                  setOpen(false);
                }}
              />
            </TabsContent>
            <TabsContent value="url" className="mt-4 space-y-3">
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="/images/product.jpg, /api/uploads/… or https://…"
                aria-label={`${label} path`}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={!urlDraft.trim()}
                  onClick={() => {
                    onChange(urlDraft.trim());
                    setOpen(false);
                  }}
                >
                  <Check aria-hidden /> Use this image
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Gallery uploader (multi-image)                                              */
/* -------------------------------------------------------------------------- */

/**
 * Manages an ordered list of gallery images: multi-file drag-and-drop upload
 * with progress, add from library, reorder, remove, and "make main image".
 */
export function GalleryUploader({
  value,
  onChange,
  onMakeMain,
  max = 12,
}: {
  value: string[];
  onChange: (paths: string[]) => void;
  /** Optional — promotes a gallery image to be the product's main image. */
  onMakeMain?: (path: string) => void;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const remaining = Math.max(0, max - value.length);

  const append = useCallback(
    (paths: string[]) => {
      const merged = [...value];
      for (const p of paths) if (p && !merged.includes(p)) merged.push(p);
      onChange(merged.slice(0, max));
    },
    [max, onChange, value]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (remaining === 0) {
        toast.error(`You can add up to ${max} gallery images.`);
        return;
      }
      const batch = files.slice(0, remaining);
      setProgress(0);
      const result = await uploadFiles(batch, setProgress);
      setProgress(null);
      if (result.ok && result.files?.length) {
        append(result.files.map((f) => f.path));
        const saved = result.files.reduce((sum, f) => sum + f.bytes, 0);
        toast.success(
          `${result.files.length} image${result.files.length === 1 ? "" : "s"} uploaded`,
          { description: `Optimised to ${formatBytes(saved)} total` }
        );
      }
      for (const err of result.errors ?? []) toast.error(`${err.name}: ${err.message}`);
      if (!result.ok && !result.files?.length) toast.error(result.message ?? "Upload failed.");
    },
    [append, max, remaining]
  );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Gallery images</p>
        <p className="text-xs text-muted-foreground">
          {value.length}/{max} · first image appears right after the main image
        </p>
      </div>

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          {value.map((path, index) => (
            <li
              key={path}
              className="group relative aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/[0.08]"
            >
              <Image src={path} alt={`Gallery image ${index + 1}`} fill sizes="160px" className="object-cover" />
              <span className="absolute top-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                {index + 1}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  className="grid size-7 place-items-center rounded-md bg-white/90 text-foreground hover:bg-white disabled:opacity-30"
                  aria-label="Move earlier"
                >
                  <ArrowLeft className="size-3.5" aria-hidden />
                </button>
                {onMakeMain && (
                  <button
                    type="button"
                    onClick={() => onMakeMain(path)}
                    className="grid size-7 place-items-center rounded-md bg-white/90 text-foreground hover:bg-brand-amber"
                    aria-label="Use as main image"
                    title="Use as main image"
                  >
                    <Star className="size-3.5" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  className="grid size-7 place-items-center rounded-md bg-white/90 text-destructive hover:bg-destructive hover:text-white"
                  aria-label="Remove image"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === value.length - 1}
                  className="grid size-7 place-items-center rounded-md bg-white/90 text-foreground hover:bg-white disabled:opacity-30"
                  aria-label="Move later"
                >
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 ? (
        <DropZone multiple onFiles={handleFiles} progress={progress} compact={value.length > 0} />
      ) : (
        <p className="rounded-xl border border-dashed px-4 py-3 text-center text-xs text-muted-foreground">
          Gallery is full — remove an image to add another.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={remaining === 0} onClick={() => setOpen(true)}>
          <ImagePlus aria-hidden /> Add from library
        </Button>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onChange([])}
          >
            <Trash2 aria-hidden /> Clear all
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add gallery images</DialogTitle>
            <DialogDescription>Click images to add or remove them from the gallery.</DialogDescription>
          </DialogHeader>
          <LibraryGrid
            multiple
            selected={value}
            onPick={(path) => {
              if (value.includes(path)) onChange(value.filter((p) => p !== path));
              else if (remaining > 0) append([path]);
              else toast.error(`You can add up to ${max} gallery images.`);
            }}
          />
          <div className="flex justify-end">
            <Button type="button" onClick={() => setOpen(false)}>
              <Check aria-hidden /> Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
