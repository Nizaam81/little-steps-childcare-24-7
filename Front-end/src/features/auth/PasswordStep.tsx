import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { RegistrationValues } from "./registrationTypes";
import { registrationInputClass } from "./registrationTypes";

type PasswordStepProps = {
  loading: boolean;
  onCreateAccount: (values: RegistrationValues) => void;
};

export default function PasswordStep({
  loading,
  onCreateAccount,
}: PasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useFormContext<RegistrationValues>();
  const password = watch("password");

  const passwordRules = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /\d/.test(password) },
  ];

  return (
    <>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-teal-800">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
          <rect
            x="5"
            y="10"
            width="14"
            height="11"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 10V7a4 4 0 0 1 8 0v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
        Make it secure.
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Create a strong password. Your email and password will be verified
        together to finish setting up your account.
      </p>

      <form
        className="mt-8 space-y-5"
        onSubmit={handleSubmit(onCreateAccount)}
        noValidate
      >
        <div>
          <label htmlFor="password" className="text-sm font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              aria-invalid={!!errors.password}
              className={`${registrationInputClass(!!errors.password)} pr-16`}
              {...register("password", {
                required: "Please create a password.",
                minLength: {
                  value: 8,
                  message: "Use at least 8 characters.",
                },
                maxLength: { value: 128, message: "Password is too long." },
                validate: (value) =>
                  (/[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)) ||
                  "Include uppercase, lowercase, and a number.",
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}

          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {passwordRules.map((rule) => (
              <li
                key={rule.label}
                className={`flex items-center gap-2 text-xs ${
                  rule.valid ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                <span aria-hidden="true">{rule.valid ? "✓" : "○"}</span>
                {rule.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-semibold text-slate-700"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter the same password again"
              aria-invalid={!!errors.confirmPassword}
              className={`${registrationInputClass(!!errors.confirmPassword)} pr-16`}
              {...register("confirmPassword", {
                required: "Please confirm your password.",
                validate: (value) =>
                  value === getValues("password") || "Passwords do not match.",
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-800"
              aria-label={
                showConfirmPassword
                  ? "Hide confirmation password"
                  : "Show confirmation password"
              }
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.confirmPassword && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal-800 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-teal-900 disabled:translate-y-0 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create my account →"}
        </button>
      </form>
    </>
  );
}
