"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import Image from "next/image";
import { ImagePlus, Loader2, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listPublicImagesAction } from "@/actions/admin/engagements";

/**
 * Picks an image from the /public/images library, uploads a new file
 * (stored under /public/uploads, served via /api/uploads), or accepts a
 * custom path/URL.
 */
export function ImagePicker({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (path: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoading, startTransition] = useTransition();

  useEffect(() => {
    if (!open || images.length > 0) return;
    startTransition(async () => {
      setImages(await listPublicImagesAction());
    });
  }, [open, images.length]);

  const filtered = filter
    ? images.filter((img) => img.toLowerCase().includes(filter.toLowerCase()))
    : images;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 rounded-md overflow-hidden border bg-muted shrink-0">
          {value ? (
            <Image src={value} alt="Selected" fill className="object-cover" sizes="64px" />
          ) : (
            <div className="h-full w-full grid place-items-center text-muted-foreground">
              <ImagePlus className="h-5 w-5" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/images/product.jpg, /api/uploads/… or https://…"
            aria-label={`${label} path`}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <ImagePlus className="mr-2 h-4 w-4" aria-hidden /> Browse / upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Image Library</DialogTitle>
                <DialogDescription>
                  Upload a new image, pick from /public/images, or paste a URL in the field.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="upload">
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1">
                    <Upload className="mr-1.5 size-4" aria-hidden /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="library" className="flex-1">
                    <ImagePlus className="mr-1.5 size-4" aria-hidden /> Library
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-4">
                  <UploadPanel
                    onUploaded={(path) => {
                      onChange(path);
                      setOpen(false);
                    }}
                  />
                </TabsContent>

                <TabsContent value="library" className="mt-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                    <Input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Filter by name…"
                      className="pl-9"
                    />
                  </div>

                  {isLoading ? (
                    <div className="py-16 grid place-items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] rounded-md border">
                      <div className="grid grid-cols-4 gap-2 p-2">
                        {filtered.map((img) => (
                          <button
                            key={img}
                            type="button"
                            onClick={() => {
                              onChange(img);
                              setOpen(false);
                            }}
                            className={`relative aspect-square rounded-md overflow-hidden border-2 hover:border-primary transition-colors ${
                              value === img ? "border-primary" : "border-transparent"
                            }`}
                            title={img}
                          >
                            <Image src={img} alt="" fill className="object-cover" sizes="120px" />
                          </button>
                        ))}
                        {filtered.length === 0 && (
                          <p className="col-span-4 text-sm text-muted-foreground text-center py-8">
                            No images match your filter.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

function UploadPanel({ onUploaded }: { onUploaded: (path: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pick = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const upload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const json = (await res.json()) as { ok: boolean; path?: string; message?: string };
      if (res.ok && json.ok && json.path) {
        toast.success("Image uploaded");
        onUploaded(json.path);
      } else {
        toast.error(json.message ?? "Upload failed.");
      }
    } catch {
      toast.error("Upload failed. Check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
        aria-label="Choose an image to upload"
      >
        {preview ? (
          <Image src={preview} alt="Upload preview" width={160} height={160} unoptimized className="h-40 w-auto rounded-lg object-contain" />
        ) : (
          <>
            <span className="grid size-14 place-items-center rounded-2xl bg-muted">
              <Upload className="size-6 text-muted-foreground" aria-hidden />
            </span>
            <span className="text-sm font-medium">Click to choose or drop an image here</span>
          </>
        )}
        <span className="text-xs text-muted-foreground">JPG, PNG, WebP, AVIF or GIF · up to 5 MB</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />

      {file && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</p>
          <Button
            type="button"
            onClick={upload}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" aria-hidden /> Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-1 size-4" aria-hidden /> Upload &amp; use
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
