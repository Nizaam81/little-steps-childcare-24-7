import axios from "axios";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../../config/axios";
import EmailVerificationStep from "./EmailVerificationStep";
import ParentDetailsStep from "./ParentDetailsStep";
import PasswordStep from "./PasswordStep";
import type { RegistrationStep, RegistrationValues } from "./registrationTypes";

async function apiPost<T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> {
  try {
    const response = await apiClient.post<T>(endpoint, body);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data: unknown = error.response?.data;
      if (data && typeof data === "object") {
        const apiError = data as { message?: unknown; error?: unknown };
        if (typeof apiError.message === "string" && apiError.message) {
          throw new Error(apiError.message);
        }
        if (typeof apiError.error === "string" && apiError.error) {
          throw new Error(apiError.error);
        }
      }

      throw new Error(error.message || "Something went wrong. Please try again.");
    }

    throw error;
  }
}

export default function ParentRegistration() {
  const [step, setStep] = useState<RegistrationStep>(1);
  const [loading, setLoading] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const methods = useForm<RegistrationValues>({
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });
  const email = methods.watch("email");

  const submitParentDetails = async () => {
    setLoading(true);
    try {
      const fullName = methods.getValues("fullName").trim();
      const normalizedEmail = methods.getValues("email").trim().toLowerCase();
      const phoneNumber = methods.getValues("phoneNumber").trim();

      await apiPost("/register", {
        fullName,
        email: normalizedEmail,
        phoneNumber,
      });
      await apiPost("/register/send-otp", { email: normalizedEmail });

      setVerifiedEmail(normalizedEmail);
      setStep(2);
      toast.success("Verification code sent to your email.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start registration.",
      );
    } finally {
      setLoading(false);
    }
  };

  const continueToPassword = async () => {
    const valid = await methods.trigger("otp");
    if (!valid) return;

    setStep(3);
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      await apiPost("/register/send-otp", {
        email: (verifiedEmail || email).trim().toLowerCase(),
      });

      methods.setValue("otp", "");
      toast.success("A new verification code has been sent.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to resend the code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (values: RegistrationValues) => {
    setLoading(true);
    try {
      await apiPost("/register/verify-otp", {
        email: verifiedEmail,
        otp: values.otp,
        password: values.password,
      });

      methods.setValue("otp", "");
      methods.setValue("password", "");
      methods.setValue("confirmPassword", "");
      setStep(4);
      toast.success("Your Little Steps account is ready!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f8f5] px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white bg-white shadow-[0_24px_80px_-30px_rgba(24,70,58,0.25)] lg:grid-cols-2">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#e4f3ee] p-10 lg:flex xl:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#c5e9dc]/60 blur-2xl" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-white/70 blur-2xl" />

          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-800 text-xl text-white">
                ♧
              </span>
              <span className="font-heading text-xl font-extrabold tracking-tight text-slate-800">
                Little Steps
              </span>
            </Link>

            <div className="mt-24">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
                A little help. A lot of peace of mind.
              </p>
              <h1 className="mt-5 max-w-md font-heading text-4xl font-extrabold leading-tight tracking-tight text-slate-800 xl:text-5xl">
                Care that fits your family's life.
              </h1>
              <p className="mt-5 max-w-sm text-base leading-7 text-slate-600">
                Create your family account to discover trusted childcare,
                manage bookings, and spend more time on what matters.
              </p>
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/80 bg-white/80 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                ✓
              </span>
              <div>
                <p className="font-bold text-slate-800">
                  Your family's safety comes first.
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Verify your email to help keep your account secure.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-8 sm:px-10 sm:py-12 lg:px-12">
          <div className="mb-9 flex items-center justify-between lg:justify-end">
            <Link
              to="/"
              className="font-heading text-lg font-extrabold text-slate-800 lg:hidden"
            >
              Little Steps
            </Link>
            <p className="text-sm text-slate-500">
              Already a member?{" "}
              <Link
                to="/login"
                className="font-bold text-teal-800 hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>

          {step !== 4 && (
            <>
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-teal-800">STEP {step} OF 3</span>
                  <span className="text-slate-400">
                    {step === 1
                      ? "Your details"
                      : step === 2
                        ? "Email verification"
                        : "Secure your account"}
                  </span>
                </div>

                <div
                  className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={3}
                  aria-valuenow={step}
                  aria-label="Registration progress"
                >
                  <div
                    className="h-full rounded-full bg-teal-700 transition-all duration-500"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>

              <FormProvider {...methods}>
                <div key={step} className="animate-[fadeIn_0.3s_ease-out]">
                  {step === 1 && (
                    <ParentDetailsStep
                      loading={loading}
                      onContinue={submitParentDetails}
                    />
                  )}
                  {step === 2 && (
                    <EmailVerificationStep
                      email={verifiedEmail}
                      loading={loading}
                      onContinue={continueToPassword}
                      onResend={resendOtp}
                      onChangeEmail={() => {
                        methods.setValue("otp", "");
                        setStep(1);
                      }}
                    />
                  )}
                  {step === 3 && (
                    <PasswordStep
                      loading={loading}
                      onCreateAccount={createAccount}
                    />
                  )}
                </div>
              </FormProvider>
            </>
          )}

          {step === 4 && (
            <div className="py-8 text-center animate-[fadeIn_0.3s_ease-out]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-10 w-10"
                  aria-hidden="true"
                >
                  <path
                    d="m5 12 4 4L19 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                Registration complete
              </p>
              <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
                Welcome to Little Steps!
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Your account has been created successfully. You're one little
                step closer to finding care that fits your family.
              </p>

              <Link
                to="/login"
                className="mt-8 flex w-full items-center justify-center rounded-xl bg-teal-800 px-5 py-4 text-sm font-bold text-white transition hover:bg-teal-900"
              >
                Continue to login →
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
