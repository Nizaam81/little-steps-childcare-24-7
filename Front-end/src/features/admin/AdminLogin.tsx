
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Baby,
  ArrowRight,
  Heart,
} from "lucide-react";
import { getApiErrorMessage } from "../../utils/api-error-message";

interface AdminLoginForm {
  email: string;
  password: string;
}

interface AdminLoginResponse {
  token: string;
  admin: {
    email: string;
  };
  expiresInSeconds: number;
}

const adminApi = axios.create({
  baseURL: `${(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/admin`,
  headers: {
    "Content-Type": "application/json",
  },
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginForm>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  const onSubmit = async (form: AdminLoginForm) => {
    try {
      const response = await adminApi.post<AdminLoginResponse>("/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (!response.data.token) {
        throw new Error("The login response did not include an authentication token.");
      }

      localStorage.setItem("adminToken", response.data.token);
      toast.success(
        `Welcome back, ${response.data.admin.email || "Admin"}!`,
      );
      navigate("/admin/dashboard", { replace: true });
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Login failed. Please check your credentials.",
        ),
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FAF9] flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <Baby className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                Little <span className="text-teal-600">Steps</span>
              </h1>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase">
                Growing together
              </p>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <ShieldCheck size={17} className="text-teal-600" />
            Secure Admin Portal
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-3xl shadow-xl shadow-teal-900/5 overflow-hidden border border-gray-100">
          
          {/* Left panel */}
          <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-teal-700 to-teal-500 p-10 lg:p-12 text-white relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border-[35px] border-white/10" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-white/5" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full text-sm">
                <ShieldCheck size={17} />
                Administrator Access
              </div>

              <h2 className="mt-12 text-4xl lg:text-5xl font-bold leading-tight">
                Making childcare
                <br />
                better, together.
              </h2>

              <p className="mt-6 text-teal-50 leading-relaxed max-w-sm">
                Manage childcare providers, review registrations, verify
                documents and help families find trusted childcare services.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 border-t border-white/20 pt-6">
              <Heart size={20} className="fill-white" />
              <p className="text-sm text-teal-50">
                Every little step makes a difference.
              </p>
            </div>
          </div>

          {/* Login form */}
          <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            <div className="mb-8">
              <div className="md:hidden w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-5">
                <ShieldCheck className="text-teal-600" size={25} />
              </div>

              <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider">
                Admin Portal
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mt-2">
                Welcome back!
              </h2>

              <p className="text-gray-500 text-sm mt-2">
                Sign in to access your administration dashboard.
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
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Admin Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@littlesteps.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`w-full rounded-xl border bg-gray-50 py-3.5 pl-12 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-4 focus:ring-teal-500/10 ${
                      errors.email
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-teal-500"
                    }`}
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
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
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
                    className={`w-full rounded-xl border bg-gray-50 py-3.5 pl-12 pr-12 text-sm outline-none transition-all focus:bg-white focus:ring-4 focus:ring-teal-500/10 ${
                      errors.password
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-teal-500"
                    }`}
                    {...register("password", {
                      required: "Password is required.",
                      maxLength: {
                        value: 128,
                        message: "Password must be 128 characters or fewer.",
                      },
                    })}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  to="/admin/forgot-password"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-600/20"
              >
                {isSubmitting ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in to Dashboard
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-xs text-gray-400 leading-relaxed">
                <ShieldCheck size={14} className="inline mr-1 text-teal-600" />
                This portal is restricted to authorised Little Steps
                administrators.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Little Steps. All rights reserved.
      </footer>
    </div>
  );
};

export default AdminLogin;
