/**
 * Minimal typings for `@cashfreepayments/cashfree-js` (the package ships
 * without TypeScript definitions). Covers exactly what we use: loading the
 * SDK and opening the hosted checkout.
 */
declare module "@cashfreepayments/cashfree-js" {
  export type CashfreeMode = "sandbox" | "production";

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    /** "_self" navigates the current tab to Cashfree's hosted page. */
    redirectTarget?: "_self" | "_blank" | "_modal";
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): void;
  }

  export function load(options: { mode: CashfreeMode }): Promise<CashfreeInstance>;
}
