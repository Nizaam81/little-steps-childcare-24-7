export type RegistrationStep = 1 | 2 | 3 | 4 | 5 | 6;

export type ProviderRegistrationValues = {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
  confirmPassword: string;
  centreName: string;
  address: string;
  district: string;
  centreEmail: string;
  centrePhone: string;
  ageGroups: string[];
  careTypes: string[];
  capacity: number | "";
  openingTime: string;
  closingTime: string;
  dailyPrice: number | "";
  monthlyPrice: number | "";
  termsAccepted: boolean;
};

export type ProviderRegistrationResponse = {
  applicationId: string;
  status: "pending_verification";
};

export const sanitizePhoneNumber = (value: string) =>
  value.replace(/\D/g, "").slice(0, 10);

export const isValidPhoneNumber = (value: string) => /^\d{10}$/.test(value);

export const registrationInputClass = (hasError = false) =>
  `mt-2 w-full min-w-0 rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    hasError
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-200 focus:border-teal-700 focus:ring-teal-700/10"
  }`;
