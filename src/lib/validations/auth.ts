import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
    lastName: z.string().trim().min(1, "Last name is required."),
    mobile: z
      .string()
      .trim()
      .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .regex(/[A-Za-z]/, "Password must contain a letter.")
      .regex(/\d/, "Password must contain a number."),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName: z.string().trim().min(1, "Last name is required."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateCompanySchema = z.object({
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  gstNo: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z]{0,15}$/, "GST number must be 15 alphanumeric characters.")
    .optional()
    .or(z.literal("")),
  panNo: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{5}\d{4}[A-Za-z]{0,1}$/, "Enter a valid PAN (e.g. ABCDE1234F).")
    .optional()
    .or(z.literal("")),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

const addressFields = {
  address: z.string().trim().min(5, "Address must be at least 5 characters."),
  city: z.string().trim().min(2, "City is required."),
  state: z.string().trim().min(2, "State is required."),
  pincode: z.string().trim().regex(/^\d{6}$/, "PIN code must be 6 digits."),
};

export const updateAddressSchema = z
  .object({
    billingAddress: z.string().trim().min(5, "Billing address is required."),
    billingCity: z.string().trim().min(2, "City is required."),
    billingState: z.string().trim().min(2, "State is required."),
    billingPincode: z.string().trim().regex(/^\d{6}$/, "PIN code must be 6 digits."),
    sameAsBilling: z.boolean(),
    shippingAddress: z.string().trim().optional().or(z.literal("")),
    shippingCity: z.string().trim().optional().or(z.literal("")),
    shippingState: z.string().trim().optional().or(z.literal("")),
    shippingPincode: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      data.sameAsBilling ||
      (Boolean(data.shippingAddress && data.shippingAddress.length >= 5) &&
        Boolean(data.shippingCity) &&
        Boolean(data.shippingState) &&
        /^\d{6}$/.test(data.shippingPincode ?? "")),
    {
      message: "Complete the shipping address or mark it same as billing.",
      path: ["shippingAddress"],
    }
  );

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .regex(/[A-Za-z]/, "Password must contain a letter.")
      .regex(/\d/, "Password must contain a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export { addressFields };
