import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Check, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import type { ProviderRegistrationValues } from "./registrationTypes";
import {
  isValidPhoneNumber,
  registrationInputClass,
  sanitizePhoneNumber,
} from "./registrationTypes";

type OwnerAccountStepProps = {
  emailVerified: boolean;
  otpSent: boolean;
  otpLoading: boolean;
  otpError: string;
  onEmailChange: (email: string) => void;
  onSendOtp: (email: string) => void;
  onVerifyOtp: (email: string, otp: string) => void;
};

export default function OwnerAccountStep({
  emailVerified,
  otpSent,
  otpLoading,
  otpError,
  onEmailChange,
  onSendOtp,
  onVerifyOtp,
}: OwnerAccountStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProviderRegistrationValues>();
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const password = watch("password", "");
  const email = watch("ownerEmail", "").trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordRules = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase and lowercase", valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "At least one number", valid: /\d/.test(password) },
  ];

  return (
    <section aria-labelledby="step-heading">
      <StepHeading
        icon={<UserRound size={20} />}
        eyebrow="01 / Create owner account"
        title="First, the person behind the care."
        description="These details will be used to manage your centre and communicate about your application."
      />
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <FormField
          label="Email address"
          controlId="owner-email"
          error={errors.ownerEmail?.message}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="owner-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.ownerEmail}
              className={`${registrationInputClass(!!errors.ownerEmail)} sm:flex-1`}
              {...register("ownerEmail", {
                required: "Enter an email address.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address.",
                },
                onChange: (event) => {
                  setOtp("");
                  onEmailChange(event.target.value);
                },
              })}
            />
            {!emailVerified && validEmail && (
              <button
                type="button"
                onClick={() => onSendOtp(email)}
                disabled={otpLoading}
                className="mt-2 min-h-9 shrink-0 rounded-lg border border-teal-700 px-3 py-1.5 text-xs font-bold text-teal-800 transition hover:bg-teal-50 disabled:opacity-60"
              >
                {otpLoading ? "Sending..." : otpSent ? "Resend code" : "Verify email"}
              </button>
            )}
            {emailVerified && (
              <span className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-700">
                <Check size={16} aria-hidden="true" />
                Verified
              </span>
            )}
          </div>
        </FormField>

        {otpSent && !emailVerified && (
          <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 sm:col-span-2">
            <label
              htmlFor="owner-email-otp"
              className="text-sm font-semibold text-slate-700"
            >
              Verification code
            </label>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Enter the 6-digit code sent to {email}.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="owner-email-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="000000"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className={`${registrationInputClass(!!otpError)} sm:max-w-48`}
                aria-invalid={!!otpError}
                aria-describedby={otpError ? "owner-email-otp-error" : undefined}
              />
              <button
                type="button"
                onClick={() => onVerifyOtp(email, otp)}
                disabled={otpLoading || otp.length !== 6}
                className="min-h-11 rounded-xl bg-teal-800 px-5 text-sm font-bold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {otpLoading ? "Verifying..." : "Verify code"}
              </button>
            </div>
            {otpError && (
              <p
                id="owner-email-otp-error"
                role="alert"
                className="mt-2 text-xs text-rose-600"
              >
                {otpError}
              </p>
            )}
          </div>
        )}

        {!emailVerified && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 sm:col-span-2">
            Verify your email address to continue with the owner account and centre details.
          </p>
        )}

        {emailVerified && (
          <>
            <FormField label="Owner's full name" error={errors.ownerName?.message}>
              <input
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
                className={registrationInputClass(!!errors.ownerName)}
                {...register("ownerName", {
                  required: "Enter the owner's name.",
                  minLength: { value: 2, message: "Enter at least 2 characters." },
                })}
              />
            </FormField>
            <FormField label="Phone number" error={errors.ownerPhone?.message}>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                pattern="[0-9]{10}"
                placeholder="10-digit phone number"
                className={registrationInputClass(!!errors.ownerPhone)}
                {...register("ownerPhone", {
                  required: "Enter a phone number.",
                  validate: (value) =>
                    isValidPhoneNumber(value) ||
                    "Enter exactly 10 digits, without spaces or symbols.",
                })}
                onChange={(event) =>
                  setValue(
                    "ownerPhone",
                    sanitizePhoneNumber(event.target.value),
                    { shouldValidate: true, shouldDirty: true },
                  )
                }
              />
            </FormField>
            <FormField
              label="Create password"
              controlId="owner-password"
              error={errors.password?.message}
            >
              <div className="relative">
                <input
                  id="owner-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className={`${registrationInputClass(!!errors.password)} pr-12`}
                  {...register("password", {
                    required: "Create a password.",
                    validate: (value) =>
                      (value.length >= 8 &&
                        /[A-Z]/.test(value) &&
                        /[a-z]/.test(value) &&
                        /\d/.test(value)) ||
                      "Use 8+ characters with uppercase, lowercase and a number.",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </FormField>
            <FormField
              label="Confirm password"
              controlId="owner-confirm-password"
              error={errors.confirmPassword?.message}
            >
              <div className="relative">
                <input
                  id="owner-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className={`${registrationInputClass(!!errors.confirmPassword)} pr-12`}
                  {...register("confirmPassword", {
                    required: "Confirm your password.",
                    validate: (value) =>
                      value === watch("password") || "Passwords do not match.",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </FormField>
            <ul className="mt-[-0.75rem] flex flex-wrap gap-x-4 gap-y-1 sm:col-span-2">
              {passwordRules.map((rule) => (
                <li
                  key={rule.label}
                  className={`inline-flex items-center gap-1 text-[11px] ${
                    rule.valid ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  <Check size={12} aria-hidden="true" />
                  {rule.label}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <p className="mt-6 flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-xs leading-5 text-teal-900">
        <LockKeyhole size={15} className="shrink-0" aria-hidden="true" />
        Your account details are kept private and used only for registration.
      </p>
    </section>
  );
}

export function StepHeading({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
        {icon}
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-teal-800">
        {eyebrow}
      </p>
      <h1 id="step-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export function FormField({
  label,
  controlId,
  error,
  children,
}: {
  label: string;
  controlId?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      {controlId ? (
        <>
          <label htmlFor={controlId} className="block text-sm font-semibold text-slate-700">
            {label}
          </label>
          <div>{children}</div>
        </>
      ) : (
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {children}
        </label>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
