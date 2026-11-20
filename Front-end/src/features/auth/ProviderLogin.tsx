import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Baby,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/api-error-message";
import {
  loginProvider,
  type ProviderLoginResponse,
  type ProviderLoginStatus,
} from "./providerLoginApi";
import { providerIdentityStorageKey } from "../provider/providerWorkspace";

interface ProviderLoginForm {
  email: string;
  password: string;
}

const providerStatusLabels: Record<ProviderLoginStatus, string> = {
  pending_verification: "Pending admin review",
  approved: "Approved",
  rejected: "Application rejected",
  corrections_requested: "Changes requested",
};

const providerStatusStyles: Record<ProviderLoginStatus, string> = {
  pending_verification: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
  corrections_requested: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function ProviderLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginResult, setLoginResult] = useState<ProviderLoginResponse | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProviderLoginForm>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (sessionStorage.getItem("providerSessionExpired") !== "true") return;
    sessionStorage.removeItem("providerSessionExpired");
    toast.error("Your provider session expired. Please sign in again.");
  }, []);

  const onSubmit = async (form: ProviderLoginForm) => {
    setLoginResult(null);
    localStorage.removeItem("providerToken");
    localStorage.removeItem("providerRefreshToken");

    try {
      const result = await loginProvider(form.email, form.password);
      if (
        !result ||
        typeof result.provider?.id !== "string" ||
        typeof result.provider?.ownerName !== "string" ||
        typeof result.provider?.centreName !== "string" ||
        typeof result.provider?.ownerEmail !== "string" ||
        typeof result.dashboardAccess !== "boolean" ||
        !Object.hasOwn(providerStatusLabels, result.provider?.status)
      ) {
        throw new Error("The server returned an unexpected provider login response.");
      }

      if (result.dashboardAccess) {
        if (typeof result.token !== "string" || !result.token) {
          throw new Error(
            "The server approved this account but did not return an access token.",
          );
        }
        if (typeof result.refreshToken !== "string" || !result.refreshToken) {
          throw new Error("The server approved this account but did not return a refresh token.");
        }
        localStorage.setItem("providerToken", result.token);
        localStorage.setItem("providerRefreshToken", result.refreshToken);
        localStorage.setItem(
          providerIdentityStorageKey,
          JSON.stringify({
            id: result.provider.id,
            ownerName: result.provider.ownerName,
            ownerEmail: result.provider.ownerEmail,
            centreName: result.provider.centreName,
          }),
        );
      } else if (result.token !== null) {
        throw new Error(
          "The server returned an access token for an account that is not approved.",
        );
      }

      setLoginResult(result);
      toast.success(
        result.dashboardAccess
          ? result.provider.status === "approved"
            ? "Welcome back. Your provider dashboard is ready."
            : `Dashboard access granted. ${providerStatusLabels[result.provider.status]}.`
          : `Sign-in verified. ${providerStatusLabels[result.provider.status]}.`,
      );
      if (result.dashboardAccess) {
        navigate("/provider/dashboard", { replace: true });
      }
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to sign in. Please check your email and password.",
        ),
      );
    }
  };

  return (
    <main className="min-h-dvh bg-[#f6f9f7] text-[#26384b]">
      <header className="border-b border-[#e5eeea] bg-white/95">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:h-[76px] sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="Little Steps home"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#278a70]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f3ed] text-[#278a70]">
              <Baby size={22} />
            </span>
            <span className="font-['Manrope'] text-lg font-extrabold tracking-tight sm:text-xl">
              Little <span className="text-[#278a70]">Steps</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
            <span className="hidden text-[#697989] sm:inline">
              Not a provider yet?
            </span>
            <Link
              to="/provider/register"
              className="rounded-xl border border-[#d8e6e0] bg-white px-3 py-2 font-semibold transition hover:border-[#278a70] hover:text-[#278a70] sm:px-4"
            >
              Register your centre
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-69px)] max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[calc(100dvh-77px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-14 lg:px-8 lg:py-12">
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d7ebe3] bg-white px-3.5 py-2 text-xs font-semibold text-[#278a70] shadow-sm sm:mb-6 sm:text-sm">
            <Sparkles size={15} />
            Your care centre, all in one place
          </div>

          <h1 className="font-['Manrope'] text-3xl font-extrabold leading-tight tracking-tight text-[#26384b] sm:text-4xl md:text-5xl">
            Welcome back to
            <span className="mt-1 block text-[#278a70]">
              your care community.
            </span>
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-7 text-[#687a88] sm:mt-5 sm:text-base sm:leading-8">
            Sign in to manage your daycare profile, keep your centre details up
            to date and stay connected with the Little Steps team.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-[#e3ece7] bg-white p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f5ed] text-[#278a70]">
                <ShieldCheck size={21} />
              </span>
              <div>
                <p className="text-sm font-bold">Trusted access</p>
                <p className="mt-0.5 text-xs text-[#778691]">
                  Your account stays protected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#e3ece7] bg-white p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f5ed] text-[#278a70]">
                <Heart size={21} />
              </span>
              <div>
                <p className="text-sm font-bold">Care comes first</p>
                <p className="mt-0.5 text-xs text-[#778691]">
                  Built around your centre
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-7 hidden overflow-hidden rounded-3xl border border-[#dcece5] bg-[#e5f4ee] p-6 sm:block md:p-8 lg:mt-8">
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/60 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[#bde7d5]/70 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#278a70] shadow-sm">
                <Heart size={24} />
              </div>
              <div>
                <p className="font-['Manrope'] text-lg font-extrabold">
                  Every little step matters.
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#617b76]">
                  Thank you for creating a safe, caring place for children to
                  grow and learn.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
          <div className="rounded-3xl border border-[#e3ebe7] bg-white p-5 shadow-[0_20px_70px_-35px_rgba(38,56,75,0.25)] sm:p-8 md:p-9">
            <div className="mb-6 sm:mb-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f4ee] text-[#278a70] sm:mb-5">
                <LockKeyhole size={23} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#278a70] sm:text-sm">
                Provider portal
              </p>
              <h2 className="mt-2 font-['Manrope'] text-2xl font-extrabold tracking-tight text-[#26384b] sm:text-3xl">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#71808c]">
                Use the email and password associated with your centre.
              </p>
            </div>

            {loginResult && (
              <section
                role="status"
                aria-live="polite"
                className={`mb-5 rounded-2xl border p-4 ${
                  providerStatusStyles[loginResult.provider.status]
                }`}
              >
                <div className="flex items-start gap-3">
                  {loginResult.provider.status === "approved" ? (
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                  ) : loginResult.provider.status === "rejected" ? (
                    <XCircle size={20} className="mt-0.5 shrink-0" />
                  ) : (
                    <Clock3 size={20} className="mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      {providerStatusLabels[loginResult.provider.status]}
                    </p>
                    <p className="mt-1 text-sm">
                      {loginResult.provider.centreName}
                    </p>
                    {loginResult.provider.status === "approved" ? (
                      <p className="mt-2 text-xs leading-5">
                        Your provider account is approved and dashboard access
                        is enabled.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs leading-5">
                        {loginResult.provider.reviewNotes ||
                          (loginResult.provider.status ===
                          "pending_verification"
                            ? "The admin team is reviewing your centre and documents."
                            : "Please contact Little Steps support for an update.")}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4 sm:space-y-5"
            >
              <div>
                <label
                  htmlFor="provider-email"
                  className="mb-2 block text-sm font-semibold text-[#34485a]"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#91a0a9]"
                  />
                  <input
                    id="provider-email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@yourcentre.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "provider-email-error" : undefined
                    }
                    className={`w-full rounded-xl border bg-[#fbfdfc] py-3.5 pl-11 pr-4 text-sm text-[#26384b] outline-none transition placeholder:text-[#a0adb4] focus:bg-white focus:ring-4 focus:ring-[#278a70]/10 ${
                      errors.email
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-[#dfe8e3] focus:border-[#278a70]"
                    }`}
                    {...register("email", {
                      required: "Enter your email address.",
                      maxLength: {
                        value: 254,
                        message: "Email address must be 254 characters or fewer.",
                      },
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address.",
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p
                    id="provider-email-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-rose-600"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="provider-password"
                    className="block text-sm font-semibold text-[#34485a]"
                  >
                    Password
                  </label>
                  <Link
                    to="/contact"
                    className="text-xs font-semibold text-[#278a70] hover:text-[#1d705b] sm:text-sm"
                  >
                    Need help?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#91a0a9]"
                  />
                  <input
                    id="provider-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "provider-password-error" : undefined
                    }
                    className={`w-full rounded-xl border bg-[#fbfdfc] py-3.5 pl-11 pr-12 text-sm text-[#26384b] outline-none transition placeholder:text-[#a0adb4] focus:bg-white focus:ring-4 focus:ring-[#278a70]/10 ${
                      errors.password
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-[#dfe8e3] focus:border-[#278a70]"
                    }`}
                    {...register("password", {
                      required: "Enter your password.",
                      maxLength: {
                        value: 128,
                        message: "Password must be 128 characters or fewer.",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#82919c] transition hover:bg-[#f0f5f2] hover:text-[#278a70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#278a70]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="provider-password-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-rose-600"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#278a70] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(39,138,112,0.8)] transition hover:bg-[#20785f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#278a70]/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    Checking your account…
                  </>
                ) : (
                  <>
                    Sign in to provider portal
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 sm:my-6">
              <span className="h-px flex-1 bg-[#e8eeeb]" />
              <span className="text-[11px] font-medium text-[#9aa6ad]">
                NEW TO LITTLE STEPS?
              </span>
              <span className="h-px flex-1 bg-[#e8eeeb]" />
            </div>

            <Link
              to="/provider/register"
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-[#d8e6e0] px-4 py-2.5 text-sm font-semibold text-[#347963] transition hover:border-[#278a70] hover:bg-[#f6fbf8]"
            >
              Register your daycare centre
            </Link>
          </div>

          <p className="mt-4 flex items-center justify-center gap-2 px-2 text-center text-xs leading-5 text-[#82909a]">
            <ShieldCheck size={15} className="shrink-0 text-[#278a70]" />
            This portal is for registered childcare providers.
          </p>
        </div>
      </section>

      <footer className="px-4 pb-5 text-center text-xs text-[#9aa6ad]">
        © 2026 Little Steps. Growing together.
      </footer>
    </main>
  );
}
