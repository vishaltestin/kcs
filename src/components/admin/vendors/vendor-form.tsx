"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Loader2, ReceiptText, Save, Store, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberField } from "@/components/admin/number-field";
import { ImagePicker } from "@/components/admin/image-picker";
import { createVendorAction, updateVendorAction } from "@/actions/admin/vendors";
import { VENDOR_STATUSES, vendorSchema } from "@/lib/validations/admin";
import { GST_STATE_CODES } from "@/lib/tax";
import { slugify } from "@/lib/utils";

const loginFields = {
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName: z.string().trim().min(1, "Last name is required."),
  loginEmail: z.string().trim().email("Enter a valid login email."),
  loginPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/\d/, "Password must contain a number."),
};

const editSchema = vendorSchema;
const createSchema = vendorSchema.extend(loginFields);

export type VendorFormValues = z.infer<typeof createSchema>;

export interface VendorFormVendor {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  email: string;
  phone: string | null;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  stateCode: string;
  logo: string | null;
  description: string | null;
  status: "ACTIVE" | "SUSPENDED";
  isDefault: boolean;
  sortOrder: number;
}

const STATE_OPTIONS = Object.entries(GST_STATE_CODES).map(([code, name]) => ({ code, name }));

export function VendorForm({ mode, vendor }: { mode: "create" | "edit"; vendor?: VendorFormVendor }) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: {
      name: vendor?.name ?? "",
      slug: vendor?.slug ?? "",
      legalName: vendor?.legalName ?? "",
      email: vendor?.email ?? "",
      phone: vendor?.phone ?? "",
      gstin: vendor?.gstin ?? "",
      pan: vendor?.pan ?? "",
      address: vendor?.address ?? "",
      city: vendor?.city ?? "",
      state: vendor?.state ?? "",
      pincode: vendor?.pincode ?? "",
      stateCode: vendor?.stateCode ?? "07",
      logo: vendor?.logo ?? "",
      description: vendor?.description ?? "",
      status: vendor?.status ?? "ACTIVE",
      sortOrder: vendor?.sortOrder ?? 0,
      firstName: "",
      lastName: "",
      loginEmail: "",
      loginPassword: "",
    },
  });

  const nameValue = form.watch("name");
  useEffect(() => {
    if (!slugTouched && nameValue) {
      form.setValue("slug", slugify(nameValue), { shouldValidate: false });
    }
  }, [nameValue, slugTouched, form]);

  const logoValue = form.watch("logo");

  const onSubmit = async (values: VendorFormValues) => {
    const formData = new FormData();
    if (isEdit) formData.set("id", String(vendor!.id));
    formData.set("name", values.name);
    formData.set("slug", values.slug);
    formData.set("legalName", values.legalName ?? "");
    formData.set("email", values.email);
    formData.set("phone", values.phone ?? "");
    formData.set("gstin", values.gstin ?? "");
    formData.set("pan", values.pan ?? "");
    formData.set("address", values.address ?? "");
    formData.set("city", values.city ?? "");
    formData.set("state", values.state ?? "");
    formData.set("pincode", values.pincode ?? "");
    formData.set("stateCode", values.stateCode);
    formData.set("logo", values.logo ?? "");
    formData.set("description", values.description ?? "");
    formData.set("status", values.status);
    formData.set("sortOrder", String(values.sortOrder));
    if (!isEdit) {
      formData.set("firstName", values.firstName ?? "");
      formData.set("lastName", values.lastName ?? "");
      formData.set("loginEmail", values.loginEmail ?? "");
      formData.set("loginPassword", values.loginPassword ?? "");
    }

    const result = isEdit
      ? await updateVendorAction(null, formData)
      : await createVendorAction(null, formData);

    if (result.ok) {
      toast.success(result.message ?? "Saved!");
      router.push("/admin/vendors");
    } else {
      toast.error(result.message);
      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.length) {
            form.setError(key as keyof VendorFormValues, { message: messages[0] });
          }
        }
      }
    }
  };

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-surface/70">
            <CardTitle className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Store className="size-4" aria-hidden />
              </span>
              Vendor details
            </CardTitle>
            <CardDescription>
              The seller identity shown on products (&ldquo;Sold by &hellip;&rdquo;) and on their storefront page.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. GiftCraft Studios" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storefront slug *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="giftcraft-studios"
                      onChange={(e) => {
                        setSlugTouched(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>Public page: /sellers/&lt;slug&gt;</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal / registered name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Registered company name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact email *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="vendor@company.in" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="98XXXXXXXX" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VENDOR_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === "ACTIVE" ? "Active" : "Suspended"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Suspended vendors are hidden from the storefront and blocked from the portal.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>About the vendor</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={3}
                      placeholder="Shown on the vendor's storefront page."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2">
              <ImagePicker
                value={logoValue ?? ""}
                onChange={(path) => form.setValue("logo", path, { shouldValidate: false })}
                label="Logo"
                hint="Shown on product pages and the vendor storefront."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-surface/70">
            <CardTitle className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ReceiptText className="size-4" aria-hidden />
              </span>
              GST &amp; address
            </CardTitle>
            <CardDescription>
              The state code decides CGST/SGST vs IGST on this vendor&apos;s sub-orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="gstin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GSTIN</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="07AAAAA0000A1Z5"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="AAAAA0000A"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stateCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST state code *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATE_OPTIONS.map(({ code, name }) => (
                        <SelectItem key={code} value={code}>
                          {code} — {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Street, locality" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN code</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="110001" inputMode="numeric" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort order</FormLabel>
                  <FormControl>
                    <NumberField field={field} integer />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {!isEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <UserRound className="size-4" aria-hidden />
                </span>
                Seller login
              </CardTitle>
              <CardDescription>
                The account this vendor signs in with at /vendor. They are verified automatically —
                share the credentials with them securely.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loginEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login email *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="email" placeholder="vendor@company.in" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loginPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary password *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="Min 8 chars, letter + number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            {isEdit ? "Save changes" : "Create vendor"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/vendors")}>
            <ArrowLeft aria-hidden /> Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
