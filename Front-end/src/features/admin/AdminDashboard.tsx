import axios from "axios";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  Power,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../utils/api-error-message";
import { confirmWithToast } from "../../utils/confirm-with-toast";
import { adminApi } from "./adminApi";
import { clearAuthSession } from "../auth/authSession";
import {
  fetchProviderApplications,
  fetchProviderDocument,
  fetchApprovedCentres,
  fetchParents,
  reviewProviderApplication,
  deleteCentre,
  deleteParent,
  setCentreActive,
  setParentActive,
  type AdminParent,
  type ApprovedCentre,
  type ProviderApplication,
  type ProviderApplicationStatus,
  type ProviderReviewDecision,
} from "./adminApi";

const pageSize = 10;

const statusLabels: Record<ProviderApplicationStatus, string> = {
  pending_verification: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  corrections_requested: "Changes requested",
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

const formatPrice = (price: number | "") =>
  price === "" ? "Not provided" : `₹${price.toLocaleString("en-IN")}`;

function isPendingReview(status: ProviderApplicationStatus) {
  return status === "pending_verification" || status === "corrections_requested";
}

function handleAdminApiError(
  error: unknown,
  navigate: ReturnType<typeof useNavigate>,
  fallback: string,
) {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    clearAuthSession({ access: "adminToken", refresh: "adminRefreshToken" });
    toast.error("Your admin session expired. Please sign in again.");
    navigate("/admin/login", { replace: true });
    return;
  }
  toast.error(getApiErrorMessage(error, fallback));
}

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "Applications", icon: FileText, id: "applications" },
  { label: "Daycare centres", icon: Building2, id: "centres" },
  { label: "Parents", icon: Users, id: "parents" },
];

type AdminSection = "dashboard" | "applications" | "centres" | "parents";

function Sidebar({
  isOpen,
  onClose,
  activeSection,
  onNavigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
}) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}
      <aside
        data-open={isOpen}
        className="admin-sidebar fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-slate-200 bg-white transition-transform duration-200"
      >
        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700">
            <Heart size={23} className="fill-white text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[19px] font-bold tracking-tight text-slate-900">
              Little Steps
            </h1>
            <p className="text-xs text-slate-500">Admin Portal</p>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Workspace
          </p>
          <nav className="space-y-1">
            {navigation.slice(0, 2).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => {
                    onNavigate(item.id as AdminSection);
                    onClose();
                  }}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium ${
                    activeSection === item.id
                      ? "bg-teal-50 text-teal-800"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.9} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Platform
          </p>
          <nav className="space-y-1">
            {navigation.slice(2).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => {
                    onNavigate(item.id as AdminSection);
                    onClose();
                  }}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium ${
                    activeSection === item.id
                      ? "bg-teal-50 text-teal-800"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.9} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Account
          </p>
          <div className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-500">
            <MoreHorizontal size={18} />
            Admin workspace
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">Admin</p>
              <p className="truncate text-xs text-slate-500">Review workspace</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({
  pendingCount,
  onOpenNavigation,
  onSignOut,
}: {
  pendingCount: number;
  onOpenNavigation: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenNavigation}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
            Admin dashboard
          </h2>
          <p className="hidden text-sm text-slate-500 sm:block">
            Review childcare provider applications
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 sm:flex">
          <ShieldCheck size={16} />
          Secure admin
        </div>
        <div
          aria-label={`${pendingCount} applications awaiting review`}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
        >
          <Clock3 size={18} />
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          aria-label="Sign out of admin account"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
          AD
        </div>
      </div>
    </header>
  );
}

function StatusBadge({ status }: { status: ProviderApplicationStatus }) {
  const styles: Record<ProviderApplicationStatus, string> = {
    pending_verification: "border-amber-200 bg-amber-50 text-amber-800",
    corrections_requested: "border-blue-200 bg-blue-50 text-blue-800",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rejected: "border-rose-200 bg-rose-50 text-rose-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

function ApplicationTable({
  applications,
  onView,
}: {
  applications: ProviderApplication[];
  onView: (application: ProviderApplication) => void;
}) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[790px] table-fixed text-left">
        <colgroup>
          <col className="w-[27%]" />
          <col className="w-[22%]" />
          <col className="w-[17%]" />
          <col className="w-[17%]" />
          <col className="w-[17%]" />
        </colgroup>
        <thead className="border-y border-slate-100 bg-slate-50">
          <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3.5 sm:px-5">Daycare centre</th>
            <th className="px-4 py-3.5">Owner</th>
            <th className="px-3 py-3.5">Submitted</th>
            <th className="px-3 py-3.5">Status</th>
            <th className="px-3 py-3.5 text-right">Review</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((application) => (
            <tr
              key={application.applicationId}
              className="transition-colors hover:bg-slate-50/70"
            >
              <td className="px-4 py-4 sm:px-5">
                <p className="truncate text-[13px] font-semibold text-slate-800">
                  {application.centreName}
                </p>
                <p className="mt-1 truncate text-[11px] text-slate-400">
                  ID {application.applicationId.slice(-6)}
                </p>
              </td>
              <td className="px-4 py-4">
                <p className="truncate text-[13px] font-medium text-slate-700">
                  {application.ownerName}
                </p>
                <p className="mt-1 truncate text-[11px] text-slate-500">
                  {application.ownerEmail}
                </p>
              </td>
              <td className="px-3 py-4 text-xs text-slate-600">
                {formatDate(application.createdAt)}
              </td>
              <td className="px-3 py-4">
                <StatusBadge status={application.status} />
              </td>
              <td className="px-3 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onView(application)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                >
                  <Eye size={14} />
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileApplicationCards({
  applications,
  onView,
}: {
  applications: ProviderApplication[];
  onView: (application: ProviderApplication) => void;
}) {
  return (
    <div className="divide-y divide-slate-100 md:hidden">
      {applications.map((application) => (
        <article
          key={application.applicationId}
          className="space-y-3 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-slate-800">
                {application.centreName}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {application.ownerName}
              </p>
            </div>
            <StatusBadge status={application.status} />
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <p className="break-all">{application.ownerEmail}</p>
            <p>Submitted: {formatDate(application.createdAt)}</p>
            <p>Application ID: {application.applicationId.slice(-8)}</p>
          </div>
          <button
            type="button"
            onClick={() => onView(application)}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Eye size={15} />
            View full request
          </button>
        </article>
      ))}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-800">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

function ApplicationReviewDialog({
  application,
  onClose,
  onDecision,
  isSubmitting,
}: {
  application: ProviderApplication;
  onClose: () => void;
  onDecision: (
    decision: ProviderReviewDecision,
    notes: string,
  ) => Promise<void>;
  isSubmitting: boolean;
}) {
  const navigate = useNavigate();
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [tradeLicenseViewed, setTradeLicenseViewed] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<
    "rejected" | "corrections_requested" | null
  >(null);
  const reviewForm = useForm<{ reviewNotes: string; reviewConfirmed: boolean }>({
    mode: "onTouched",
    defaultValues: {
      reviewNotes: application.reviewNotes ?? "",
      reviewConfirmed: false,
    },
  });
  const reviewNotes =
    useWatch({ control: reviewForm.control, name: "reviewNotes" }) ?? "";
  const reviewConfirmed =
    useWatch({ control: reviewForm.control, name: "reviewConfirmed" }) ?? false;

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    fetchProviderDocument(
      application.applicationId,
      application.tradeLicense.publicId,
    )
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) {
          setDocumentUrl(objectUrl);
          setDocumentError("");
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clearAuthSession({ access: "adminToken", refresh: "adminRefreshToken" });
          toast.error("Your admin session expired. Please sign in again.");
          navigate("/admin/login", { replace: true });
          return;
        }
        setDocumentError(
          getApiErrorMessage(error, "Unable to load the trade licence."),
        );
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    application.applicationId,
    application.tradeLicense.publicId,
    navigate,
  ]);

  const canReview = isPendingReview(application.status);
  const isPdf = application.tradeLicense.mimeType === "application/pdf";
  const isImage = application.tradeLicense.mimeType.startsWith("image/");

  const viewSupportingDocument = async (publicId: string) => {
    try {
      const blob = await fetchProviderDocument(application.applicationId, publicId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error: unknown) {
      handleAdminApiError(error, navigate, "Unable to open this document.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-review-title"
        className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                Provider application
              </p>
              <StatusBadge status={application.status} />
            </div>
            <h2
              id="application-review-title"
              className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl"
            >
              {application.centreName}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              ID {application.applicationId} · Submitted{" "}
              {formatDate(application.createdAt)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close application details"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
            <div className="space-y-4">
              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Building2 size={16} className="text-teal-700" />
                  Daycare details
                </h3>
                <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <Detail label="Centre name" value={application.centreName} />
                  <Detail label="District" value={application.district} />
                  <Detail label="Address" value={application.address} />
                  <Detail label="Centre email" value={application.centreEmail} />
                  <Detail label="Centre phone" value={application.centrePhone} />
                  <Detail label="Capacity" value={`${application.capacity} children`} />
                  <Detail
                    label="Opening hours"
                    value={`${application.openingTime}–${application.closingTime}`}
                  />
                  <Detail
                    label="Age groups"
                    value={application.ageGroups.join(", ")}
                  />
                  <Detail
                    label="Care types"
                    value={application.careTypes.join(", ")}
                  />
                  <Detail
                    label="Daily price"
                    value={formatPrice(application.dailyPrice)}
                  />
                  <Detail
                    label="Monthly price"
                    value={formatPrice(application.monthlyPrice)}
                  />
                </dl>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Users size={16} className="text-teal-700" />
                  Centre owner
                </h3>
                <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <Detail label="Owner name" value={application.ownerName} />
                  <Detail label="Owner email" value={application.ownerEmail} />
                  <Detail label="Owner phone" value={application.ownerPhone} />
                </dl>
              </section>

              {application.supportingDocuments.length > 0 && (
                <section className="rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Supporting documents
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {application.supportingDocuments.map((document) => (
                      <li key={document.publicId}>
                        <button
                          type="button"
                          onClick={() =>
                            void viewSupportingDocument(document.publicId)
                          }
                          className="flex w-full min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 hover:bg-teal-50"
                        >
                          <FileText
                            size={15}
                            className="shrink-0 text-teal-700"
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {document.originalName}
                          </span>
                          <ArrowDownToLine
                            size={15}
                            className="shrink-0 text-slate-400"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <div className="space-y-4">
              <section className="overflow-hidden rounded-xl border border-teal-200">
                <div className="flex items-center gap-3 border-b border-teal-100 bg-teal-50/70 p-3">
                  <FileCheck2 size={18} className="shrink-0 text-teal-800" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800">
                      Trade licence
                    </h3>
                    <p className="truncate text-xs text-slate-500">
                      {application.tradeLicense.originalName} ·{" "}
                      {(application.tradeLicense.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {documentUrl && (
                    <a
                      href={documentUrl}
                      download={application.tradeLicense.originalName}
                      aria-label="Download trade licence"
                      className="rounded-lg p-2 text-slate-600 hover:bg-white"
                    >
                      <Download size={16} />
                    </a>
                  )}
                </div>
                <div className="flex min-h-56 items-center justify-center bg-slate-100 sm:min-h-72">
                  {documentError ? (
                    <p role="alert" className="px-5 text-center text-sm text-rose-700">
                      {documentError}
                    </p>
                  ) : !documentUrl ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
                      Loading trade licence…
                    </div>
                  ) : isPdf ? (
                    <iframe
                      title="Trade licence preview"
                      src={documentUrl}
                      onLoad={() => setTradeLicenseViewed(true)}
                      className="h-72 w-full sm:h-96"
                    />
                  ) : isImage ? (
                    <img
                      src={documentUrl}
                      alt={`Trade licence: ${application.tradeLicense.originalName}`}
                      onLoad={() => setTradeLicenseViewed(true)}
                      className="max-h-72 w-full object-contain p-2 sm:max-h-96"
                    />
                  ) : (
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setTradeLicenseViewed(true)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 underline"
                    >
                      <Eye size={16} />
                      Open trade licence
                    </a>
                  )}
                </div>
                <p className="flex items-center gap-2 border-t border-teal-100 px-3 py-2.5 text-xs text-slate-600">
                  {tradeLicenseViewed ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-700" />
                      Licence preview opened
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} className="text-amber-700" />
                      Review the licence before approving
                    </>
                  )}
                </p>
              </section>

              {canReview && (
                <section className="rounded-xl border border-slate-200 p-4">
                  <label
                    htmlFor="application-review-notes"
                    className="text-sm font-bold text-slate-800"
                  >
                    Review notes
                  </label>
                  <textarea
                    id="application-review-notes"
                    rows={3}
                    maxLength={1000}
                    placeholder="A reason is required to reject or request changes."
                    aria-invalid={Boolean(reviewForm.formState.errors.reviewNotes)}
                    aria-describedby={reviewForm.formState.errors.reviewNotes ? "application-review-notes-error" : undefined}
                    {...reviewForm.register("reviewNotes", {
                      maxLength: { value: 1000, message: "Review notes must be 1,000 characters or fewer." },
                      validate: (value) => !pendingDecision || Boolean(value.trim()) || "Enter a reason before rejecting or requesting changes.",
                    })}
                    className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-700/10"
                  />
                  {reviewForm.formState.errors.reviewNotes && (
                    <p id="application-review-notes-error" role="alert" className="mt-1 text-xs text-rose-700">
                      {reviewForm.formState.errors.reviewNotes.message}
                    </p>
                  )}
                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    {reviewNotes.length}/1000
                  </p>
                </section>
              )}

              {!canReview && application.reviewNotes && (
                <section className="rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Previous review notes
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {application.reviewNotes}
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>

        {canReview ? (
          <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            {pendingDecision ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-700">
                  {pendingDecision === "rejected"
                    ? "Confirm rejection of this application?"
                    : "Request changes from this provider?"}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingDecision(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void reviewForm.handleSubmit((values) => {
                      if (pendingDecision) {
                        return onDecision(pendingDecision, values.reviewNotes.trim());
                      }
                    })()}
                    className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving…" : "Confirm decision"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-sm text-xs leading-5 text-slate-500">
                    Review all daycare details and open the trade licence before
                    approving.
                  </p>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setPendingDecision("rejected")}
                      disabled={isSubmitting}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDecision("corrections_requested")}
                      disabled={isSubmitting}
                      className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      Request changes
                    </button>
                    <button
                      type="button"
                      disabled={
                        !tradeLicenseViewed || !reviewConfirmed || isSubmitting
                      }
                      onClick={() => void reviewForm.handleSubmit((values) =>
                        onDecision("approved", values.reviewNotes.trim()),
                      )()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <CheckCircle2 size={16} />
                      {isSubmitting ? "Saving…" : "Approve centre"}
                    </button>
                  </div>
                </div>
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-5 text-slate-600">
                  <input
                    type="checkbox"
                    aria-invalid={Boolean(reviewForm.formState.errors.reviewConfirmed)}
                    {...reviewForm.register("reviewConfirmed", {
                      required: "Confirm that you reviewed the application and licence.",
                    })}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
                  />
                  I reviewed the full application details and the trade licence.
                </label>
                {reviewForm.formState.errors.reviewConfirmed && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    {reviewForm.formState.errors.reviewConfirmed.message}
                  </p>
                )}
              </>
            )}
          </footer>
        ) : (
          <footer className="border-t border-slate-200 px-4 py-3 text-center text-sm text-slate-500 sm:px-6">
            This application has already been reviewed.
          </footer>
        )}
      </section>
    </div>
  );
}

function escapeCsv(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function ApplicationCharts({
  applications,
}: {
  applications: ProviderApplication[];
}) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      date,
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
      count: 0,
    };
  });

  applications.forEach((application) => {
    const createdAt = new Date(application.createdAt);
    const month = months.find(
      ({ date }) =>
        date.getFullYear() === createdAt.getFullYear() &&
        date.getMonth() === createdAt.getMonth(),
    );
    if (month) month.count += 1;
  });

  const maxMonthlyCount = Math.max(1, ...months.map(({ count }) => count));
  const statusData = [
    { label: "Approved", count: applications.filter((item) => item.status === "approved").length, color: "bg-emerald-500" },
    { label: "Pending review", count: applications.filter((item) => item.status === "pending_verification").length, color: "bg-amber-500" },
    { label: "Changes requested", count: applications.filter((item) => item.status === "corrections_requested").length, color: "bg-blue-500" },
    { label: "Rejected", count: applications.filter((item) => item.status === "rejected").length, color: "bg-rose-500" },
  ];
  const maxStatusCount = Math.max(1, ...statusData.map(({ count }) => count));

  return (
    <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Application activity
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              New provider requests over the last six months
            </p>
          </div>
          <ChartNoAxesColumnIncreasing
            size={19}
            className="text-teal-700"
            aria-hidden="true"
          />
        </div>
        {applications.length === 0 ? (
          <div className="flex h-52 items-center justify-center text-sm text-slate-400">
            Activity will appear when providers register.
          </div>
        ) : (
          <div
            role="img"
            aria-label={`Monthly provider applications: ${months.map(({ label, count }) => `${label} ${count}`).join(", ")}`}
            className="mt-5 flex h-48 items-end justify-around gap-2 border-b border-slate-100 px-2"
          >
            {months.map(({ label, count }) => (
              <div
                key={`${label}-${count}`}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-[11px] font-semibold text-slate-600">
                  {count}
                </span>
                <div
                  className="w-full max-w-10 rounded-t-md bg-teal-600 transition-all"
                  style={{
                    height: `${Math.max(5, (count / maxMonthlyCount) * 78)}%`,
                  }}
                />
                <span className="text-[11px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Request status
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Breakdown of all provider applications
          </p>
        </div>
        <div className="mt-6 space-y-5">
          {statusData.map(({ label, count, color }) => (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-600">{label}</span>
                <span className="font-semibold text-slate-800">{count}</span>
              </div>
              <div
                role="img"
                aria-label={`${label}: ${count}`}
                className="h-2 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${(count / maxStatusCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function AccountStatus({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? "Active" : "Deactivated"}
    </span>
  );
}

function CentresPanel({
  centres,
  search,
  onSearchChange,
  onToggle,
  onDelete,
  isLoading,
  loadError,
  onRetry,
  busyId,
}: {
  centres: ApprovedCentre[];
  search: string;
  onSearchChange: (value: string) => void;
  onToggle: (centre: ApprovedCentre) => void;
  onDelete: (centre: ApprovedCentre) => void;
  isLoading: boolean;
  loadError: string;
  onRetry: () => void;
  busyId: string;
}) {
  const filtered = centres.filter((centre) =>
    [centre.centreName, centre.ownerName, centre.ownerEmail, centre.district]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Approved daycare centres
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Only approved centres are shown here. Deactivated centres cannot log in.
          </p>
        </div>
        <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 px-3 sm:max-w-xs">
          <Search size={16} className="text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search centres…"
            aria-label="Search approved centres"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">
          Loading approved centres…
        </div>
      ) : loadError ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 text-center">
          <p role="alert" className="text-sm text-rose-700">{loadError}</p>
          <button type="button" onClick={onRetry} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center px-4 text-center text-sm text-slate-500">
          {centres.length ? "No centres match your search." : "No approved daycare centres yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-y border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Centre</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((centre) => (
                <tr key={centre.applicationId} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800">{centre.centreName}</p>
                    <p className="mt-1 text-xs text-slate-500">{centre.centrePhone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs font-medium text-slate-700">{centre.ownerName}</p>
                    <p className="mt-1 text-xs text-slate-500">{centre.ownerEmail}</p>
                  </td>
                  <td className="max-w-56 px-4 py-4 text-xs text-slate-600">
                    <p className="truncate">{centre.district}</p>
                    <p className="mt-1 truncate text-slate-400">{centre.address}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-600">{centre.capacity} children</td>
                  <td className="px-4 py-4"><AccountStatus active={centre.isActive} /></td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyId === centre.applicationId}
                        onClick={() => onToggle(centre)}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold disabled:opacity-50 ${
                          centre.isActive
                            ? "border-amber-200 text-amber-800 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        <Power size={13} />
                        {centre.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === centre.applicationId}
                        onClick={() => onDelete(centre)}
                        aria-label={`Delete ${centre.centreName}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ParentsPanel({
  parents,
  search,
  onSearchChange,
  onToggle,
  onDelete,
  isLoading,
  loadError,
  onRetry,
  busyId,
}: {
  parents: AdminParent[];
  search: string;
  onSearchChange: (value: string) => void;
  onToggle: (parent: AdminParent) => void;
  onDelete: (parent: AdminParent) => void;
  isLoading: boolean;
  loadError: string;
  onRetry: () => void;
  busyId: string;
}) {
  const filtered = parents.filter((parent) =>
    [parent.fullName, parent.email, parent.phoneNumber]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Registered parents</h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage parent accounts that completed registration and verification.
          </p>
        </div>
        <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 px-3 sm:max-w-xs">
          <Search size={16} className="text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search parents…"
            aria-label="Search registered parents"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">
          Loading registered parents…
        </div>
      ) : loadError ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 text-center">
          <p role="alert" className="text-sm text-rose-700">{loadError}</p>
          <button type="button" onClick={onRetry} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center px-4 text-center text-sm text-slate-500">
          {parents.length ? "No parents match your search." : "No verified parent accounts yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-y border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Parent</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((parent) => (
                <tr key={parent.parentId} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800">{parent.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500">{parent.email}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-600">{parent.phoneNumber}</td>
                  <td className="px-4 py-4 text-xs text-slate-600">{formatDate(parent.createdAt)}</td>
                  <td className="px-4 py-4"><AccountStatus active={parent.isActive} /></td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyId === parent.parentId}
                        onClick={() => onToggle(parent)}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold disabled:opacity-50 ${
                          parent.isActive
                            ? "border-amber-200 text-amber-800 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        <Power size={13} />
                        {parent.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === parent.parentId}
                        onClick={() => onDelete(parent)}
                        aria-label={`Delete ${parent.fullName}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [centres, setCentres] = useState<ApprovedCentre[]>([]);
  const [parents, setParents] = useState<AdminParent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCentresLoading, setIsCentresLoading] = useState(true);
  const [isParentsLoading, setIsParentsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [centresLoadError, setCentresLoadError] = useState("");
  const [parentsLoadError, setParentsLoadError] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<ProviderApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [busyId, setBusyId] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ProviderApplicationStatus | "all"
  >("all");
  const [page, setPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const signOut = async () => {
    try {
      await adminApi.post("/logout");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Your admin session could not be revoked on the server."));
    }
    clearAuthSession({ access: "adminToken", refresh: "adminRefreshToken" });
    toast.success("You have signed out.");
    navigate("/admin/login", { replace: true });
  };

  const refreshAdminData = useCallback(async () => {
    setIsRefreshing(true);
    const [applicationsResult, centresResult, parentsResult] =
      await Promise.allSettled([
        fetchProviderApplications(),
        fetchApprovedCentres(),
        fetchParents(),
      ]);

    if (applicationsResult.status === "fulfilled") {
      setApplications(applicationsResult.value);
      setLoadError("");
    } else {
      const message = getApiErrorMessage(
        applicationsResult.reason,
        "Unable to load provider applications.",
      );
      setLoadError(message);
      handleAdminApiError(
        applicationsResult.reason,
        navigate,
        "Unable to refresh provider applications.",
      );
    }

    if (centresResult.status === "fulfilled") {
      setCentres(centresResult.value);
      setCentresLoadError("");
    } else {
      const message = getApiErrorMessage(
        centresResult.reason,
        "Unable to load approved daycare centres.",
      );
      setCentresLoadError(message);
      handleAdminApiError(
        centresResult.reason,
        navigate,
        "Unable to load approved daycare centres.",
      );
    }

    if (parentsResult.status === "fulfilled") {
      setParents(parentsResult.value);
      setParentsLoadError("");
    } else {
      const message = getApiErrorMessage(
        parentsResult.reason,
        "Unable to load registered parents.",
      );
      setParentsLoadError(message);
      handleAdminApiError(
        parentsResult.reason,
        navigate,
        "Unable to load registered parents.",
      );
    }

    setIsLoading(false);
    setIsCentresLoading(false);
    setIsParentsLoading(false);
    setIsRefreshing(false);
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }

    let active = true;
    void Promise.all([
      fetchProviderApplications()
        .then((items) => {
          if (active) {
            setApplications(items);
            setLoadError("");
          }
        })
        .catch((error: unknown) => {
          if (!active) return;
          const message = getApiErrorMessage(
            error,
            "Unable to load provider applications.",
          );
          setLoadError(message);
          handleAdminApiError(error, navigate, message);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        }),
      fetchApprovedCentres()
        .then((items) => {
          if (active) {
            setCentres(items);
            setCentresLoadError("");
          }
        })
        .catch((error: unknown) => {
          if (!active) return;
          const message = getApiErrorMessage(
            error,
            "Unable to load approved daycare centres.",
          );
          setCentresLoadError(message);
          handleAdminApiError(error, navigate, message);
        })
        .finally(() => {
          if (active) setIsCentresLoading(false);
        }),
      fetchParents()
        .then((items) => {
          if (active) {
            setParents(items);
            setParentsLoadError("");
          }
        })
        .catch((error: unknown) => {
          if (!active) return;
          const message = getApiErrorMessage(
            error,
            "Unable to load registered parents.",
          );
          setParentsLoadError(message);
          handleAdminApiError(error, navigate, message);
        })
        .finally(() => {
          if (active) setIsParentsLoading(false);
        }),
    ]);

    return () => {
      active = false;
    };
  }, [navigate]);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          application.centreName,
          application.ownerName,
          application.ownerEmail,
          application.district,
          application.applicationId,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      return matchesStatus && matchesSearch;
    });
  }, [applications, search, statusFilter]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredApplications.length / pageSize),
  );
  const visibleApplications = filteredApplications.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const pageNumbers = Array.from(
    { length: pageCount },
    (_, index) => index + 1,
  )
    .filter(
      (number) =>
        number === 1 ||
        number === pageCount ||
        Math.abs(number - page) <= 1,
    )
    .reduce<Array<number | "ellipsis">>((numbers, number, index, list) => {
      if (index > 0 && number - list[index - 1] > 1) {
        numbers.push("ellipsis");
      }
      numbers.push(number);
      return numbers;
    }, []);

  const counts = {
    total: applications.length,
    pending: applications.filter(
      (application) => application.status === "pending_verification",
    ).length,
    approved: applications.filter(
      (application) => application.status === "approved",
    ).length,
    rejected: applications.filter(
      (application) => application.status === "rejected",
    ).length,
  };

  const decideApplication = async (
    decision: ProviderReviewDecision,
    notes: string,
  ) => {
    if (!selectedApplication) return;
    if (decision !== "approved" && !notes.trim()) {
      toast.error("Add a reason before rejecting or requesting changes.");
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewProviderApplication(
        selectedApplication.applicationId,
        decision,
        notes,
      );
      toast.success(
        decision === "approved"
          ? "Daycare centre approved."
          : decision === "rejected"
            ? "Application rejected."
            : "Changes requested from provider.",
      );
      setSelectedApplication(null);
      await refreshAdminData();
    } catch (error: unknown) {
      handleAdminApiError(
        error,
        navigate,
        "Unable to update this application.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCentre = async (centre: ApprovedCentre) => {
    const isActive = !centre.isActive;
    setBusyId(centre.applicationId);
    try {
      await setCentreActive(centre.applicationId, isActive);
      setCentres((current) =>
        current.map((item) =>
          item.applicationId === centre.applicationId
            ? { ...item, isActive }
            : item,
        ),
      );
      toast.success(
        isActive ? "Daycare centre activated." : "Daycare centre deactivated.",
      );
    } catch (error: unknown) {
      handleAdminApiError(error, navigate, "Unable to update this centre.");
    } finally {
      setBusyId("");
    }
  };

  const removeCentre = async (centre: ApprovedCentre) => {
    const confirmed = await confirmWithToast(
      `Permanently remove ${centre.centreName}? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }
    setBusyId(centre.applicationId);
    try {
      await deleteCentre(centre.applicationId);
      setCentres((current) =>
        current.filter((item) => item.applicationId !== centre.applicationId),
      );
      toast.success("Daycare centre removed.");
    } catch (error: unknown) {
      handleAdminApiError(error, navigate, "Unable to remove this centre.");
    } finally {
      setBusyId("");
    }
  };

  const toggleParent = async (parent: AdminParent) => {
    const isActive = !parent.isActive;
    setBusyId(parent.parentId);
    try {
      await setParentActive(parent.parentId, isActive);
      setParents((current) =>
        current.map((item) =>
          item.parentId === parent.parentId ? { ...item, isActive } : item,
        ),
      );
      toast.success(
        isActive ? "Parent account activated." : "Parent account deactivated.",
      );
    } catch (error: unknown) {
      handleAdminApiError(error, navigate, "Unable to update this parent.");
    } finally {
      setBusyId("");
    }
  };

  const removeParent = async (parent: AdminParent) => {
    const confirmed = await confirmWithToast(
      `Permanently remove ${parent.fullName}'s account? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }
    setBusyId(parent.parentId);
    try {
      await deleteParent(parent.parentId);
      setParents((current) =>
        current.filter((item) => item.parentId !== parent.parentId),
      );
      toast.success("Parent account removed.");
    } catch (error: unknown) {
      handleAdminApiError(error, navigate, "Unable to remove this parent.");
    } finally {
      setBusyId("");
    }
  };

  const exportApplications = () => {
    const headers = [
      "Application ID",
      "Centre",
      "Owner",
      "Owner email",
      "District",
      "Submitted",
      "Status",
    ];
    const rows = filteredApplications.map((application) => [
      application.applicationId,
      application.centreName,
      application.ownerName,
      application.ownerEmail,
      application.district,
      formatDate(application.createdAt),
      statusLabels[application.status],
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => escapeCsv(String(value))).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "provider-applications.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const firstItem = filteredApplications.length ? (page - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(page * pageSize, filteredApplications.length);
  const dashboardStats = [
    {
      title: "Approved centres",
      value: centres.length,
      icon: Building2,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Registered parents",
      value: parents.length,
      icon: Users,
      tone: "bg-violet-50 text-violet-700",
    },
    {
      title: "Awaiting review",
      value: counts.pending,
      icon: Clock3,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      title: "Total applications",
      value: counts.total,
      icon: FileText,
      tone: "bg-blue-50 text-blue-700",
    },
  ];
  const sectionTitles: Record<AdminSection, string> = {
    dashboard: "Dashboard",
    applications: "Applications",
    centres: "Daycare centres",
    parents: "Parents",
  };

  return (
    <div id="dashboard" className="min-h-dvh bg-slate-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />
      <div className="min-h-dvh lg:pl-[248px]">
        <Header
          pendingCount={counts.pending}
          onOpenNavigation={() => setIsSidebarOpen(true)}
          onSignOut={signOut}
        />

        <main className="mx-auto w-full max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Workspace / {sectionTitles[activeSection]}
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {sectionTitles[activeSection]}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {activeSection === "dashboard"
                  ? "Overview of childcare registrations and platform activity."
                  : activeSection === "applications"
                    ? "Review and manage daycare centre registration requests."
                    : activeSection === "centres"
                      ? "Manage approved daycare centres and provider access."
                      : "Manage registered parent accounts and access."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void refreshAdminData()}
                disabled={
                  isRefreshing ||
                  isLoading ||
                  isCentresLoading ||
                  isParentsLoading
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={isRefreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
              {activeSection === "applications" && (
                <button
                  type="button"
                  onClick={exportApplications}
                  disabled={filteredApplications.length === 0}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={15} />
                  Export
                </button>
              )}
            </div>
          </section>

          {(activeSection === "dashboard" ||
            activeSection === "applications") && (
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4">
              {(activeSection === "dashboard"
                ? dashboardStats
                : [
              {
                title: "Total requests",
                value: counts.total,
                icon: FileText,
                tone: "bg-blue-50 text-blue-700",
              },
              {
                title: "Awaiting review",
                value: counts.pending,
                icon: Clock3,
                tone: "bg-amber-50 text-amber-700",
              },
              {
                title: "Approved centres",
                value: counts.approved,
                icon: CheckCircle2,
                tone: "bg-emerald-50 text-emerald-700",
              },
              {
                title: "Rejected requests",
                value: counts.rejected,
                icon: XCircle,
                tone: "bg-rose-50 text-rose-700",
              },
                  ]
              ).map(({ title, value, icon: Icon, tone }) => (
                <article
                  key={title}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}
                  >
                    <Icon size={18} />
                  </div>
                  <p className="mt-3 text-xs font-medium text-slate-500 sm:text-sm">
                    {title}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {isLoading ? "—" : value.toLocaleString()}
                  </p>
                </article>
              ))}
            </section>
          )}

          {activeSection === "dashboard" && (
            <ApplicationCharts applications={applications} />
          )}

          {activeSection === "applications" && (
          <section
            id="applications"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Provider applications
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {filteredApplications.length}{" "}
                    {filteredApplications.length === 1 ? "request" : "requests"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Open a request to inspect its details and documents.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(200px,1fr)_180px] lg:w-[440px] lg:shrink-0">
                <label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-teal-500">
                  <Search size={16} className="shrink-0 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search centre or owner…"
                    aria-label="Search applications"
                    className="min-w-0 w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(
                        event.target.value as ProviderApplicationStatus | "all",
                      );
                      setPage(1);
                    }}
                    aria-label="Filter by application status"
                    className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 outline-none focus:border-teal-500"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending_verification">Pending review</option>
                    <option value="corrections_requested">Changes requested</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
                Loading applications…
              </div>
            ) : loadError ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
                <p role="alert" className="text-sm font-medium text-rose-700">
                  {loadError}
                </p>
                <button
                  type="button"
                  onClick={() => void refreshAdminData()}
                  className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Try again
                </button>
              </div>
            ) : visibleApplications.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
                <FileText size={28} className="text-slate-300" />
                <h4 className="mt-3 text-sm font-semibold text-slate-800">
                  {applications.length === 0
                    ? "No provider applications yet"
                    : "No matching applications"}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  {applications.length === 0
                    ? "New daycare registration requests will appear here."
                    : "Try another search or status filter."}
                </p>
              </div>
            ) : (
              <>
                <ApplicationTable
                  applications={visibleApplications}
                  onView={setSelectedApplication}
                />
                <MobileApplicationCards
                  applications={visibleApplications}
                  onView={setSelectedApplication}
                />

                <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-center text-xs text-slate-500 sm:text-left">
                    Showing{" "}
                    <span className="font-semibold text-slate-800">
                      {firstItem}–{lastItem}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-800">
                      {filteredApplications.length}
                    </span>{" "}
                    applications
                  </p>
                  <nav
                    aria-label="Application pages"
                    className="flex items-center justify-center gap-1"
                  >
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      aria-label="Previous page"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      <ArrowLeft size={15} />
                    </button>
                    {pageNumbers.map((number, index) =>
                      number === "ellipsis" ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-1 text-xs text-slate-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={number}
                          type="button"
                          aria-label={`Page ${number}`}
                          aria-current={page === number ? "page" : undefined}
                          onClick={() => setPage(number)}
                          className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold ${
                            page === number
                              ? "bg-teal-700 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {number}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      disabled={page === pageCount}
                      onClick={() =>
                        setPage((current) => Math.min(pageCount, current + 1))
                      }
                      aria-label="Next page"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      <ArrowRight size={15} />
                    </button>
                  </nav>
                </div>
              </>
            )}
          </section>
          )}

          {activeSection === "centres" && (
            <CentresPanel
              centres={centres}
              search={directorySearch}
              onSearchChange={setDirectorySearch}
              onToggle={(centre) => void toggleCentre(centre)}
              onDelete={(centre) => void removeCentre(centre)}
              isLoading={isCentresLoading}
              loadError={centresLoadError}
              onRetry={() => void refreshAdminData()}
              busyId={busyId}
            />
          )}

          {activeSection === "parents" && (
            <ParentsPanel
              parents={parents}
              search={directorySearch}
              onSearchChange={setDirectorySearch}
              onToggle={(parent) => void toggleParent(parent)}
              onDelete={(parent) => void removeParent(parent)}
              isLoading={isParentsLoading}
              loadError={parentsLoadError}
              onRetry={() => void refreshAdminData()}
              busyId={busyId}
            />
          )}

          <footer className="flex flex-col gap-2 pb-3 pt-1 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>Little Steps · Admin workspace</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Provider documents are securely loaded for review
            </p>
          </footer>
        </main>
      </div>

      {selectedApplication && (
        <ApplicationReviewDialog
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onDecision={decideApplication}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
