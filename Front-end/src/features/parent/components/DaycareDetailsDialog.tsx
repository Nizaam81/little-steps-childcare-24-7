import { useState } from "react";
import { CalendarDays, Clock, MapPin, ShieldCheck, Star, Video, X } from "lucide-react";
import type { Daycare } from "../dashboardTypes";

type Props = {
  center: Daycare;
  hasActiveBooking: boolean;
  isActiveBookingCentre: boolean;
  cameraAccessStatus: "not_requested" | "pending" | "approved" | "rejected";
  onRequestCameraAccess: () => void;
  onBook: () => void;
  onClose: () => void;
};

export default function DaycareDetailsDialog({
  center,
  hasActiveBooking,
  isActiveBookingCentre,
  cameraAccessStatus,
  onRequestCameraAccess,
  onBook,
  onClose,
}: Props) {
  const photos = center.photos?.length
    ? center.photos.map((photo) => photo.url)
    : [center.image];
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#26384b]/50 p-3 sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="daycare-details-title"
        className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-4 text-[#26384b] shadow-xl sm:max-h-[calc(100dvh-2.5rem)] sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#278a70]">Approved daycare</p>
            <h2 id="daycare-details-title" className="truncate text-xl font-extrabold sm:text-2xl">{center.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close daycare details">
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <img src={photos[selectedPhoto]} alt={`${center.name} daycare`} className="h-56 w-full rounded-2xl object-cover sm:h-72" />
            {photos.length > 1 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {photos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() => setSelectedPhoto(index)}
                    aria-label={`View daycare photo ${index + 1}`}
                    aria-pressed={selectedPhoto === index}
                    className={`overflow-hidden rounded-lg border-2 ${selectedPhoto === index ? "border-[#278a70]" : "border-transparent"}`}
                  >
                    <img src={photo} alt="" className="h-16 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#687a88]">{center.description}</p>
            <p className="flex items-start gap-2 text-sm text-[#526777]"><MapPin size={17} className="mt-0.5 shrink-0 text-[#278a70]" />{center.location}</p>
            <p className="flex items-center gap-2 text-sm text-[#526777]"><Clock size={17} className="text-[#278a70]" />{center.openingTime || "Hours not provided"}{center.closingTime ? `–${center.closingTime}` : ""}</p>
            <p className="flex items-center gap-2 text-sm text-[#526777]"><Star size={17} className="fill-amber-400 text-amber-400" />{center.rating} · {center.reviews} parent reviews</p>
            {center.verified && <p className="flex items-center gap-2 text-sm font-semibold text-[#237960]"><ShieldCheck size={17} />Verified centre</p>}
            <div className="flex flex-wrap gap-2">
              {center.ages.map((age) => <span key={age} className="rounded-full bg-[#e5f4ee] px-3 py-1 text-xs font-semibold text-[#237960]">{age}</span>)}
            </div>
            {center.availableDays?.length ? (
              <p className="flex items-start gap-2 text-sm text-[#526777]"><CalendarDays size={17} className="mt-0.5 text-[#278a70]" />{center.availableDays.join(", ")}</p>
            ) : null}
            {center.availabilitySlots?.length ? (
              <p className="text-xs leading-5 text-[#687a88]">Available slots: {center.availabilitySlots.map((slot) => `${slot.startTime}–${slot.endTime}`).join(", ")}</p>
            ) : null}
            <p className="font-bold text-[#237960]">{center.price > 0 ? `₹${center.price.toLocaleString("en-IN")} / month` : "Contact centre for pricing"}</p>
          </div>
        </div>
        {isActiveBookingCentre ? (
          <div className="mt-5 rounded-xl border border-[#dcece5] bg-[#f6faf8] p-4">
            <p className="flex items-center gap-2 font-semibold text-[#237960]"><Video size={18} />Live camera access</p>
            <p className="mt-1 text-sm leading-5 text-[#687a88]">
              {cameraAccessStatus === "pending"
                ? "Your request is waiting for the daycare to respond."
                : cameraAccessStatus === "approved"
                  ? "The daycare approved your request. Contact them for access details; live streaming is not connected in this app."
                  : cameraAccessStatus === "rejected"
                    ? "The daycare declined your previous request. You can request access again."
                    : "Request access from the daycare. Live streaming is not connected in this app."}
            </p>
            <button
              type="button"
              onClick={onRequestCameraAccess}
              disabled={cameraAccessStatus === "pending" || cameraAccessStatus === "approved"}
              className="mt-3 rounded-lg bg-[#278a70] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f755f] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {cameraAccessStatus === "pending" ? "Request pending" : cameraAccessStatus === "approved" ? "Access approved" : "Request camera access"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={hasActiveBooking}
            onClick={onBook}
            className="mt-5 w-full rounded-xl bg-[#278a70] py-3 font-semibold text-white hover:bg-[#1f755f] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {hasActiveBooking ? "Booking unavailable while your accepted booking is active" : "Request care"}
          </button>
        )}
      </section>
    </div>
  );
}
