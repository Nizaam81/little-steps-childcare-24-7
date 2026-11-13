import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Baby,
  Bell,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  DollarSign,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import {
  readProviderIdentity,
  readProviderWorkspace,
  saveProviderWorkspace,
  type BookingRequest,
  type Caregiver,
  type ProviderCentreProfile,
  type ProviderIdentity,
  type ProviderWorkspaceData,
} from "./providerWorkspace";

type DashboardSection =
  | "overview"
  | "centre"
  | "team"
  | "availability"
  | "bookings"
  | "earnings";

const navigation: { id: DashboardSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "centre", label: "Centre profile", icon: Building2 },
  { id: "team", label: "Caregiver profiles", icon: Users },
  { id: "availability", label: "Availability & pricing", icon: CalendarDays },
  { id: "bookings", label: "Booking requests", icon: Bell },
  { id: "earnings", label: "Earnings", icon: DollarSign },
];

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const emptyCentreProfile: ProviderCentreProfile = {
  name: "",
  address: "",
  district: "",
  openingTime: "",
  closingTime: "",
  capacity: 0,
  hourlyPrice: 0,
  dailyPrice: 0,
  monthlyPrice: 0,
  ageGroups: [],
  careTypes: [],
  availabilitySlots: [],
  description: "",
  isAcceptingBookings: true,
};

type CaregiverFormValues = Omit<Caregiver, "id">;
type SlotFormValues = { startTime: string; endTime: string };
type PricingFormValues = Pick<
  ProviderCentreProfile,
  "hourlyPrice" | "dailyPrice" | "monthlyPrice"
>;

function createWorkspace(identity: ProviderIdentity): ProviderWorkspaceData {
  return {
    profile: {
      name: identity.centreName,
      address: "",
      district: "",
      openingTime: "",
      closingTime: "",
      capacity: 0,
      hourlyPrice: 0,
      dailyPrice: 0,
      monthlyPrice: 0,
      ageGroups: ["Infant", "Toddler", "Preschool"],
      careTypes: ["Day care"],
      availabilitySlots: [],
      description: "",
      isAcceptingBookings: true,
    },
    caregivers: [],
    bookings: [],
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  };
}

function StatusPill({ status }: { status: BookingRequest["status"] }) {
  const classes = {
    Pending: "bg-amber-50 text-amber-800 ring-amber-200",
    Accepted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    Declined: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes[status]}`}>
      {status}
    </span>
  );
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [initialState] = useState<{
    identity: ProviderIdentity | null;
    workspace: ProviderWorkspaceData | null;
    error: string;
  }>(() => {
    try {
      const identity = readProviderIdentity();
      return {
        identity,
        workspace: identity
          ? readProviderWorkspace(identity.id) ?? createWorkspace(identity)
          : null,
        error: "",
      };
    } catch (error) {
      return {
        identity: null,
        workspace: null,
        error: error instanceof Error ? error.message : "Unable to load your daycare workspace.",
      };
    }
  });
  const identity = initialState.identity;
  const [workspace, setWorkspace] = useState<ProviderWorkspaceData | null>(
    initialState.workspace,
  );
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const centreForm = useForm<ProviderCentreProfile>({
    mode: "onTouched",
    defaultValues: initialState.workspace?.profile ?? emptyCentreProfile,
  });
  const pricingForm = useForm<PricingFormValues>({
    mode: "onTouched",
    defaultValues: initialState.workspace?.profile ?? emptyCentreProfile,
  });
  const caregiverForm = useForm<CaregiverFormValues>({
    mode: "onTouched",
    defaultValues: { name: "", role: "", experience: "" },
  });
  const slotForm = useForm<SlotFormValues>({
    mode: "onTouched",
    defaultValues: { startTime: "", endTime: "" },
  });
  const scheduleForm = useForm<{ availableDays: string[] }>({
    mode: "onTouched",
    defaultValues: { availableDays: initialState.workspace?.availableDays ?? [] },
  });

  useEffect(() => {
    if (!localStorage.getItem("providerToken")) {
      navigate("/provider/login", { replace: true });
      return;
    }

    if (initialState.error) {
      toast.error(initialState.error);
      localStorage.removeItem("providerToken");
      navigate("/provider/login", { replace: true });
      return;
    }
    if (!identity) {
      localStorage.removeItem("providerToken");
      navigate("/provider/login", { replace: true });
    }
  }, [identity, initialState.error, navigate]);

  useEffect(() => {
    if (!identity || !workspace) return;
    try {
      saveProviderWorkspace(identity.id, workspace);
    } catch {
      toast.error("Your changes could not be saved in this browser.");
    }
  }, [identity, workspace]);

  useEffect(() => {
    if (!identity) return;
    const syncWorkspace = () => {
      try {
        const latestWorkspace = readProviderWorkspace(identity.id);
        if (latestWorkspace) setWorkspace(latestWorkspace);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to refresh daycare requests.");
      }
    };
    window.addEventListener("storage", syncWorkspace);
    return () => window.removeEventListener("storage", syncWorkspace);
  }, [identity]);

  const pendingCount = useMemo(
    () => workspace?.bookings.filter((booking) => booking.status === "Pending").length ?? 0,
    [workspace],
  );

  const updateWorkspace = (update: (current: ProviderWorkspaceData) => ProviderWorkspaceData) => {
    setWorkspace((current) => current ? update(current) : current);
  };

  const signOut = () => {
    localStorage.removeItem("providerToken");
    localStorage.removeItem("providerIdentity");
    toast.success("You have signed out.");
    navigate("/provider/login", { replace: true });
  };

  const changeBookingStatus = (id: string, status: BookingRequest["status"]) => {
    updateWorkspace((current) => ({
      ...current,
      bookings: current.bookings.map((booking) =>
        booking.id === id ? { ...booking, status } : booking,
      ),
    }));
    toast.success(status === "Accepted" ? "Booking request accepted." : "Booking request declined.");
  };

  const watchedCentre = useWatch({ control: centreForm.control });
  const watchedAvailableDays = useWatch({
    control: scheduleForm.control,
    name: "availableDays",
  });

  if (!identity || !workspace) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8f6] text-sm font-medium text-slate-600">
        Loading your daycare workspace…
      </main>
    );
  }

  const profile = workspace.profile;
  const saveProfile = (values: ProviderCentreProfile) => {
    updateWorkspace((current) => ({ ...current, profile: values }));
    toast.success("Centre profile saved in this browser.");
  };
  const savePricing = (values: PricingFormValues) => {
    if (
      !Object.values(values).some(
        (value) => Number.isFinite(value) && value > 0,
      )
    ) {
      for (const field of ["hourlyPrice", "dailyPrice", "monthlyPrice"] as const) {
        pricingForm.setError(field, {
          type: "validate",
          message: "Set at least one price above zero.",
        });
      }
      return;
    }
    updateWorkspace((current) => ({
      ...current,
      profile: { ...current.profile, ...values },
    }));
    toast.success("Pricing plans saved in this browser.");
  };
  const saveSchedule = (values: { availableDays: string[] }) => {
    updateWorkspace((current) => ({ ...current, availableDays: values.availableDays }));
    toast.success("Weekly schedule saved in this browser.");
  };
  const addCaregiver = (values: CaregiverFormValues) => {
    updateWorkspace((current) => ({
      ...current,
      caregivers: [
        ...current.caregivers,
        { ...values, id: crypto.randomUUID() },
      ],
    }));
    caregiverForm.reset();
    toast.success("Caregiver added to the team.");
  };
  const addAvailabilitySlot = (values: SlotFormValues) => {
    updateWorkspace((current) => ({
      ...current,
      profile: {
        ...current.profile,
        availabilitySlots: [
          ...current.profile.availabilitySlots,
          { id: crypto.randomUUID(), ...values },
        ],
      },
    }));
    slotForm.reset();
    toast.success("Availability slot added.");
  };

  const sectionTitle = navigation.find((item) => item.id === activeSection)?.label ?? "Overview";

  return (
    <div className="min-h-screen bg-[#f5f8f6] text-[#26384b]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#e4ece8] bg-white lg:flex">
        <Link to="/" className="flex h-[76px] items-center gap-3 border-b border-[#eaf0ed] px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f3ed] text-[#278a70]">
            <Baby size={22} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">Little <span className="text-[#278a70]">Steps</span></span>
        </Link>
        <div className="px-5 pb-3 pt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Provider workspace</p>
        </div>
        <nav className="space-y-1 px-3" aria-label="Provider dashboard">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${
                activeSection === id
                  ? "bg-[#e7f4ee] text-[#237960]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {id === "bookings" && pendingCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-[#eaf0ed] p-4">
          <div className="mb-3 rounded-xl bg-[#f5f8f6] p-3">
            <p className="truncate text-sm font-bold">{profile.name}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{identity.ownerEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-[#e4ece8] bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="hidden text-xs font-semibold text-[#278a70] sm:block">Provider workspace / {sectionTitle}</p>
              <h1 className="truncate text-lg font-extrabold sm:mt-1 sm:text-xl">{sectionTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:flex">
                <ShieldCheck size={15} /> Approved centre
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Sign out of provider account"
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-50 sm:px-4"
              >
                <LogOut size={16} /> <span>Sign out</span>
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden" aria-label="Provider dashboard sections">
            {navigation.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${
                  activeSection === id ? "bg-[#e7f4ee] text-[#237960]" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-[#cfe7dc] bg-[#eaf6f0] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-white p-2 text-[#278a70]"><ShieldCheck size={18} /></span>
              <div>
                <p className="text-sm font-bold text-[#276b56]">Workspace preview</p>
                <p className="mt-1 text-xs leading-5 text-[#53796d]">Profile, team, schedule and booking changes are saved in this browser. Live provider management APIs are not connected yet.</p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#278a70]">Local demo</span>
          </div>

          {activeSection === "overview" && (
            <>
              <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm text-slate-500">Welcome back, {identity.ownerName}</p>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{profile.name}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={15} /> {profile.address && profile.district ? `${profile.address}, ${profile.district}` : "Add your centre address to complete your profile"}
                  </p>
                </div>
                <button type="button" onClick={() => setActiveSection("centre")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#278a70] px-4 text-sm font-bold text-white hover:bg-[#20785f]">
                  Edit centre profile
                </button>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Booking requests", value: workspace.bookings.length, icon: CalendarDays, tone: "bg-blue-50 text-blue-700" },
                  { label: "Awaiting response", value: pendingCount, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
                  { label: "Caregivers", value: workspace.caregivers.length, icon: Users, tone: "bg-violet-50 text-violet-700" },
                  { label: "Centre capacity", value: profile.capacity || "—", icon: Baby, tone: "bg-emerald-50 text-emerald-700" },
                ].map(({ label, value, icon: Icon, tone }) => (
                  <article key={label} className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">{label}</span>
                      <span className={`rounded-xl p-2.5 ${tone}`}><Icon size={19} /></span>
                    </div>
                    <p className="mt-4 text-3xl font-extrabold">{value}</p>
                  </article>
                ))}
              </section>

              <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                <article className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold">Recent booking requests</h3>
                      <p className="mt-1 text-sm text-slate-500">Respond to families looking for care.</p>
                    </div>
                    <button type="button" onClick={() => setActiveSection("bookings")} className="text-sm font-bold text-[#278a70] hover:underline">View all</button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {workspace.bookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3.5">
                        <div>
                          <p className="text-sm font-bold">{booking.parentName} <span className="font-normal text-slate-500">· {booking.childName}</span></p>
                          <p className="mt-1 text-xs text-slate-500">{booking.carePlan} · {booking.requestedDate}</p>
                        </div>
                        <StatusPill status={booking.status} />
                      </div>
                    ))}
                    {workspace.bookings.length === 0 && <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No booking requests yet.</p>}
                  </div>
                </article>

                <article className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold">Weekly schedule</h3>
                      <p className="mt-1 text-sm text-slate-500">Your currently listed opening hours.</p>
                    </div>
                    <button type="button" onClick={() => setActiveSection("availability")} aria-label="Edit schedule" className="rounded-lg p-2 text-[#278a70] hover:bg-[#eaf6f0]"><CalendarDays size={18} /></button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {weekdays.map((day) => (
                      <div key={day} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{day}</span>
                        {workspace.availableDays.includes(day) ? (
                          <span className="font-semibold text-slate-800">{profile.openingTime || "Set hours"} – {profile.closingTime || "Set hours"}</span>
                        ) : <span className="text-slate-400">Closed</span>}
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </>
          )}

          {activeSection === "centre" && (
            <section className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6">
                <h2 className="text-xl font-extrabold">Centre details</h2>
                <p className="mt-1 text-sm text-slate-500">Keep your centre contact, address and care information up to date.</p>
              </div>
              <form onSubmit={centreForm.handleSubmit(saveProfile)} noValidate>
                <div className="grid gap-5 md:grid-cols-2">
                  {([
                    { label: "Centre name", key: "name", type: "text", required: "Enter your centre name.", minLength: 2 },
                    { label: "District / city", key: "district", type: "text", required: "Enter your district or city.", minLength: 2 },
                    { label: "Full address", key: "address", type: "text", required: "Enter your centre address.", minLength: 5 },
                  ] as const).map(({ label, key, type, required, minLength }) => (
                    <label key={key} className={key === "address" ? "md:col-span-2" : ""}>
                      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
                      <input
                        type={type}
                        placeholder={key === "district" ? "e.g. Palakkad" : key === "address" ? "Street, area and landmark" : "Your daycare centre"}
                        aria-invalid={Boolean(centreForm.formState.errors[key])}
                        {...centreForm.register(key, {
                          required,
                          minLength: { value: minLength, message: `Enter at least ${minLength} characters.` },
                          validate: (value) => value.trim().length >= minLength || `Enter at least ${minLength} non-space characters.`,
                        })}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#278a70] focus:ring-4 focus:ring-[#278a70]/10"
                      />
                      {centreForm.formState.errors[key] && <span role="alert" className="mt-1 block text-xs text-rose-700">{centreForm.formState.errors[key]?.message}</span>}
                    </label>
                  ))}
                  <label>
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Available capacity</span>
                    <input type="number" min={1} step={1} aria-invalid={Boolean(centreForm.formState.errors.capacity)} {...centreForm.register("capacity", { valueAsNumber: true, required: "Enter the number of available places.", min: { value: 1, message: "Capacity must be at least one." }, validate: (value) => Number.isInteger(value) || "Enter a whole number." })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#278a70] focus:ring-4 focus:ring-[#278a70]/10" />
                    {centreForm.formState.errors.capacity && <span role="alert" className="mt-1 block text-xs text-rose-700">{centreForm.formState.errors.capacity.message}</span>}
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Opening time</span>
                    <input type="time" aria-invalid={Boolean(centreForm.formState.errors.openingTime)} {...centreForm.register("openingTime", { required: "Choose an opening time.", validate: (value) => !centreForm.getValues("closingTime") || value < centreForm.getValues("closingTime") || "Opening time must be earlier than closing time." })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#278a70] focus:ring-4 focus:ring-[#278a70]/10" />
                    {centreForm.formState.errors.openingTime && <span role="alert" className="mt-1 block text-xs text-rose-700">{centreForm.formState.errors.openingTime.message}</span>}
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Closing time</span>
                    <input type="time" aria-invalid={Boolean(centreForm.formState.errors.closingTime)} {...centreForm.register("closingTime", { required: "Choose a closing time.", validate: (value) => !centreForm.getValues("openingTime") || value > centreForm.getValues("openingTime") || "Closing time must be later than opening time." })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#278a70] focus:ring-4 focus:ring-[#278a70]/10" />
                    {centreForm.formState.errors.closingTime && <span role="alert" className="mt-1 block text-xs text-rose-700">{centreForm.formState.errors.closingTime.message}</span>}
                  </label>
                  <label className="md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">About your centre</span>
                    <textarea rows={4} maxLength={1000} aria-invalid={Boolean(centreForm.formState.errors.description)} {...centreForm.register("description", { maxLength: { value: 1000, message: "Description must be 1,000 characters or fewer." } })} placeholder="Describe your care approach, facilities and what makes your centre special." className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none transition focus:border-[#278a70] focus:ring-4 focus:ring-[#278a70]/10" />
                    {centreForm.formState.errors.description && <span role="alert" className="mt-1 block text-xs text-rose-700">{centreForm.formState.errors.description.message}</span>}
                  </label>
                  <fieldset className="md:col-span-2">
                    <legend className="mb-2 text-sm font-semibold text-slate-700">Age groups</legend>
                    <div className="flex flex-wrap gap-2">
                      {["Infant", "Toddler", "Preschool", "School age"].map((age) => (
                        <label key={age} className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${watchedCentre.ageGroups?.includes(age) ? "border-[#278a70] bg-[#eaf6f0] text-[#237960]" : "border-slate-200 text-slate-600"}`}>
                          <input type="checkbox" value={age} {...centreForm.register("ageGroups", { validate: (value) => Array.isArray(value) && value.length > 0 || "Choose at least one age group." })} className="accent-[#278a70]" />
                          {age}
                        </label>
                      ))}
                    </div>
                    {centreForm.formState.errors.ageGroups && <span role="alert" className="mt-1 block text-xs text-rose-700">{centreForm.formState.errors.ageGroups.message}</span>}
                  </fieldset>
                  <fieldset className="md:col-span-2">
                    <legend className="mb-2 text-sm font-semibold text-slate-700">Care options</legend>
                    <div className="flex flex-wrap gap-2">
                      {["Day care", "Night care", "Emergency care", "24/7"].map((careType) => (
                        <label key={careType} className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${watchedCentre.careTypes?.includes(careType) ? "border-[#278a70] bg-[#eaf6f0] text-[#237960]" : "border-slate-200 text-slate-600"}`}>
                          <input type="checkbox" value={careType} {...centreForm.register("careTypes", { validate: (value) => Array.isArray(value) && value.length > 0 || "Choose at least one care option." })} className="accent-[#278a70]" />
                          {careType}
                        </label>
                      ))}
                    </div>
                    {centreForm.formState.errors.careTypes && <span role="alert" className="mt-1 block text-xs text-rose-700">{centreForm.formState.errors.careTypes.message}</span>}
                  </fieldset>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 md:col-span-2">
                    <input type="checkbox" {...centreForm.register("isAcceptingBookings")} className="h-4 w-4 accent-[#278a70]" />
                    <span>
                      <span className="block text-sm font-bold">Accept new booking requests</span>
                      <span className="mt-1 block text-xs text-slate-500">Parents can see your centre as available in the local preview.</span>
                    </span>
                  </label>
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#278a70] px-5 text-sm font-bold text-white hover:bg-[#20785f]"><Save size={17} /> Save centre details</button>
                </div>
              </form>
            </section>
          )}

          {activeSection === "team" && (
            <section className="space-y-5">
              <div className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-xl font-extrabold">Caregiver profiles</h2>
                <p className="mt-1 text-sm text-slate-500">Add the care team families will meet at your centre.</p>
                <form
                  className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                  onSubmit={caregiverForm.handleSubmit(addCaregiver)}
                  noValidate
                >
                  {[
                    { key: "name", label: "Caregiver name", placeholder: "Full name" },
                    { key: "role", label: "Role", placeholder: "e.g. Lead caregiver" },
                    { key: "experience", label: "Experience", placeholder: "e.g. 4 years" },
                  ].map(({ key, label, placeholder }) => (
                    <label key={key}>
                      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
                      <input
                        placeholder={placeholder}
                        aria-invalid={Boolean(caregiverForm.formState.errors[key as keyof CaregiverFormValues])}
                        {...caregiverForm.register(key as keyof CaregiverFormValues, key === "experience"
                          ? { maxLength: { value: 80, message: "Experience must be 80 characters or fewer." } }
                          : {
                              required: `Enter the caregiver ${key}.`,
                              minLength: { value: 2, message: `Enter at least 2 characters for ${key}.` },
                              maxLength: { value: 80, message: `${label} must be 80 characters or fewer.` },
                              validate: (value) => value.trim().length >= 2 || `Enter at least 2 non-space characters for ${key}.`,
                            })}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#278a70] focus:ring-4 focus:ring-[#278a70]/10"
                      />
                      {caregiverForm.formState.errors[key as keyof CaregiverFormValues]?.message && <span role="alert" className="mt-1 block text-xs text-rose-700">{caregiverForm.formState.errors[key as keyof CaregiverFormValues]?.message}</span>}
                    </label>
                  ))}
                  <button type="submit" className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#278a70] px-4 text-sm font-bold text-white hover:bg-[#20785f]"><Plus size={16} /> Add</button>
                </form>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {workspace.caregivers.map((caregiver) => (
                  <article key={caregiver.id} className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Users size={20} /></span>
                      <button type="button" aria-label={`Remove ${caregiver.name}`} onClick={() => updateWorkspace((current) => ({ ...current, caregivers: current.caregivers.filter((item) => item.id !== caregiver.id) }))} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={16} /></button>
                    </div>
                    <h3 className="mt-4 font-extrabold">{caregiver.name}</h3>
                    <p className="mt-1 text-sm text-[#278a70]">{caregiver.role}</p>
                    <p className="mt-3 text-xs text-slate-500">{caregiver.experience || "Experience not added"}</p>
                  </article>
                ))}
                {workspace.caregivers.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">No caregiver profiles yet. Add your first team member above.</p>}
              </div>
            </section>
          )}

          {activeSection === "availability" && (
            <section className="grid gap-5 xl:grid-cols-2">
              <article className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-xl font-extrabold">Opening schedule</h2>
                <p className="mt-1 text-sm text-slate-500">Set the days and hours your centre is open.</p>
                <form onSubmit={scheduleForm.handleSubmit(saveSchedule)} noValidate>
                  <div className="mt-5 space-y-2">
                    {weekdays.map((day) => {
                      const isOpen = watchedAvailableDays.includes(day);
                      return (
                        <label key={day} className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3">
                          <span className="flex items-center gap-3 text-sm font-semibold">
                            <input
                              type="checkbox"
                              value={day}
                              {...scheduleForm.register("availableDays", {
                                validate: (days) => Array.isArray(days) && days.length > 0 || "Choose at least one open day.",
                              })}
                              className="h-4 w-4 accent-[#278a70]"
                            />
                            {day}
                          </span>
                          <span className={`text-xs font-semibold ${isOpen ? "text-emerald-700" : "text-slate-400"}`}>{isOpen ? "Open" : "Closed"}</span>
                        </label>
                      );
                    })}
                    {scheduleForm.formState.errors.availableDays && <p role="alert" className="text-xs text-rose-700">{scheduleForm.formState.errors.availableDays.message}</p>}
                  </div>
                  <button type="submit" className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#278a70] px-4 text-sm font-bold text-white hover:bg-[#20785f]"><Save size={16} /> Save schedule</button>
                </form>
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-bold">Availability slots</h3>
                  <form
                    className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                    onSubmit={slotForm.handleSubmit(addAvailabilitySlot)}
                    noValidate
                  >
                    <label className="text-xs font-semibold text-slate-600">
                      Start
                      <input type="time" aria-invalid={Boolean(slotForm.formState.errors.startTime)} {...slotForm.register("startTime", { required: "Choose a start time.", validate: (value) => !slotForm.getValues("endTime") || value < slotForm.getValues("endTime") || "Start time must be earlier than end time." })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm" />
                      {slotForm.formState.errors.startTime && <span role="alert" className="mt-1 block text-rose-700">{slotForm.formState.errors.startTime.message}</span>}
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      End
                      <input type="time" aria-invalid={Boolean(slotForm.formState.errors.endTime)} {...slotForm.register("endTime", { required: "Choose an end time.", validate: (value) => !slotForm.getValues("startTime") || value > slotForm.getValues("startTime") || "End time must be later than start time." })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm" />
                      {slotForm.formState.errors.endTime && <span role="alert" className="mt-1 block text-rose-700">{slotForm.formState.errors.endTime.message}</span>}
                    </label>
                    <button type="submit" className="mt-4 inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-[#278a70] px-3 text-xs font-bold text-white hover:bg-[#20785f]"><Plus size={15} /> Add slot</button>
                  </form>
                  <div className="mt-3 space-y-2">
                    {profile.availabilitySlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <span>{slot.startTime}–{slot.endTime}</span>
                        <button type="button" onClick={() => updateWorkspace((current) => ({ ...current, profile: { ...current.profile, availabilitySlots: current.profile.availabilitySlots.filter((item) => item.id !== slot.id) } }))} aria-label={`Remove ${slot.startTime} to ${slot.endTime} slot`} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button>
                      </div>
                    ))}
                    {profile.availabilitySlots.length === 0 && <p className="text-xs text-slate-400">No extra slots added.</p>}
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">Set the opening and closing times from Centre profile.</p>
              </article>
              <article className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-xl font-extrabold">Pricing plans</h2>
                <p className="mt-1 text-sm text-slate-500">Set the rates families can compare.</p>
                <form className="mt-5 space-y-4" onSubmit={pricingForm.handleSubmit(savePricing)} noValidate>
                  {[
                    { label: "Hourly rate", key: "hourlyPrice", suffix: " / hour" },
                    { label: "Daily rate", key: "dailyPrice", suffix: " / day" },
                    { label: "Monthly rate", key: "monthlyPrice", suffix: " / month" },
                  ].map(({ label, key, suffix }) => (
                    <label key={key} className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
                      <span className="flex h-11 items-center rounded-xl border border-slate-200 px-3.5 focus-within:border-[#278a70] focus-within:ring-4 focus-within:ring-[#278a70]/10">
                        <span className="text-sm text-slate-400">₹</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          aria-invalid={Boolean(pricingForm.formState.errors[key as keyof PricingFormValues])}
                          {...pricingForm.register(key as keyof PricingFormValues, {
                            valueAsNumber: true,
                            validate: {
                              validAmount: (value) => Number.isFinite(value) && value >= 0 || "Enter a valid non-negative rate.",
                            },
                          })}
                          className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-sm outline-none"
                        />
                        <span className="text-xs text-slate-400">{suffix}</span>
                      </span>
                      {pricingForm.formState.errors[key as keyof PricingFormValues] && <span role="alert" className="mt-1 block text-xs text-rose-700">{pricingForm.formState.errors[key as keyof PricingFormValues]?.message}</span>}
                    </label>
                  ))}
                  <button type="submit" className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#278a70] px-4 text-sm font-bold text-white hover:bg-[#20785f]"><Save size={16} /> Save prices</button>
                </form>
              </article>
            </section>
          )}

          {activeSection === "bookings" && (
            <section className="overflow-hidden rounded-2xl border border-[#e5ece8] bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-xl font-extrabold">Booking requests</h2>
                  <p className="mt-1 text-sm text-slate-500">Review family requests and manage your available capacity.</p>
                </div>
                <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">{pendingCount} awaiting response</span>
              </div>
              {workspace.bookings.length ? (
                <div className="divide-y divide-slate-100">
                  {workspace.bookings.map((booking) => (
                    <article key={booking.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">{booking.parentName}</h3>
                          <StatusPill status={booking.status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-600">Request for {booking.childName} · {booking.carePlan}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={14} /> {booking.requestedDate}</p>
                      </div>
                      {booking.status === "Pending" && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => changeBookingStatus(booking.id, "Declined")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"><X size={15} /> Decline</button>
                          <button type="button" onClick={() => changeBookingStatus(booking.id, "Accepted")} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#278a70] px-3 text-xs font-bold text-white hover:bg-[#20785f]"><Check size={15} /> Accept</button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <CalendarDays className="mx-auto text-slate-300" size={30} />
                  <p className="mt-3 font-semibold">No booking requests yet</p>
                  <p className="mt-1 text-sm text-slate-500">New family requests will appear here when connected.</p>
                </div>
              )}
            </section>
          )}

          {activeSection === "earnings" && (
            <section className="space-y-5">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Earnings are a preview only. Payment and booking APIs are not connected, so no real transactions or totals are shown.
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "This month", value: "₹0", caption: "No payment data yet", icon: DollarSign },
                  { label: "Confirmed bookings", value: "0", caption: "Connected when bookings are live", icon: CalendarDays },
                  { label: "Available capacity", value: profile.capacity || "—", caption: "Set capacity in centre profile", icon: Baby },
                ].map(({ label, value, caption, icon: Icon }) => (
                  <article key={label} className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm">
                    <span className="inline-flex rounded-xl bg-[#eaf6f0] p-2.5 text-[#278a70]"><Icon size={19} /></span>
                    <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-1 text-3xl font-extrabold">{value}</p>
                    <p className="mt-2 text-xs text-slate-400">{caption}</p>
                  </article>
                ))}
              </div>
              <article className="rounded-2xl border border-[#e5ece8] bg-white p-6 shadow-sm">
                <h2 className="font-extrabold">Earnings analytics</h2>
                <div className="mt-8 flex min-h-48 items-center justify-center rounded-xl bg-slate-50 px-5 text-center text-sm text-slate-500">
                  Payment analytics will appear here after the booking and payment services are connected.
                </div>
              </article>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
