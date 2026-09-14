"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImagePicker } from "@/components/admin/image-picker";
import { updateHomeBandAction } from "@/actions/admin/home-bands";
import { HOME_BAND_LIMITS, type HomeBandFormValue } from "@/lib/home-bands";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types";

/**
 * One band, one form. Every field except the headline may stay empty — an empty
 * field falls back to the copy that shipped with the design, so a half-filled
 * band never renders as a hole on the home page.
 */
export function HomeBandForm({ band }: { band: HomeBandFormValue }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(updateHomeBandAction, null);
  const [image, setImage] = useState(band.image);
  const [isActive, setIsActive] = useState(band.isActive);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message ?? "Saved.");
    else toast.error(state.message);
  }, [state]);

  const errors = (!state || state.ok ? {} : (state.fieldErrors ?? {})) as Record<string, string[] | undefined>;
  const isVideo = band.slot === "video";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slot" value={band.slot} />
      <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Eyebrow" hint={`Sits above the headline, in caps. Max ${HOME_BAND_LIMITS.eyebrow} characters.`} error={errors.eyebrow}>
          <Input name="eyebrow" defaultValue={band.eyebrow} maxLength={HOME_BAND_LIMITS.eyebrow} placeholder="Best Price & High Quality" />
        </Field>

        <Field label="Button label" hint="Leave blank to hide the button." error={errors.ctaLabel}>
          <Input name="ctaLabel" defaultValue={band.ctaLabel} maxLength={HOME_BAND_LIMITS.ctaLabel} placeholder="Shop Now" />
        </Field>
      </div>

      <Field label="Headline" error={errors.title}>
        <Input name="title" defaultValue={band.title} maxLength={HOME_BAND_LIMITS.title} required />
      </Field>

      <Field label="Support line" hint={`One or two sentences. Max ${HOME_BAND_LIMITS.subtitle} characters.`} error={errors.subtitle}>
        <Textarea name="subtitle" defaultValue={band.subtitle} rows={2} maxLength={HOME_BAND_LIMITS.subtitle} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Button link" hint="Internal path (/category/drinkwares) or a full https:// URL." error={errors.ctaHref}>
          <Input name="ctaHref" defaultValue={band.ctaHref} maxLength={HOME_BAND_LIMITS.ctaHref} placeholder="/category/drinkwares" className="font-mono text-[13px]" />
        </Field>
        {isVideo && (
          <Field label="Video file" hint="Blank plays the showreel bundled with the app." error={errors.videoUrl}>
            <Input name="videoUrl" defaultValue={band.videoUrl ?? ""} maxLength={300} placeholder="/video/procter-promo-video.mp4" className="font-mono text-[13px]" />
          </Field>
        )}
      </div>

      <Field label="Background artwork" hint="Landscape art reads best — the band crops the sides, never the top." error={errors.image}>
        <input type="hidden" name="image" value={image} />
        <ImagePicker value={image} onChange={setImage} label="Upload or pick" />
      </Field>

      <label className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3")}>
        <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
        <span>
          <span className="block text-[13px] font-medium">Show on the home page</span>
          <span className="block text-xs text-muted-foreground">
            Switch off to take the whole band off the storefront — the copy below is kept for next season.
          </span>
        </span>
      </label>

      <div className="flex items-center justify-between gap-4 border-t pt-4">
        <p className="text-xs text-muted-foreground">Saved bands revalidate the home page immediately — no rebuild, no deploy.</p>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          Save band
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">{label}</Label>
      {children}
      {error?.[0] ? (
        <p className="text-xs text-destructive">{error[0]}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
