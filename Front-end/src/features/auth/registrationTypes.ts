export type RegistrationValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  otp: string;
  password: string;
  confirmPassword: string;
};

export type RegistrationStep = 1 | 2 | 3 | 4;

export const registrationInputClass = (hasError: boolean) =>
  `mt-2 w-full min-w-0 rounded-xl border bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-200 focus:border-teal-700 focus:ring-teal-700/10"
  }`;
