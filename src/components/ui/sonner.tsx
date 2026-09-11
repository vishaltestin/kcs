"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

/**
 * Site-wide toast styling.
 *
 * Always light (matches the storefront regardless of OS dark mode), white
 * card with a soft ring and a coloured icon tile per intent — success stays
 * on-brand (charcoal text, green icon only) instead of a solid green box.
 * Rendering is fully controlled via `unstyled` so sonner's defaults never
 * leak through.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      offset={{ top: 16, right: 16 }}
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      gap={10}
      visibleToasts={4}
      duration={3800}
      closeButton
      icons={{
        success: <CheckCircle2 className="size-[18px]" strokeWidth={2.2} />,
        info: <Info className="size-[18px]" strokeWidth={2.2} />,
        warning: <AlertTriangle className="size-[18px]" strokeWidth={2.2} />,
        error: <XCircle className="size-[18px]" strokeWidth={2.2} />,
        loading: <Loader2 className="size-[18px] animate-spin" strokeWidth={2.2} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "kcs-toast",
          title: "kcs-toast__title",
          description: "kcs-toast__description",
          icon: "kcs-toast__icon",
          content: "kcs-toast__content",
          actionButton: "kcs-toast__action",
          cancelButton: "kcs-toast__cancel",
          closeButton: "kcs-toast__close",
          success: "kcs-toast--success",
          error: "kcs-toast--error",
          warning: "kcs-toast--warning",
          info: "kcs-toast--info",
          loading: "kcs-toast--loading",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
