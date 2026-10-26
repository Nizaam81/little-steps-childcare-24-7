import axios from "axios";
import { getApiErrorMessage } from "../../utils/api-error-message";
import type {
  ProviderRegistrationResponse,
  ProviderRegistrationValues,
} from "./registrationTypes";

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const providerApi = axios.create({
  baseURL: `${apiBaseUrl}/api/childcare`,
});

export const providerRegistrationEndpoint = "/registrations";
export const emailOtpRequestEndpoint =
  "/registrations/email-verification/send";
export const emailOtpVerifyEndpoint =
  "/registrations/email-verification/verify";

export async function requestOwnerEmailOtp(email: string): Promise<void> {
  try {
    await providerApi.post(emailOtpRequestEndpoint, { email });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "We couldn't send a verification code. Please try again.",
      ),
    );
  }
}

export async function verifyOwnerEmailOtp(
  email: string,
  otp: string,
): Promise<void> {
  try {
    const response = await providerApi.post<{ verified?: unknown }>(
      emailOtpVerifyEndpoint,
      { email, otp },
    );
    if (response.data?.verified !== true) {
      throw new Error("The server did not confirm this email address.");
    }
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "We couldn't verify that code. Please try again."),
    );
  }
}

export async function submitProviderRegistration(
  values: ProviderRegistrationValues,
  tradeLicense: File,
  supportingDocuments: File[],
): Promise<ProviderRegistrationResponse> {
  const { confirmPassword: _confirmPassword, termsAccepted: _termsAccepted, ...application } =
    values;
  const body = new FormData();

  body.append("application", JSON.stringify(application));
  body.append("tradeLicense", tradeLicense);
  supportingDocuments.forEach((file) => body.append("supportingDocuments", file));

  try {
    const response = await providerApi.post<ProviderRegistrationResponse>(
      providerRegistrationEndpoint,
      body,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "We couldn't submit your application. Please try again.",
      ),
    );
  }
}
