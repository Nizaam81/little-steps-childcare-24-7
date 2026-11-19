import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ArrowLeft, CircleUserRound, Pencil, ShieldCheck } from "lucide-react";
import BookingsHistory from "./BookingsHistory";
import CctvAccess from "./CctvAccess";
import type { Booking, Daycare, ParentProfile } from "../dashboardTypes";
import { updateParentProfile } from "../parentApi";
import { getApiErrorMessage } from "../../../utils/api-error-message";

type ParentSettingsProps = {
  bookings: Booking[];
  centers: Daycare[];
  profile: ParentProfile;
  startInEditMode: boolean;
  initialSection?: string;
  onBack: () => void;
  onProfileSaved: (profile: ParentProfile) => void;
};

const ParentSettings = ({
  bookings,
  centers,
  profile,
  startInEditMode,
  initialSection,
  onBack,
  onProfileSaved,
}: ParentSettingsProps) => {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ParentProfile>({
    mode: "onTouched",
    defaultValues: profile,
  });

  useEffect(() => {
    if (!initialSection) return;
    requestAnimationFrame(() => {
      document.getElementById(initialSection)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [initialSection]);

  const saveProfile = async (values: ParentProfile) => {
    const updatedProfile = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phoneNumber: values.phoneNumber.trim(),
    };

    try {
      const savedProfile = await updateParentProfile(updatedProfile);
      onProfileSaved(savedProfile);
      reset(savedProfile);
      setIsEditing(false);
      toast.success("Your profile has been updated.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to update your profile right now."));
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-7 sm:py-10 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[#278a70]">ACCOUNT</p>
          <h1 className="mt-1 font-sans text-3xl font-extrabold tracking-tight text-[#26384b]">
            Settings &amp; history
          </h1>
          <p className="mt-2 text-sm text-[#687a88]">
            Manage your parent profile and find your family activity in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#d8e6e0] bg-white px-4 py-2.5 text-sm font-semibold text-[#526777] transition hover:border-[#278a70] hover:text-[#278a70]"
        >
          <ArrowLeft size={17} /> Back to dashboard
        </button>
      </div>

      <section id="parent-profile" className="scroll-mt-24 overflow-hidden rounded-3xl border border-[#e3ece7] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-[#eaf1ed] bg-[#fbfdfc] p-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f4ee] text-[#278a70]">
              <CircleUserRound size={23} />
            </span>
            <div>
              <h2 className="font-sans text-lg font-extrabold text-[#26384b]">Parent profile</h2>
              <p className="mt-0.5 text-xs text-[#778691]">Your account contact details</p>
            </div>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#278a70] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f755f]"
            >
              <Pencil size={15} /> Edit profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(saveProfile)} noValidate className="grid min-w-0 grid-cols-1 gap-4 p-5 sm:p-6">
            <label className="text-sm font-semibold text-[#26384b]" htmlFor="parent-name">
              Full name
              <input
                id="parent-name"
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "parent-name-error" : undefined}
                {...register("fullName", {
                  required: "Enter your name.",
                  minLength: { value: 2, message: "Name must contain at least 2 characters." },
                  maxLength: { value: 100, message: "Name must be 100 characters or fewer." },
                  validate: (value) => value.trim().length >= 2 || "Enter a valid name.",
                })}
                className="mt-2 w-full rounded-xl border border-[#dce8e2] bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]"
                autoComplete="name"
              />
              {errors.fullName && <span id="parent-name-error" role="alert" className="mt-1 block text-xs text-rose-700">{errors.fullName.message}</span>}
            </label>
            <label className="text-sm font-semibold text-[#26384b]" htmlFor="parent-email">
              Email address
              <input
                id="parent-email"
                type="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "parent-email-error" : undefined}
                {...register("email", {
                  required: "Enter your email address.",
                  maxLength: { value: 254, message: "Email address is too long." },
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address." },
                })}
                readOnly
                className="mt-2 w-full rounded-xl border border-[#dce8e2] bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]"
                autoComplete="email"
              />
              {errors.email && <span id="parent-email-error" role="alert" className="mt-1 block text-xs text-rose-700">{errors.email.message}</span>}
              <span className="mt-1 block text-xs font-normal text-[#778691]">Contact support to change your verified email address.</span>
            </label>
            <label className="text-sm font-semibold text-[#26384b]" htmlFor="parent-phone">
              Phone number
              <input
                id="parent-phone"
                type="tel"
                aria-invalid={Boolean(errors.phoneNumber)}
                aria-describedby={errors.phoneNumber ? "parent-phone-error" : undefined}
                {...register("phoneNumber", {
                  required: "Enter your phone number.",
                  minLength: { value: 7, message: "Phone number must contain at least 7 digits." },
                  maxLength: { value: 20, message: "Phone number must be 20 characters or fewer." },
                  validate: (value) =>
                    (/^[+]?[0-9\s()-]+$/.test(value) &&
                      value.replace(/\D/g, "").length >= 7 &&
                      value.replace(/\D/g, "").length <= 15) ||
                    "Enter a valid phone number with 7 to 15 digits.",
                })}
                className="mt-2 w-full rounded-xl border border-[#dce8e2] bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]"
                autoComplete="tel"
              />
              {errors.phoneNumber && <span id="parent-phone-error" role="alert" className="mt-1 block text-xs text-rose-700">{errors.phoneNumber.message}</span>}
            </label>
            <div className="flex flex-col gap-2 border-t border-[#eaf1ed] pt-4">
              <button
                type="button"
                onClick={() => {
                  reset(profile);
                  setIsEditing(false);
                }}
                className="rounded-xl border border-[#d8e6e0] px-4 py-3 text-sm font-semibold text-[#526777] transition hover:bg-[#f6f9f7]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-[#278a70] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f755f]"
              >
                {isSubmitting ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 p-5 sm:p-6">
            <div className="border-b border-[#eaf1ed] pb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#778691]">Full name</p>
              <p className="mt-1 text-sm font-semibold text-[#26384b]">{profile.fullName}</p>
            </div>
            <div className="border-b border-[#eaf1ed] pb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#778691]">Email address</p>
              <p className="mt-1 break-all text-sm font-semibold text-[#26384b]">{profile.email}</p>
            </div>
            <div className="border-b border-[#eaf1ed] pb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#778691]">Phone number</p>
              <p className="mt-1 text-sm font-semibold text-[#26384b]">{profile.phoneNumber || "Not added"}</p>
            </div>
            <p className="flex items-center gap-2 pt-1 text-xs leading-5 text-[#778691]">
              <ShieldCheck size={15} className="shrink-0 text-[#278a70]" />
              Your verified email is protected. Name and phone updates are saved to your parent account.
            </p>
          </div>
        )}
      </section>

      <BookingsHistory bookings={bookings} />
      <CctvAccess centers={centers} />
      <p className="text-center text-xs text-[#81929b]">
        Booking, camera-access, and recommendation data shown here are for UI preview only.
      </p>
    </main>
  );
};

export default ParentSettings;
