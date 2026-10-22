import { useFormContext } from "react-hook-form";
import type { RegistrationValues } from "./registrationTypes";
import { registrationInputClass } from "./registrationTypes";

type EmailVerificationStepProps = {
  email: string;
  loading: boolean;
  onContinue: () => void;
  onResend: () => void;
  onChangeEmail: () => void;
};

export default function EmailVerificationStep({
  email,
  loading,
  onContinue,
  onResend,
  onChangeEmail,
}: EmailVerificationStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationValues>();

  return (
    <>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-teal-800">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
          <rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m4 7 8 6 8-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
        Check your inbox.
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        We sent a six-digit verification code to{" "}
        <strong className="break-all text-slate-700">{email}</strong>. Enter it
        below, then create a password to verify your email.
      </p>

      <form
        className="mt-8 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onContinue();
        }}
        noValidate
      >
        <div>
          <label htmlFor="otp" className="text-sm font-semibold text-slate-700">
            Verification code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="Enter 6-digit code"
            aria-invalid={!!errors.otp}
            className={`${registrationInputClass(!!errors.otp)} text-center text-xl font-bold tracking-[0.35em]`}
            {...register("otp", {
              required: "Please enter the verification code.",
              pattern: {
                value: /^\d{6}$/,
                message: "Enter all 6 digits.",
              },
              onChange: (event) => {
                event.target.value = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);
              },
            })}
          />
          {errors.otp && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {errors.otp.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal-800 px-5 py-4 text-sm font-bold text-white transition hover:bg-teal-900 disabled:opacity-60"
        >
          {loading ? "Continuing..." : "Continue →"}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={onResend}
            disabled={loading}
            className="font-semibold text-teal-800 hover:underline disabled:opacity-50"
          >
            Resend code
          </button>
          <button
            type="button"
            onClick={onChangeEmail}
            disabled={loading}
            className="text-slate-500 hover:text-slate-800"
          >
            Change email
          </button>
        </div>
      </form>
    </>
  );
}
