import {
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import type {
  DashboardFilters,
  Daycare,
} from "../dashboardTypes";
import { locationRegions } from "../dashboardLocations";
import DaycareCard from "./DaycareCard";
import ResponsivePagination from "../../../components/ResponsivePagination";

type DaycareDiscoveryProps = {
  centers: Daycare[];
  filters: DashboardFilters;
  favorites: Array<string | number>;
  locations: string[];
  places: string[];
  onFiltersChange: (filters: DashboardFilters) => void;
  onToggleFavorite: (id: string | number) => void;
  onBook: (center: Daycare) => void;
  onViewDetails: (center: Daycare) => void;
  onReview: (center: Daycare) => void;
  activeBookingCentreId?: string;
  hasActiveBooking: boolean;
};

const DaycareDiscovery = ({
  centers,
  filters,
  favorites,
  locations,
  places,
  onFiltersChange,
  onToggleFavorite,
  onBook,
  onViewDetails,
  onReview,
  activeBookingCentreId,
  hasActiveBooking,
}: DaycareDiscoveryProps) => {
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const pageCount = Math.ceil(centers.length / pageSize);
  const resetPage = () => setPage(1);
  const visibleCentres = centers.slice((page - 1) * pageSize, page * pageSize);
  const updateFilter = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    resetPage();
    onFiltersChange({
      ...filters,
      [name]: name === "maxPrice" && value !== "All" ? Number(value) : value,
    });
  };

  const clearFilters = () => {
    resetPage();
    onFiltersChange({
      search: "",
      location: "All",
      age: "All",
      timing: "All",
      only24: false,
      maxPrice: "All",
      sort: "recommended",
    });
  };

  const activeFilterCount = [
    filters.age !== "All",
    filters.location !== "All",
    filters.timing !== "All",
    filters.only24,
    filters.maxPrice !== "All",
  ].filter(Boolean).length;

  return (
    <section id="discover" className="space-y-5">
      <div>
        <p className="text-sm font-semibold tracking-wide text-[#278a70]">DISCOVER CHILDCARE</p>
        <h2 className="mt-1 font-sans text-2xl font-extrabold tracking-tight text-[#26384b] sm:text-3xl">Find the perfect daycare</h2>
        <p className="mt-2 text-sm text-[#687a88]">Search, compare and choose trusted childcare centers.</p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-[#e3ece7] bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.75fr)]">
        <div className="relative self-start">
          <Search className="absolute left-3 top-3.5 text-[#81929b]" size={20} />
          <input
            name="search"
            value={filters.search}
            onChange={updateFilter}
            placeholder="Search by daycare, state, district or place"
            aria-label="Search daycare, state, district or place"
            className="w-full rounded-xl border border-[#dce8e2] bg-[#f8faf9] py-3 pl-11 pr-4 text-sm text-[#26384b] outline-none placeholder:text-[#94a3ad] focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]"
          />
        </div>
        <div>
          <label htmlFor="location-filter" className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#687a88]">Daycare location</label>
          <select
            id="location-filter"
            name="location"
            value={filters.location}
            onChange={updateFilter}
            className="w-full rounded-xl border border-[#dce8e2] bg-white p-3 text-sm font-medium text-[#26384b] outline-none focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]"
          >
            <option value="All">All locations</option>
            {locationRegions.map((region) => (
              <optgroup key={region.name} label={region.name}>
                <option value={`state:${region.name}`}>All {region.name}</option>
                {region.districts.map((district) => (
                  <option key={district} value={`district:${district}`}>{district}</option>
                ))}
              </optgroup>
            ))}
            {locations.some((location) => !locationRegions.some((region) =>
              region.districts.some((district) => district.toLocaleLowerCase() === location.toLocaleLowerCase()),
            )) && (
              <optgroup label="Other approved daycare districts">
                {locations
                  .filter((location) => !locationRegions.some((region) =>
                    region.districts.some((district) => district.toLocaleLowerCase() === location.toLocaleLowerCase()),
                  ))
                  .map((location) => (
                    <option key={location} value={`district:${location}`}>{location}</option>
                  ))}
              </optgroup>
            )}
            {places.length > 0 && (
              <optgroup label="Approved daycare places">
                {places.map((place) => (
                  <option key={place} value={`place:${place}`}>{place}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e3ece7] bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#eaf1ed] bg-[#fbfdfc] px-4 py-4 sm:px-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f4ee] text-[#278a70]">
            <SlidersHorizontal size={19} />
          </span>
          <div>
            <h3 className="font-sans font-extrabold text-[#26384b]">Refine your search</h3>
            <p className="mt-0.5 text-xs text-[#778691]">Choose the care options that fit your family</p>
          </div>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-[#e5f4ee] px-2.5 py-1 text-xs font-semibold text-[#237960]">
              {activeFilterCount} active
            </span>
          )}
          <button
            onClick={clearFilters}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#278a70] transition hover:bg-[#e5f4ee]"
          >
            <X size={15} /> Clear filters
          </button>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          <div>
            <label htmlFor="age-filter" className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#687a88]">Age group</label>
            <select id="age-filter" name="age" value={filters.age} onChange={updateFilter} className="w-full rounded-xl border border-[#dce8e2] bg-white p-3 text-sm font-medium text-[#26384b] outline-none transition focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]">
              <option>All</option><option>Infant</option><option>Toddler</option><option>Preschool</option>
            </select>
          </div>
          <div>
            <label htmlFor="timing-filter" className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#687a88]">Care timing</label>
            <select id="timing-filter" name="timing" value={filters.timing} onChange={updateFilter} className="w-full rounded-xl border border-[#dce8e2] bg-white p-3 text-sm font-medium text-[#26384b] outline-none transition focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]">
              <option>All</option><option>Day</option><option>Night</option><option>Emergency</option>
            </select>
          </div>
          <div>
            <label htmlFor="price-filter" className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#687a88]">Monthly budget</label>
            <select id="price-filter" name="maxPrice" value={filters.maxPrice} onChange={updateFilter} className="w-full rounded-xl border border-[#dce8e2] bg-white p-3 text-sm font-medium text-[#26384b] outline-none transition focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]">
              <option value="All">Any price</option><option value={3000}>Up to ₹3,000</option><option value={4000}>Up to ₹4,000</option><option value={5000}>Up to ₹5,000</option><option value={6000}>Up to ₹6,000</option>
            </select>
          </div>
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${filters.only24 ? "border-[#9ccfba] bg-[#f0f8f4]" : "border-[#dce8e2] bg-white hover:bg-[#fbfdfc]"}`}>
            <input
              type="checkbox"
              checked={filters.only24}
              onChange={(event) => {
                resetPage();
                onFiltersChange({ ...filters, only24: event.target.checked });
              }}
              className="h-4 w-4 accent-[#278a70]"
            />
            <span>
              <span className="block text-sm font-semibold text-[#26384b]">24×7 availability</span>
              <span className="block text-xs text-[#778691]">Open all day</span>
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-sans text-xl font-extrabold tracking-tight text-[#26384b]">Recommended daycare</h2>
            <p className="mt-1 text-sm text-[#778691]">{centers.length} centers found</p>
          </div>
          <label className="sr-only" htmlFor="center-sort">Sort daycare centers</label>
          <select
            id="center-sort"
            name="sort"
            value={filters.sort}
            onChange={updateFilter}
            className="rounded-lg border border-[#dce8e2] bg-white p-2 text-xs text-[#526777] outline-none focus:border-[#278a70] sm:text-sm"
          >
            <option value="recommended">Recommended</option>
            <option value="rating">Highest rated</option>
            <option value="price">Price: low to high</option>
          </select>
        </div>

        {centers.length === 0 ? (
          <div className="rounded-2xl border border-[#e3ece7] bg-white p-10 text-center">
            <Filter className="mx-auto mb-3 text-[#81929b]" size={32} />
            <h3 className="font-bold">No daycare centers found</h3>
            <p className="mt-2 text-sm text-[#687a88]">Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleCentres.map((center) => (
              <DaycareCard
                key={center.id}
                center={center}
                isFavorite={favorites.includes(center.id)}
                onToggleFavorite={onToggleFavorite}
                onBook={onBook}
                onViewDetails={onViewDetails}
                onReview={onReview}
                hasActiveBooking={hasActiveBooking}
                isActiveBookingCentre={Boolean(center.serverId && center.serverId === activeBookingCentreId)}
              />
            ))}
          </div>
        )}
        <ResponsivePagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </section>
  );
};

export default DaycareDiscovery;
