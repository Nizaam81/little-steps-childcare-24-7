import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, CheckCircle2, Heart, ShieldCheck } from "lucide-react";
import CentreDetailsStep from "./CentreDetailsStep";
import DocumentsStep from "./DocumentsStep";
import OwnerAccountStep from "./OwnerAccountStep";
import RegistrationProgress from "./RegistrationProgress";
import ReviewStep from "./ReviewStep";
import ServicesStep from "./ServicesStep";
import VerificationStep from "./VerificationStep";
import {
  requestOwnerEmailOtp,
  submitProviderRegistration,
  verifyOwnerEmailOtp,
} from "./providerRegistrationApi";
import type {
  ProviderRegistrationResponse,
  ProviderRegistrationValues,
  RegistrationStep,
} from "./registrationTypes";

const initialValues: ProviderRegistrationValues = {
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  password: "",
  confirmPassword: "",
  centreName: "",
  address: "",
  district: "",
  centreEmail: "",
  centrePhone: "",
  ageGroups: [],
  careTypes: [],
  capacity: "",
  openingTime: "",
  closingTime: "",
  dailyPrice: "",
  monthlyPrice: "",
  termsAccepted: false,
};

const fieldsByStep = {
  1: [
    "ownerName",
    "ownerEmail",
    "ownerPhone",
    "password",
    "confirmPassword",
  ],
  2: ["centreName", "address", "district", "centreEmail", "centrePhone"],
  3: ["capacity", "openingTime", "closingTime", "dailyPrice", "monthlyPrice"],
  5: ["termsAccepted"],
} as const;

export default function ProviderRegistration() {
  const methods = useForm<ProviderRegistrationValues>({
    mode: "onTouched",
    defaultValues: initialValues,
  });
  const [step, setStep] = useState<RegistrationStep>(1);
  const [tradeLicense, setTradeLicense] = useState<File | null>(null);
  const [supportingDocuments, setSupportingDocuments] = useState<File[]>([]);
  const [documentError, setDocumentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSentFor, setOtpSentFor] = useState("");
  const [emailVerifiedFor, setEmailVerifiedFor] = useState("");
  const [otpError, setOtpError] = useState("");
  const [response, setResponse] = useState<ProviderRegistrationResponse | null>(
    null,
  );
  const ownerEmail = useWatch({
    control: methods.control,
    name: "ownerEmail",
    defaultValue: "",
  })
    .trim()
    .toLowerCase();
  const emailVerified = ownerEmail !== "" && emailVerifiedFor === ownerEmail;

  const handleOwnerEmailChange = () => {
    setOtpSentFor("");
    setEmailVerifiedFor("");
    setOtpError("");
  };

  const sendEmailOtp = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    setOtpLoading(true);
    setOtpError("");
    try {
      await requestOwnerEmailOtp(normalizedEmail);
      setOtpSentFor(normalizedEmail);
      setEmailVerifiedFor("");
      toast.success(`A verification code was sent to ${normalizedEmail}.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't send a verification code. Please try again.";
      setOtpError(message);
      toast.error(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyEmailOtp = async (email: string, otp: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (otpSentFor !== normalizedEmail) {
      setOtpError("Request a new verification code for this email address.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      await verifyOwnerEmailOtp(normalizedEmail, otp);
      setEmailVerifiedFor(normalizedEmail);
      toast.success("Email address verified.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't verify that code. Please try again.";
      setOtpError(message);
      toast.error(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const validateServices = () => {
    const values = methods.getValues();
    let isValid = true;
    methods.clearErrors([
      "ageGroups",
      "careTypes",
      "closingTime",
      "dailyPrice",
      "monthlyPrice",
    ]);

    if (!values.ageGroups.length) {
      methods.setError("ageGroups", {
        type: "manual",
        message: "Choose at least one age group.",
      });
      isValid = false;
    }
    if (!values.careTypes.length) {
      methods.setError("careTypes", {
        type: "manual",
        message: "Choose at least one care option.",
      });
      isValid = false;
    }
    if (
      values.openingTime &&
      values.closingTime &&
      values.openingTime >= values.closingTime
    ) {
      methods.setError("closingTime", {
        type: "manual",
        message: "Closing time must be later than opening time.",
      });
      isValid = false;
    }
    if (values.careTypes.includes("Daily care") && values.dailyPrice === "") {
      methods.setError("dailyPrice", {
        type: "manual",
        message: "Enter your daily rate for daily care.",
      });
      isValid = false;
    }
    if (values.careTypes.includes("Monthly care") && values.monthlyPrice === "") {
      methods.setError("monthlyPrice", {
        type: "manual",
        message: "Enter your monthly rate for monthly care.",
      });
      isValid = false;
    }
    return isValid;
  };

  const continueStep = async () => {
    if (step === 1 || step === 2 || step === 3 || step === 5) {
      if (step === 1 && !emailVerified) {
        await methods.trigger("ownerEmail");
        toast.error("Verify your email address before continuing.");
        return;
      }
      const fields = fieldsByStep[step];
      const valid = await methods.trigger([...fields]);
      if (!valid) return;
      if (step === 3 && !validateServices()) return;
      if (step === 5) {
        await submitApplication();
        return;
      }
    }
    if (step === 4) {
      if (!tradeLicense) {
        setDocumentError("A trade licence is required to continue.");
        return;
      }
      setDocumentError("");
    }
    setApiError("");
    setStep((current) => (current + 1) as RegistrationStep);
  };

  const submitApplication = async () => {
    if (!tradeLicense) {
      setStep(4);
      setDocumentError("A trade licence is required to submit your application.");
      return;
    }

    setSubmitting(true);
    setApiError("");
    try {
      const result = await submitProviderRegistration(
        methods.getValues(),
        tradeLicense,
        supportingDocuments,
      );
      if (
        !result ||
        typeof result.applicationId !== "string" ||
        result.applicationId.trim() === "" ||
        result.status !== "pending_verification"
      ) {
        throw new Error(
          "The server returned an unexpected registration response. Please contact support before retrying.",
        );
      }
      setResponse(result);
      setStep(6);
      toast.success("Your centre registration has been submitted.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to submit your application. Please try again.";
      setApiError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f8f6] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex items-center justify-between sm:mb-7">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-white">
              <Heart size={19} fill="currentColor" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-800">
              Little Steps
            </span>
          </Link>
          <Link
            to="/"
            className="text-sm font-semibold text-slate-500 transition hover:text-teal-800"
          >
            Back to home
          </Link>
        </header>

        <div className="grid overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_80px_-35px_rgba(24,70,58,0.28)] lg:grid-cols-[0.76fr_1.24fr]">
          <aside className="relative hidden overflow-hidden bg-[#e7f3ee] p-8 lg:flex lg:flex-col lg:justify-between xl:p-10">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#c4e5d8]/70 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">
                Provider onboarding
              </p>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-800 xl:text-4xl">
                A little care can make a big difference.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Register your daycare centre to connect with families looking for trusted, caring support.
              </p>
              <ul className="mt-8 space-y-5">
                <Benefit
                  icon={<CheckCircle2 size={18} />}
                  title="Simple, guided steps"
                  description="Save your progress while you complete each section."
                />
                <Benefit
                  icon={<ShieldCheck size={18} />}
                  title="A careful review"
                  description="Our team checks your details and supporting documents."
                />
              </ul>
            </div>
            <div className="relative rounded-2xl border border-white/80 bg-white/75 p-5">
              <p className="text-sm font-bold text-slate-800">
                Your next little step starts here.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Have your trade licence and centre contact details handy.
              </p>
            </div>
          </aside>

          <section className="min-w-0 px-5 py-7 sm:px-8 sm:py-9 xl:px-10">
            <div className="mb-6 lg:hidden">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">
                Provider onboarding
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800">
                Register your daycare centre
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Complete six simple steps to submit your centre for review.
              </p>
            </div>

            <RegistrationProgress currentStep={step} />

            <FormProvider {...methods}>
              <div key={step} className="animate-[fadeIn_0.3s_ease-out]">
                {step === 1 && (
                  <OwnerAccountStep
                    emailVerified={emailVerified}
                    otpSent={otpSentFor !== "" && otpSentFor === ownerEmail}
                    otpLoading={otpLoading}
                    otpError={otpError}
                    onEmailChange={handleOwnerEmailChange}
                    onSendOtp={sendEmailOtp}
                    onVerifyOtp={verifyEmailOtp}
                  />
                )}
                {step === 2 && <CentreDetailsStep />}
                {step === 3 && <ServicesStep />}
                {step === 4 && (
                  <DocumentsStep
                    tradeLicense={tradeLicense}
                    supportingDocuments={supportingDocuments}
                    error={documentError}
                    onTradeLicenseChange={(file) => {
                      setTradeLicense(file);
                      setDocumentError("");
                    }}
                    onSupportingDocumentsChange={setSupportingDocuments}
                  />
                )}
                {step === 5 && (
                  <ReviewStep
                    tradeLicense={tradeLicense}
                    supportingDocuments={supportingDocuments}
                  />
                )}
                {step === 6 && response && (
                  <VerificationStep response={response} />
                )}
              </div>
            </FormProvider>

            {apiError && step === 5 && (
              <div
                className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
                role="alert"
              >
                <p className="font-semibold">Your application was not submitted.</p>
                <p>{apiError}</p>
                <p className="mt-1 text-xs">
                  Your information is still here. Try again after the registration API is available.
                </p>
              </div>
            )}

            {step !== 6 && (
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setApiError("");
                      setStep((current) => (current - 1) as RegistrationStep);
                    }}
                    disabled={submitting}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back
                  </button>
                ) : (
                  <p className="text-xs text-slate-400">
                    Continue through each step to complete your application.
                  </p>
                )}
                <button
                  type="button"
                  onClick={continueStep}
                  disabled={submitting}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-800 px-6 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-700/20 disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting
                    ? "Submitting application..."
                    : step === 5
                      ? "Submit application"
                      : step === 4
                        ? "Review application"
                        : "Continue"}
                  {!submitting && <ArrowRight size={16} aria-hidden="true" />}
                </button>
              </div>
            )}
          </section>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Your information is submitted securely for provider verification.
        </p>
      </div>
    </main>
  );
}

function Benefit({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-800 shadow-sm">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-slate-800">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </li>
  );
}
