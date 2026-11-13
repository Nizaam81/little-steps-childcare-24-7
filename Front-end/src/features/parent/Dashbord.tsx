import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BookingDialog from "./components/BookingDialog";
import DashboardHeader from "./components/DashboardHeader";
import DashboardFooter from "./components/DashboardFooter";
import DaycareDiscovery from "./components/DaycareDiscovery";
import ParentSettings from "./components/ParentSettings";
import WelcomeAndStats from "./components/WelcomeAndStats";
import { daycares, initialBookings } from "./dashboardData";
import {
  readParentVisibleCentre,
  readParentProviderWorkspace,
  saveProviderWorkspace,
  type BookingRequest,
} from "../provider/providerWorkspace";
import type { ProviderCentreProfile } from "../provider/providerWorkspace";
import type {
  Booking,
  CurrentLocation,
  DashboardFilters,
  Daycare,
  ParentProfile,
} from "./dashboardTypes";

const initialFilters: DashboardFilters = {
  search: "",
  age: "All",
  timing: "All",
  only24: false,
  maxPrice: 6000,
  sort: "recommended",
};

function toParentDaycare(profile: ProviderCentreProfile): Daycare {
  return {
    id: -1,
    name: profile.name,
    location: `${profile.address}, ${profile.district}`,
    image: daycares[0].image,
    rating: 0,
    reviews: 0,
    price: profile.monthlyPrice,
    ages: profile.ageGroups,
    timings: [
      ...(profile.careTypes.includes("Night care") ? ["Night"] : []),
      ...(profile.careTypes.includes("Emergency care") ? ["Emergency"] : []),
      ...(profile.careTypes.includes("Day care") ? ["Day"] : []),
    ],
    available24: profile.careTypes.includes("24/7"),
    verified: true,
    description: profile.description || "Care information provided by this daycare centre.",
    openingTime: profile.openingTime,
    closingTime: profile.closingTime,
    pricePlans: {
      hourly: profile.hourlyPrice,
      daily: profile.dailyPrice,
      monthly: profile.monthlyPrice,
    },
    availabilitySlots: profile.availabilitySlots,
  };
}

function toParentBookingStatus(
  status: BookingRequest["status"],
): Booking["status"] {
  if (status === "Accepted") return "Active";
  if (status === "Declined") return "Declined";
  return "Pending";
}

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedCenter, setSelectedCenter] = useState<Daycare | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editProfileOnOpen, setEditProfileOnOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<string | undefined>();
  const [profile, setProfile] = useState<ParentProfile>({
    fullName: "Sarah Johnson",
    email: "sarah@example.com",
    phoneNumber: "",
  });
  const [providerCentre, setProviderCentre] = useState<ProviderCentreProfile | null>(null);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation>({
    status: "requesting",
  });
  const hasRequestedLocation = useRef(false);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setCurrentLocation({
        status: "error",
        message: "Location detection isn't supported by this browser.",
      });
      return;
    }

    setCurrentLocation({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentLocation({
          status: "detected",
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? "Location permission was denied. Allow it in your browser settings, then retry."
          : error.code === error.POSITION_UNAVAILABLE
            ? "Your location is unavailable right now. Please try again."
            : "Location detection timed out. Please try again.";
        setCurrentLocation({ status: "error", message });
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  };

  useEffect(() => {
    if (hasRequestedLocation.current) return;
    hasRequestedLocation.current = true;
    requestCurrentLocation();
  }, []);

  useEffect(() => {
    const loadProviderCentre = () => {
      try {
        setProviderCentre(readParentVisibleCentre());
        const providerData = readParentProviderWorkspace();
        const providerWorkspace = providerData?.workspace;
        if (providerWorkspace) {
          const providerListing = toParentDaycare(providerWorkspace.profile);
          setBookings((current) => {
            const providerBookings = providerWorkspace.bookings
              .map((request) =>
                request.parentBookingId
                  ? { request, id: request.parentBookingId }
                  : null,
              )
              .filter(
                (item): item is { request: BookingRequest; id: string } =>
                  item !== null,
              );
            const existingIds = new Set(current.map((booking) => booking.id));
            const updated = current.map((booking) => {
              const match = providerBookings.find(
                (item) => item.id === booking.id,
              );
              if (!match) return booking;
              return {
                ...booking,
                center: providerListing,
                status: toParentBookingStatus(match.request.status),
              };
            });
            const newBookings: Booking[] = providerBookings
              .filter(({ id }) => !existingIds.has(id))
              .map(({ request, id }) => ({
                id,
                center: providerListing,
                status: toParentBookingStatus(request.status),
                plan: `${request.carePlan} · ${request.requestedDate}`,
              }));
            return [...newBookings, ...updated];
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load daycare details.");
      }
    };

    loadProviderCentre();
    window.addEventListener("storage", loadProviderCentre);
    return () => window.removeEventListener("storage", loadProviderCentre);
  }, []);

  const availableCenters = useMemo(() => {
    if (
      !providerCentre?.isAcceptingBookings ||
      !providerCentre.name.trim() ||
      !providerCentre.address.trim() ||
      !providerCentre.district.trim() ||
      providerCentre.monthlyPrice <= 0
    ) {
      return daycares;
    }

    const providerListing = toParentDaycare(providerCentre);
    return [providerListing, ...daycares];
  }, [providerCentre]);

  const filteredCenters = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const results = availableCenters.filter((center) => {
      const matchesSearch = `${center.name} ${center.location}`.toLowerCase().includes(search);
      return (
        matchesSearch &&
        (filters.age === "All" || center.ages.includes(filters.age)) &&
        (filters.timing === "All" || center.timings.includes(filters.timing)) &&
        (!filters.only24 || center.available24) &&
        center.price <= filters.maxPrice
      );
    });

    if (filters.sort === "rating") return results.sort((a, b) => b.rating - a.rating);
    if (filters.sort === "price") return results.sort((a, b) => a.price - b.price);
    return results;
  }, [availableCenters, filters]);

  const toggleFavorite = (id: number) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id],
    );
  };

  const submitDemoBooking = (childName: string) => {
    if (!selectedCenter) return;
    const bookingId = `booking-${Date.now()}`;
    const booking: Booking = {
      id: bookingId,
      center: selectedCenter,
      status: "Pending",
      plan: "Monthly plan · Awaiting centre confirmation",
    };

    if (selectedCenter.id === -1) {
      try {
        const providerData = readParentProviderWorkspace();
        if (!providerData?.workspace) {
          throw new Error("The daycare workspace is unavailable. Please try again later.");
        }
        saveProviderWorkspace(providerData.providerId, {
          ...providerData.workspace,
          bookings: [
            {
              id: bookingId,
              parentBookingId: bookingId,
              parentName: profile.fullName,
              childName,
              carePlan: "Monthly care",
              requestedDate: new Intl.DateTimeFormat("en").format(new Date()),
              status: "Pending",
            },
            ...providerData.workspace.bookings,
          ],
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to submit your booking request.");
        return;
      }
    }

    setBookings((current) => [booking, ...current]);
    setSelectedCenter(null);
    toast.success(
      selectedCenter.id === -1
        ? "Booking request sent to the daycare."
        : "Demo request added to My Bookings for this page session.",
    );
  };

  const signOut = () => {
    localStorage.removeItem("parentToken");
    toast.success("You have signed out.");
    navigate("/login", { replace: true });
  };

  return (
    <div id="top" className="min-h-screen bg-[#f6f9f7] text-[#26384b]">
      <DashboardHeader
        profileName={profile.fullName}
        unreadNotifications={unreadNotifications}
        onMarkNotificationsRead={() => setUnreadNotifications(0)}
        onSignOut={signOut}
        onOpenSettings={(section) => {
          setEditProfileOnOpen(false);
          setSettingsSection(section);
          setSettingsOpen(true);
        }}
        onEditProfile={() => {
          setEditProfileOnOpen(true);
          setSettingsSection("parent-profile");
          setSettingsOpen(true);
        }}
      />

      {settingsOpen ? (
        <>
          <ParentSettings
            key={editProfileOnOpen ? "edit-profile" : "settings"}
            bookings={bookings}
            centers={availableCenters}
            profile={profile}
            startInEditMode={editProfileOnOpen}
            initialSection={settingsSection}
            onBack={() => setSettingsOpen(false)}
            onManageSubscription={() => setSubscriptionOpen(true)}
            onProfileSaved={setProfile}
          />
          <DashboardFooter />
        </>
      ) : (
        <>
          <main className="mx-auto max-w-7xl space-y-9 px-4 py-7 sm:py-10 lg:px-8">
            <WelcomeAndStats
              profileName={profile.fullName}
              nearbyCount={availableCenters.length}
              savedCount={favorites.length}
              bookingCount={bookings.filter((booking) => booking.status === "Active").length}
              unreadNotifications={unreadNotifications}
            />
            <DaycareDiscovery
              centers={filteredCenters}
              filters={filters}
              favorites={favorites}
              currentLocation={currentLocation}
              onFiltersChange={setFilters}
              onRetryLocation={requestCurrentLocation}
              onToggleFavorite={toggleFavorite}
              onBook={setSelectedCenter}
            />
            <button
              type="button"
              onClick={() => {
                setEditProfileOnOpen(false);
                setSettingsSection(undefined);
                setSettingsOpen(true);
              }}
              className="w-full rounded-2xl border border-[#dcece5] bg-white p-4 text-left shadow-sm transition hover:border-[#c5dfd3] hover:shadow-md sm:flex sm:items-center sm:justify-between sm:px-5"
            >
              <span>
                <span className="block font-semibold text-[#26384b]">Your care plan and family activity</span>
                <span className="mt-1 block text-sm text-[#778691]">View bookings, payments, camera access, recommendations and account settings.</span>
              </span>
              <span className="mt-3 inline-flex rounded-lg bg-[#e5f4ee] px-3 py-2 text-sm font-semibold text-[#237960] sm:mt-0">
                Open settings
              </span>
            </button>
          </main>
          <DashboardFooter />
        </>
      )}

      {selectedCenter && (
        <BookingDialog
          center={selectedCenter}
          onClose={() => setSelectedCenter(null)}
          onConfirm={submitDemoBooking}
        />
      )}

      {subscriptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#26384b]/45 p-4">
          <section className="w-full max-w-md rounded-3xl border border-[#e3ece7] bg-white p-6 text-[#26384b] shadow-xl" role="dialog" aria-modal="true" aria-labelledby="subscription-title">
            <div className="flex items-center justify-between">
              <h2 id="subscription-title" className="text-xl font-bold">Monthly Care</h2>
              <button onClick={() => setSubscriptionOpen(false)} className="rounded-lg p-2 text-[#687a88] hover:bg-[#f1f7f4]" aria-label="Close subscription details">×</button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#687a88]">
              This is sample subscription information. Subscription management and payment endpoints are not connected yet.
            </p>
            <button
              onClick={() => setSubscriptionOpen(false)}
              className="mt-5 w-full rounded-xl bg-[#278a70] py-3 font-semibold text-white shadow-sm transition hover:bg-[#1f755f]"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
