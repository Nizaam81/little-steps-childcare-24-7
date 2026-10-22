import { useFormContext } from "react-hook-form";
import type { RegistrationValues } from "./registrationTypes";
import { registrationInputClass } from "./registrationTypes";

type ParentDetailsStepProps = {
  loading: boolean;
  onContinue: () => void;
};

export default function ParentDetailsStep({
  loading,
  onContinue,
}: ParentDetailsStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext<RegistrationValues>();

  return (
    <>
      <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
        Let's get started.
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Tell us a little about yourself to create your family account.
      </p>

      <form
        className="mt-8 space-y-5"
        onSubmit={handleSubmit(onContinue)}
        noValidate
      >
        <div>
          <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
            Full name
          </label>
          <input
            id="fullName"
            autoComplete="name"
            placeholder="e.g. Alex Morgan"
            aria-invalid={!!errors.fullName}
            className={registrationInputClass(!!errors.fullName)}
            {...register("fullName", {
              required: "Please enter your full name.",
              minLength: {
                value: 2,
                message: "Name must contain at least 2 characters.",
              },
              maxLength: { value: 100, message: "Name is too long." },
              validate: (value) =>
                value.trim().length >= 2 || "Please enter a valid name.",
            })}
          />
          {errors.fullName && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            className={registrationInputClass(!!errors.email)}
            {...register("email", {
              required: "Please enter your email address.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address.",
              },
            })}
          />
          {errors.email && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="text-sm font-semibold text-slate-700"
          >
            Phone number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            placeholder="e.g. +1 555 010 1234"
            aria-invalid={!!errors.phoneNumber}
            className={registrationInputClass(!!errors.phoneNumber)}
            {...register("phoneNumber", {
              required: "Please enter your phone number.",
              validate: (value) =>
                value.trim().length > 0 || "Please enter your phone number.",
            })}
          />
          {errors.phoneNumber && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-700/20 disabled:translate-y-0 disabled:opacity-60"
        >
          {loading ? "Sending verification code..." : "Continue"}
          {!loading && <span aria-hidden="true">→</span>}
        </button>
      </form>
    </>
  );
}
