import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  BrainCircuit,
  Heart,
  Sparkles,
  Star,
} from "lucide-react";

type CareStyle = "Any" | "Early learning" | "Gentle care" | "Outdoor play";
type Caregiver = {
  id: number;
  name: string;
  role: string;
  rating: number;
  experience: number;
  ages: string[];
  specialties: Exclude<CareStyle, "Any">[];
};

const caregivers: Caregiver[] = [
  {
    id: 1,
    name: "Ananya Menon",
    role: "Early-years educator",
    rating: 4.9,
    experience: 7,
    ages: ["Infant", "Toddler"],
    specialties: ["Early learning", "Gentle care"],
  },
  {
    id: 2,
    name: "Meera Thomas",
    role: "Childcare professional",
    rating: 4.8,
    experience: 5,
    ages: ["Toddler", "Preschool"],
    specialties: ["Outdoor play", "Gentle care"],
  },
  {
    id: 3,
    name: "Asha Nair",
    role: "Preschool caregiver",
    rating: 4.7,
    experience: 6,
    ages: ["Preschool", "Toddler"],
    specialties: ["Early learning", "Outdoor play"],
  },
];

type CaregiverRecommendationsProps = {
  onSaveCaregiver?: (caregiverId: number) => void;
};

const CaregiverRecommendations = ({
  onSaveCaregiver,
}: CaregiverRecommendationsProps) => {
  const [age, setAge] = useState("Toddler");
  const [careStyle, setCareStyle] = useState<CareStyle>("Any");
  const [savedCaregivers, setSavedCaregivers] = useState<number[]>([]);

  const recommendations = useMemo(() => caregivers
    .map((caregiver) => {
      const ageMatch = caregiver.ages.includes(age);
      const styleMatch = careStyle === "Any" || caregiver.specialties.includes(careStyle);
      const matchScore = Math.min(
        99,
        78 + (ageMatch ? 12 : 0) + (styleMatch ? 7 : 0) + Math.round(caregiver.rating),
      );
      return { caregiver, matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore), [age, careStyle]);

  const toggleSaved = (caregiverId: number) => {
    const alreadySaved = savedCaregivers.includes(caregiverId);
    setSavedCaregivers((current) => alreadySaved
      ? current.filter((id) => id !== caregiverId)
      : [...current, caregiverId]);
    if (!alreadySaved) onSaveCaregiver?.(caregiverId);
    toast.success(alreadySaved ? "Removed from saved caregivers." : "Caregiver saved in this page.");
  };

  return (
    <section id="caregivers" className="space-y-5" aria-labelledby="caregiver-recommendations-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[#278a70]">PERSONALIZED CARE</p>
          <h2 id="caregiver-recommendations-title" className="mt-1 font-sans text-2xl font-extrabold tracking-tight text-[#26384b]">
            Caregiver recommendations
          </h2>
          <p className="mt-2 text-sm text-[#687a88]">Explore suggested caregiver profiles for your family.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#dcece5] bg-white px-3 py-1.5 text-xs font-semibold text-[#526777]">
          <BrainCircuit size={15} className="text-[#278a70]" /> Recommendation preview
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e3ece7] bg-white shadow-sm">
        <div className="grid gap-4 border-b border-[#eaf1ed] bg-[#fbfdfc] p-4 sm:grid-cols-2 sm:p-5">
          <label className="text-xs font-bold uppercase tracking-wide text-[#687a88]" htmlFor="recommendation-age">
            Child's age group
            <select
              id="recommendation-age"
              value={age}
              onChange={(event) => setAge(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-[#dce8e2] bg-white p-3 text-sm font-medium normal-case tracking-normal text-[#26384b] outline-none focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]"
            >
              <option>Infant</option>
              <option>Toddler</option>
              <option>Preschool</option>
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-[#687a88]" htmlFor="recommendation-style">
            Care preference
            <select
              id="recommendation-style"
              value={careStyle}
              onChange={(event) => setCareStyle(event.target.value as CareStyle)}
              className="mt-2 block w-full rounded-xl border border-[#dce8e2] bg-white p-3 text-sm font-medium normal-case tracking-normal text-[#26384b] outline-none focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]"
            >
              <option>Any</option>
              <option>Early learning</option>
              <option>Gentle care</option>
              <option>Outdoor play</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
          {recommendations.map(({ caregiver, matchScore }) => {
            const isSaved = savedCaregivers.includes(caregiver.id);
            return (
              <article key={caregiver.id} className="rounded-2xl border border-[#e3ece7] bg-white p-4 transition hover:border-[#c5dfd3] hover:shadow-sm">
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
                    onClick={() => toggleSaved(caregiver.id)}
                    aria-label={`${isSaved ? "Unsave" : "Save"} ${caregiver.name}`}
                    aria-pressed={isSaved}
                    className="rounded-lg p-2 text-[#278a70] transition hover:bg-[#f0f8f4]"
                  >
                    <Heart size={18} className={isSaved ? "fill-[#278a70]" : ""} />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e9] px-2.5 py-1 font-semibold text-[#8a651e]">
                    <Star size={13} className="fill-[#d9a83b] text-[#d9a83b]" /> {caregiver.rating}
                  </span>
                  <span className="rounded-full bg-[#f4f7f5] px-2.5 py-1 text-[#526777]">
                    {caregiver.experience} years' experience
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e5f4ee] px-2.5 py-1 font-semibold text-[#237960]">
                    <Sparkles size={12} /> {matchScore}% match
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {caregiver.specialties.map((specialty) => (
                    <span key={specialty} className="rounded-full border border-[#e3ece7] px-2.5 py-1 text-xs text-[#687a88]">
                      {specialty}
                    </span>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[#778691]">
                  <BadgeCheck size={14} className="text-[#278a70]" /> Sample profile · verify with provider
                </p>
              </article>
            );
          })}
        </div>
        <p className="border-t border-[#eaf1ed] px-4 py-3 text-xs leading-5 text-[#778691] sm:px-5">
          Demo recommendations use sample profiles and your selected preferences only; no AI service or caregiver verification is connected.
        </p>
      </div>
    </section>
  );
};

export default CaregiverRecommendations;
