
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../../config/axios";
import { getApiErrorMessage } from "../../utils/api-error-message";

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await apiClient.post<{ token?: unknown; message?: string }>("/login", {
        email: data.email.trim(),
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (typeof response.data.token !== "string" || !response.data.token) {
        throw new Error("The login response did not include an authentication token.");
      }

      localStorage.setItem("parentToken", response.data.token);
      toast.success(
        response.data?.message || "Welcome back to Little Steps!"
      );

      navigate("/parent/dashboard", { replace: true });
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to sign in. Please check your details and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f9f7] text-[#26384b]">
      {/* Navigation */}
      <header className="border-b border-[#e5eeea] bg-white/90">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#278a70]"
            aria-label="Little Steps home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f3ed] text-[#278a70]">
              <Heart size={22} strokeWidth={2.5} />
            </span>

            <span className="font-['Manrope'] text-xl font-extrabold tracking-tight">
              Little <span className="text-[#278a70]">Steps</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <span className="hidden text-[#697989] sm:inline">
              New to Little Steps?
            </span>
            <Link
              to="/register"
              className="rounded-xl border border-[#d8e6e0] bg-white px-3 py-2 font-semibold transition hover:border-[#278a70] hover:text-[#278a70] sm:px-4"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      {/* Login section */}
      <section className="mx-auto grid min-h-[calc(100svh-73px)] max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
        {/* Left panel */}
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d7ebe3] bg-white px-3.5 py-2 text-xs font-semibold text-[#278a70] shadow-sm sm:text-sm">
            <Sparkles size={15} />
            A little help. A lot of peace of mind.
          </div>

          <h1 className="font-['Manrope'] text-3xl font-extrabold leading-tight tracking-tight text-[#26384b] sm:text-4xl md:text-5xl lg:text-[52px]">
            Welcome back to
            <span className="mt-1 block text-[#278a70]">
              your little world.
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-7 text-[#687a88] sm:text-base sm:leading-8">
            Your family, your schedule, your trusted care — everything
            in one calm place. Sign in to pick up right where you left off.
          </p>

          {/* Trust points */}
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-[#e3ece7] bg-white p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f5ed] text-[#278a70]">
                <ShieldCheck size={21} />
              </span>
              <div>
                <p className="text-sm font-bold">Trusted care</p>
                <p className="mt-0.5 text-xs text-[#778691]">
                  Verified providers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#e3ece7] bg-white p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f5ed] text-[#278a70]">
                <Heart size={21} />
              </span>
              <div>
                <p className="text-sm font-bold">Family first</p>
                <p className="mt-0.5 text-xs text-[#778691]">
                  Care on your terms
                </p>
              </div>
            </div>
          </div>

          {/* Decorative illustration */}
          <div className="relative mt-8 hidden overflow-hidden rounded-3xl border border-[#dcece5] bg-[#e5f4ee] p-6 sm:block md:p-8">
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/60 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[#bde7d5]/70 blur-2xl" />

            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#278a70] shadow-sm">
                <Heart size={25} />
              </div>
              <div>
                <p className="font-['Manrope'] text-lg font-extrabold">
                  Little moments matter.
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#617b76]">
                  Spend less time managing care and more time making
                  memories with the people you love.
                </p>
              </div>
            </div>

            <div className="relative mt-6 flex flex-wrap gap-2">
              {["Easy bookings", "Care updates", "Peace of mind"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#347963]"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right panel: login form */}
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
          <div className="rounded-3xl border border-[#e3ebe7] bg-white p-5 shadow-[0_20px_70px_-35px_rgba(38,56,75,0.25)] sm:p-8 md:p-9">
            <div className="mb-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f4ee] text-[#278a70]">
                <LockKeyhole size={23} />
              </div>

              <h2 className="font-['Manrope'] text-2xl font-extrabold tracking-tight sm:text-3xl">
                Sign in
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#71808c]">
                Enter your details to access your parent account.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#34475a]"
                >
                  Email address
                </label>

                <div
                  className={`flex items-center rounded-xl border bg-white transition focus-within:ring-4 ${
                    errors.email
                      ? "border-red-400 focus-within:ring-red-100"
                      : "border-[#dce6e1] focus-within:border-[#278a70] focus-within:ring-[#278a70]/10"
                  }`}
                >
                  <Mail
                    size={19}
                    className="ml-4 shrink-0 text-[#8a9a9e]"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="min-w-0 flex-1 rounded-xl bg-transparent px-3.5 py-3.5 text-sm text-[#26384b] outline-none placeholder:text-[#a1adb5]"
                    {...register("email", {
                      required: "Email address is required.",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address.",
                      },
                    })}
                  />
                </div>

                {errors.email && (
                  <p
                    id="email-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-red-600"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-[#34475a]"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#278a70] transition hover:text-[#17644f] hover:underline sm:text-sm"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div
                  className={`flex items-center rounded-xl border bg-white transition focus-within:ring-4 ${
                    errors.password
                      ? "border-red-400 focus-within:ring-red-100"
                      : "border-[#dce6e1] focus-within:border-[#278a70] focus-within:ring-[#278a70]/10"
                  }`}
                >
                  <LockKeyhole
                    size={19}
                    className="ml-4 shrink-0 text-[#8a9a9e]"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className="min-w-0 flex-1 bg-transparent px-3.5 py-3.5 text-sm text-[#26384b] outline-none placeholder:text-[#a1adb5]"
                    {...register("password", {
                      required: "Password is required.",
                    })}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#75858e] transition hover:bg-[#f0f6f3] hover:text-[#278a70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#278a70]"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p
                    id="password-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-red-600"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-[#647683]">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-[#cbd9d2] accent-[#278a70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#278a70] focus-visible:ring-offset-2"
                  {...register("rememberMe")}
                />
                Remember me
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#176b59] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-[#176b59]/15 transition duration-200 hover:bg-[#125847] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#278a70]/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing you in...
                  </>
                ) : (
                  <>
                    Sign in to your account
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#e8eeeb]" />
              <span className="text-xs text-[#89969d]">
                Your family's care, all in one place
              </span>
              <div className="h-px flex-1 bg-[#e8eeeb]" />
            </div>

            <p className="text-center text-sm leading-6 text-[#71808c]">
              Don't have an account yet?{" "}
              <Link
                to="/register"
                className="font-bold text-[#278a70] transition hover:text-[#17644f] hover:underline"
              >
                Get started
              </Link>
            </p>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-[#8a989e]">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
