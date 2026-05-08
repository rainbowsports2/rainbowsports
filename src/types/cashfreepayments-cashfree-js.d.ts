declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal";
    returnUrl?: string;
  }
  export interface Cashfree {
    checkout: (options: CashfreeCheckoutOptions) => Promise<unknown>;
  }
  export function load(opts: { mode: "production" | "sandbox" }): Promise<Cashfree>;
}