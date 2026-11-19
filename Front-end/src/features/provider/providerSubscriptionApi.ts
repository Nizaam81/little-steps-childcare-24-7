import { providerApi } from "../auth/providerLoginApi";

export interface ProviderSubscriptionDetails {
  plan: {
    priceId: string;
    amount: number | null;
    currency: string;
    interval: string | null;
    intervalCount: number;
  };
  subscription: {
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export async function fetchProviderSubscription(): Promise<ProviderSubscriptionDetails> {
  const response = await providerApi.get<ProviderSubscriptionDetails>("/subscription");
  return response.data;
}

export async function createProviderCheckoutSession(): Promise<string> {
  const response = await providerApi.post<{ url: string }>("/subscription/checkout");
  return response.data.url;
}

export async function createProviderBillingPortalSession(): Promise<string> {
  const response = await providerApi.post<{ url: string }>("/subscription/portal");
  return response.data.url;
}

export async function confirmProviderCheckout(sessionId: string): Promise<void> {
  await providerApi.post("/subscription/confirm", { sessionId });
}
