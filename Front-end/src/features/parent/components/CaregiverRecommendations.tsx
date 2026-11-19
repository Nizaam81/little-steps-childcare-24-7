import { useState } from "react";
import { BadgeCheck, Heart, MapPin, MessageSquareText, Star } from "lucide-react";
import type { RecommendedCaregiver } from "../parentApi";
import ResponsivePagination from "../../../components/ResponsivePagination";

type CaregiverRecommendationsProps = {
  caregivers: RecommendedCaregiver[];
  savedCaregiverIds: string[];
  onSaveCaregiver: (caregiverId: string) => void;
  onReviewCaregiver: (caregiver: RecommendedCaregiver) => void;
};

export default function CaregiverRecommendations({
  caregivers,
  savedCaregiverIds,
  onSaveCaregiver,
  onReviewCaregiver,
}: CaregiverRecommendationsProps) {
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const topCaregivers = [...caregivers].sort(
    (a, b) => b.reviews - a.reviews || b.rating - a.rating,
  );
  const visibleCaregivers = topCaregivers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section id="caregivers" className="space-y-5" aria-labelledby="caregiver-recommendations-title">
      <div>
        <p className="text-sm font-semibold tracking-wide text-[#278a70]">DAYCARE CAREGIVER PROFILES</p>
        <h2 id="caregiver-recommendations-title" className="mt-1 font-sans text-2xl font-extrabold tracking-tight text-[#26384b]">
          Most reviewed caregivers
        </h2>
        <p className="mt-2 text-sm text-[#687a88]">
          Caregivers are listed by the approved daycare centre they work with and ranked by parent feedback.
        </p>
      </div>

      {topCaregivers.length === 0 ? (
        <div className="rounded-3xl border border-[#e3ece7] bg-white p-8 text-center">
          <p className="font-semibold text-[#26384b]">No caregiver profiles yet</p>
          <p className="mt-2 text-sm text-[#687a88]">Approved daycares will appear here as they add caregiver profiles.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCaregivers.map((caregiver) => {
            const isSaved = savedCaregiverIds.includes(caregiver.id);
            return (
              <article key={caregiver.id} className="rounded-2xl border border-[#e3ece7] bg-white p-5 shadow-sm transition hover:border-[#c5dfd3] hover:shadow-md">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5f4ee] font-bold text-[#237960]">
                    {caregiver.name.split(" ").map((part) => part[0]).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#26384b]">{caregiver.name}</h3>
                    <p className="mt-0.5 text-xs text-[#778691]">{caregiver.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSaveCaregiver(caregiver.id)}
                    aria-label={`${isSaved ? "Remove" : "Add"} ${caregiver.name} ${isSaved ? "from" : "to"} wishlist`}
                    aria-pressed={isSaved}
                    className="rounded-lg p-2 text-[#278a70] transition hover:bg-[#f0f8f4]"
                  >
                    <Heart size={18} className={isSaved ? "fill-[#278a70]" : ""} />
                  </button>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[#526777]">
                  <MapPin size={15} className="shrink-0 text-[#278a70]" />
                  <span className="truncate">{caregiver.centreName} · {caregiver.district}</span>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e9] px-2.5 py-1 font-semibold text-[#8a651e]">
                    <Star size={13} className="fill-[#d9a83b] text-[#d9a83b]" />
                    {caregiver.rating > 0 ? caregiver.rating.toFixed(1) : "New"}
                  </span>
                  <span className="rounded-full bg-[#f4f7f5] px-2.5 py-1 text-[#526777]">
                    {caregiver.reviews} {caregiver.reviews === 1 ? "review" : "reviews"}
                  </span>
                  <span className="rounded-full bg-[#f4f7f5] px-2.5 py-1 text-[#526777]">
                    {caregiver.experience}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#eaf1ed] pt-3">
                  <p className="inline-flex items-center gap-1.5 text-xs text-[#237960]">
                    <BadgeCheck size={14} /> Listed by this daycare
                  </p>
                  <button
                    type="button"
                    onClick={() => onReviewCaregiver(caregiver)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#278a70] hover:bg-[#f0f8f4]"
                  >
                    <MessageSquareText size={14} /> Review
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <ResponsivePagination page={page} pageCount={Math.ceil(topCaregivers.length / pageSize)} onPageChange={setPage} />
    </section>
  );
}
