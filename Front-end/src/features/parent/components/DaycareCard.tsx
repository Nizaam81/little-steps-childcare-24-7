import {
  AlertCircle,
  ArrowRight,
  Clock,
  Heart,
  MapPin,
  Moon,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { Daycare } from "../dashboardTypes";

type DaycareCardProps = {
  center: Daycare;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onBook: (center: Daycare) => void;
};

const DaycareCard = ({
  center,
  isFavorite,
  onToggleFavorite,
  onBook,
}: DaycareCardProps) => (
  <article className="overflow-hidden rounded-2xl border border-[#e3ece7] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#c5dfd3] hover:shadow-lg">
    <div className="relative h-48">
      <img src={center.image} alt={center.name} className="h-full w-full object-cover" />
      {center.verified && (
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#237960] shadow">
          <ShieldCheck size={14} /> Verified
        </span>
      )}
      <button
        onClick={() => onToggleFavorite(center.id)}
        className="absolute right-3 top-3 rounded-full bg-white p-2 shadow"
        aria-label={`${isFavorite ? "Remove" : "Save"} ${center.name} ${isFavorite ? "from" : "to"} favorites`}
        aria-pressed={isFavorite}
      >
        <Heart size={19} className={isFavorite ? "fill-[#278a70] text-[#278a70]" : "text-[#778691]"} />
      </button>
    </div>

    <div className="space-y-4 p-5">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans text-lg font-extrabold text-[#26384b]">{center.name}</h3>
          <span className="flex items-center gap-1 text-sm font-semibold text-[#526777]">
            <Star size={15} className="fill-yellow-400 text-yellow-400" /> {center.rating}
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1 text-sm text-[#778691]">
          <MapPin size={15} /> {center.location}
        </p>
      </div>

      <p className="text-sm leading-6 text-[#687a88]">{center.description}</p>

      <div className="flex flex-wrap gap-2">
        {center.ages.map((age) => (
          <span key={age} className="rounded-full bg-[#e5f4ee] px-3 py-1 text-xs font-medium text-[#237960]">{age}</span>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[#687a88]">
        {center.available24 && <span className="flex items-center gap-1"><Clock size={14} /> 24×7</span>}
        {center.timings.includes("Night") && <span className="flex items-center gap-1"><Moon size={14} /> Night care</span>}
        {center.timings.includes("Emergency") && <span className="flex items-center gap-1"><AlertCircle size={14} /> Emergency</span>}
        {center.openingTime && center.closingTime && (
          <span className="flex items-center gap-1"><Clock size={14} /> {center.openingTime}–{center.closingTime}</span>
        )}
      </div>
      {center.availabilitySlots && center.availabilitySlots.length > 0 && (
        <p className="text-xs text-[#687a88]">
          Available slots: {center.availabilitySlots.map((slot) => `${slot.startTime}–${slot.endTime}`).join(", ")}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-[#e5eeea] pt-4">
        <div>
          <p className="text-xs text-[#778691]">Starting from</p>
          <p className="text-xl font-bold text-[#237960]">
            ₹{center.price.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-[#778691]"> /month</span>
          </p>
          {center.pricePlans &&
            (center.pricePlans.hourly > 0 || center.pricePlans.daily > 0) && (
              <p className="mt-1 text-[11px] text-[#778691]">
                {center.pricePlans.hourly > 0 && `₹${center.pricePlans.hourly.toLocaleString("en-IN")}/hr`}
                {center.pricePlans.hourly > 0 && center.pricePlans.daily > 0 && " · "}
                {center.pricePlans.daily > 0 && `₹${center.pricePlans.daily.toLocaleString("en-IN")}/day`}
              </p>
            )}
        </div>
        <button
          onClick={() => onBook(center)}
          className="flex items-center gap-2 rounded-xl bg-[#278a70] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f755f]"
        >
          Book now <ArrowRight size={16} />
        </button>
      </div>
      <p className="text-xs text-[#81929b]">{center.reviews} parent reviews</p>
    </div>
  </article>
);

export default DaycareCard;
