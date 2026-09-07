"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BulkEnquiryForm } from "@/components/forms/bulk-enquiry-form";

export function BulkEnquiryDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:min-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Inquiry</DialogTitle>
          <DialogDescription>
            {productName
              ? `Tell us your requirement for "${productName}" and our team will share a custom quote.`
              : "Please fill out the form below for your bulk inquiry."}
          </DialogDescription>
        </DialogHeader>
        <BulkEnquiryForm
          productId={productId}
          productName={productName}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
