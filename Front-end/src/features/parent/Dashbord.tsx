import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import BookingDialog from "./components/BookingDialog";
import DaycareDetailsDialog from "./components/DaycareDetailsDialog";
import CaregiverRecommendations from "./components/CaregiverRecommendations";
import DashboardHeader from "./components/DashboardHeader";
import DashboardFooter from "./components/DashboardFooter";
import DaycareDiscovery from "./components/DaycareDiscovery";
import FeedbackDialog from "./components/FeedbackDialog";
import ParentSettings from "./components/ParentSettings";
import WelcomeAndStats from "./components/WelcomeAndStats";
import { daycares } from "./dashboardData";
import type {
  Booking,
  CurrentLocation,
  DashboardFilters,
  Daycare,
  ParentProfile,
} from "./dashboardTypes";
import {
  createParentBooking,
  fetchCentres,
  fetchNotifications,
  fetchParentBookings,
  fetchParentProfile,
  fetchRecommendedCaregivers,
  fetchWishlist,
  markNotificationsRead,
  removeWishlistItem,
  requestParentCameraAccess,
  saveWishlistItem,
  submitFeedback,
  type ParentNotification,
  type RecommendedCaregiver,
} from "./parentApi";
import { clearAuthSession } from "../auth/authSession";
import apiClient from "../../config/axios";
import { getApiErrorMessage } from "../../utils/api-error-message";

const initialFilters: DashboardFilters = {
  search: "",
  location: "All",
  age: "All",
  timing: "All",
  only24: false,
  maxPrice: 6000,
  sort: "recommended",
};

const emptyProfile: ParentProfile = {
  fullName: "",
  email: "",
  phoneNumber: "",
};

function toParentDaycare(record: Awaited<ReturnType<typeof fetchCentres>>[number]): Daycare {
  const careTypes = record.careTypes.map((type) => type.toLowerCase());
  const timings = [
    ...(careTypes.some((type) => type.includes("night")) ? ["Night"] : []),
    ...(careTypes.some((type) => type.includes("emergency")) ? ["Emergency"] : []),
    ...(careTypes.some((type) => type.includes("day") || type.includes("daily") || type.includes("monthly")) ? ["Day"] : []),
  ];

  return {
    id: record.id,
    serverId: record.id,
    name: record.name,
    location: `${record.address}, ${record.district}`,
    district: record.district,
    image: record.photos[0]?.url ?? daycares[0]?.image ?? "",
    rating: record.rating,
    reviews: record.reviews,
    price: record.monthlyPrice,
    ages: record.ageGroups,
    timings,
    available24: careTypes.some((type) => type.includes("24/7") || type.includes("24×7")),
    verified: record.verified,
    description: record.description || "Care information provided by this approved daycare centre.",
    openingTime: record.openingTime,
    closingTime: record.closingTime,
    pricePlans: {
      hourly: record.hourlyPrice,
      daily: record.dailyPrice,
      monthly: record.monthlyPrice,
    },
    availabilitySlots: record.availabilitySlots,
    photos: record.photos,
  };
}

function toParentBooking(
  booking: Awaited<ReturnType<typeof fetchParentBookings>>[number],
  centres: Daycare[],
): Booking {
  const centre = centres.find((item) => item.serverId === booking.centreId) ?? {
    id: booking.centreId,
    serverId: booking.centreId,
    name: booking.centreName,
    location: booking.location,
    district: "",
    image: daycares[0]?.image ?? "",
    rating: 0,
    reviews: 0,
    price: 0,
    ages: [],
    timings: [],
    available24: false,
    verified: true,
    description: "",
  };
  const status: Booking["status"] =
    booking.status === "accepted"
      ? booking.bookingStartDate && booking.bookingEndDate &&
        new Date(booking.bookingStartDate) <= new Date() &&
        new Date(booking.bookingEndDate) >= new Date()
        ? "Active"
        : "Accepted"
      : booking.status === "rejected"
        ? "Declined"
        : "Pending";

  return {
    id: booking.id,
    center: centre,
    status,
    plan: `${booking.carePlan} · ${new Date(booking.requestedDate).toLocaleDateString()}`,
    bookingStartDate: booking.bookingStartDate,
    bookingEndDate: booking.bookingEndDate,
    cameraAccessStatus: booking.cameraAccessStatus ?? "not_requested",
  };
}

type FeedbackTarget =
  | { type: "daycare"; id: string; name: string }
  | { type: "caregiver"; id: string; name: string };

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [centres, setCentres] = useState<Daycare[]>([]);
  const [caregivers, setCaregivers] = useState<RecommendedCaregiver[]>([]);
  const [favorites, setFavorites] = useState<Array<string | number>>([]);
  const [savedCaregiverIds, setSavedCaregiverIds] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [profile, setProfile] = useState<ParentProfile>(emptyProfile);
  const [selectedCenter, setSelectedCenter] = useState<Daycare | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Daycare | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackTarget | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editProfileOnOpen, setEditProfileOnOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<string | undefined>();
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation>({
    status: "requesting",
  });
  const [isLoading, setIsLoading] = useState(true);
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
          ? "Location permission was denied. Choose a daycare district from the location filter."
          : error.code === error.POSITION_UNAVAILABLE
            ? "Your location is unavailable right now. Choose a daycare district from the location filter."
            : "Location detection timed out. Choose a daycare district from the location filter.";
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
    const refreshFamilyUpdates = async () => {
      try {
        const [notificationRecords, bookingRecords] = await Promise.all([
          fetchNotifications(),
          fetchParentBookings(),
        ]);
        setNotifications(notificationRecords);
        setBookings(bookingRecords.map((item) => toParentBooking(item, centres)));
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clearAuthSession({ access: "parentToken", refresh: "parentRefreshToken" });
          navigate("/login", { replace: true });
          return;
        }
        toast.error(getApiErrorMessage(error, "Unable to refresh your booking updates."));
      }
    };
    const intervalId = window.setInterval(() => void refreshFamilyUpdates(), 30_000);
    return () => window.clearInterval(intervalId);
  }, [centres, navigate]);

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      try {
        const [
          parentProfile,
          centreRecords,
          caregiverRecords,
          wishlist,
          notificationRecords,
          bookingRecords,
        ] = await Promise.all([
          fetchParentProfile(),
          fetchCentres(),
          fetchRecommendedCaregivers(),
          fetchWishlist(),
          fetchNotifications(),
          fetchParentBookings(),
        ]);
        if (!active) return;

        const centreList = centreRecords.map(toParentDaycare);
        setProfile(parentProfile);
        setCentres(centreList);
        setCaregivers(caregiverRecords);
        setFavorites(wishlist.filter((item) => item.targetType === "daycare").map((item) => item.targetId));
        setSavedCaregiverIds(wishlist.filter((item) => item.targetType === "caregiver").map((item) => item.targetId));
        setNotifications(notificationRecords);
        setBookings(bookingRecords.map((item) => toParentBooking(item, centreList)));
      } catch (error: unknown) {
        if (active) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            clearAuthSession({ access: "parentToken", refresh: "parentRefreshToken" });
            navigate("/login", { replace: true });
            return;
          }
          toast.error(getApiErrorMessage(error, "Unable to load your parent dashboard."));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [navigate]);

  const locations = useMemo(
    () => [...new Set(centres.map((centre) => centre.district).filter((value): value is string => Boolean(value)))].sort(),
    [centres],
  );

  const filteredCenters = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const location = filters.location.toLowerCase();
    const results = centres.filter((center) => {
      const locationText = `${center.district ?? ""} ${center.location}`.toLowerCase();
      const matchesSearch = `${center.name} ${locationText}`.includes(search);
      const matchesLocation = filters.location === "All" || locationText.includes(location);
      return (
        matchesSearch &&
        matchesLocation &&
        (filters.age === "All" || center.ages.some((age) => age.toLowerCase().includes(filters.age.toLowerCase()))) &&
        (filters.timing === "All" || center.timings.includes(filters.timing)) &&
        (!filters.only24 || center.available24) &&
        center.price <= filters.maxPrice
      );
    });

    if (filters.sort === "rating") return [...results].sort((a, b) => b.rating - a.rating);
    if (filters.sort === "price") return [...results].sort((a, b) => a.price - b.price);
    return results;
  }, [centres, filters]);

  const toggleDaycareWishlist = async (id: string | number) => {
    if (typeof id !== "string") return;
    const saved = favorites.includes(id);
    try {
      if (saved) {
        await removeWishlistItem({ targetType: "daycare", targetId: id });
        setFavorites((current) => current.filter((value) => value !== id));
        toast.success("Removed from your wishlist.");
      } else {
        await saveWishlistItem({ targetType: "daycare", targetId: id });
        setFavorites((current) => [...current, id]);
        toast.success("Daycare saved to your wishlist.");
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to update your wishlist."));
    }
  };

  const toggleCaregiverWishlist = async (caregiverId: string) => {
    const saved = savedCaregiverIds.includes(caregiverId);
    try {
      const item = { targetType: "caregiver" as const, targetId: caregiverId };
      if (saved) {
        await removeWishlistItem(item);
        setSavedCaregiverIds((current) => current.filter((id) => id !== caregiverId));
        toast.success("Caregiver removed from your wishlist.");
      } else {
        await saveWishlistItem(item);
        setSavedCaregiverIds((current) => [...current, caregiverId]);
        toast.success("Caregiver saved to your wishlist.");
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to update your wishlist."));
    }
  };

  const submitBooking = async (childName: string, bookingStartDate: string, bookingEndDate: string) => {
    if (!selectedCenter?.serverId) {
      toast.error("Choose an approved daycare centre to send a request.");
      return;
    }
    if (activeBooking) {
      toast.error("You already have an accepted booking in progress.");
      return;
    }
    try {
      await createParentBooking({
        centreId: selectedCenter.serverId,
        childName,
        carePlan: "Monthly care",
        requestedDate: bookingStartDate,
        bookingStartDate,
        bookingEndDate,
      });
      setSelectedCenter(null);
      toast.success("Your care request was sent to the daycare.");
      const [bookingRecords, notificationRecords] = await Promise.all([
        fetchParentBookings(),
        fetchNotifications(),
      ]);
      setBookings(bookingRecords.map((item) => toParentBooking(item, centres)));
      setNotifications(notificationRecords);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to send your daycare request."));
    }
  };

  const sendFeedback = async (rating: number, comment: string) => {
    if (!selectedFeedback) return;
    try {
      await submitFeedback({
        targetType: selectedFeedback.type,
        targetId: selectedFeedback.id,
        rating,
        comment,
      });
      const feedbackTargetType = selectedFeedback.type;
      setSelectedFeedback(null);
      toast.success("Thank you for sharing your feedback.");
      try {
        if (feedbackTargetType === "daycare") {
          setCentres((await fetchCentres()).map(toParentDaycare));
        } else {
          setCaregivers(await fetchRecommendedCaregivers());
        }
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, "Feedback was saved, but ratings could not be refreshed."));
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to submit your feedback."));
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to update your notifications."));
    }
  };

  const signOut = async () => {
    try {
      await apiClient.post("/logout");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Your session could not be revoked on the server."));
    } finally {
      clearAuthSession({ access: "parentToken", refresh: "parentRefreshToken" });
      toast.success("You have signed out.");
      navigate("/login", { replace: true });
    }
  };

  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const activeBooking = bookings.find((booking) =>
    booking.status === "Active" &&
    booking.bookingStartDate &&
    booking.bookingEndDate &&
    new Date(booking.bookingStartDate) <= new Date() &&
    new Date(booking.bookingEndDate) >= new Date(),
  );
  const requestCameraAccess = async () => {
    if (!activeBooking) return;
    try {
      await requestParentCameraAccess(activeBooking.id);
      setBookings((current) => current.map((booking) =>
        booking.id === activeBooking.id
          ? { ...booking, cameraAccessStatus: "pending" }
          : booking,
      ));
      toast.success("Your camera-access request was sent to the daycare.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to request camera access."));
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#f6f9f7] text-[#26384b]">
      <DashboardHeader
        profileName={profile.fullName || "Parent"}
        unreadNotifications={unreadNotifications}
        notifications={notifications}
        onMarkNotificationsRead={() => void markAllNotificationsRead()}
        onSignOut={() => void signOut()}
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
            centers={centres}
            profile={profile}
            startInEditMode={editProfileOnOpen}
            initialSection={settingsSection}
            onBack={() => setSettingsOpen(false)}
            onProfileSaved={setProfile}
          />
          <DashboardFooter />
        </>
      ) : (
        <>
          <main className="mx-auto max-w-7xl space-y-9 px-4 py-7 sm:py-10 lg:px-8">
            <WelcomeAndStats
              profileName={profile.fullName || "Parent"}
              nearbyCount={centres.length}
              savedCount={favorites.length + savedCaregiverIds.length}
              bookingCount={bookings.filter((booking) => booking.status === "Active").length}
              unreadNotifications={unreadNotifications}
            />
            {isLoading && (
              <p role="status" className="rounded-xl bg-white p-4 text-sm text-[#687a88]">Loading your approved daycare listings and family activity…</p>
            )}
            <DaycareDiscovery
              centers={filteredCenters}
              filters={filters}
              favorites={favorites}
              locations={locations}
              currentLocation={currentLocation}
              onFiltersChange={setFilters}
              onRetryLocation={requestCurrentLocation}
              onToggleFavorite={(id) => void toggleDaycareWishlist(id)}
              onBook={setSelectedCenter}
              onViewDetails={setSelectedDetails}
              activeBookingCentreId={activeBooking?.center.serverId}
              hasActiveBooking={Boolean(activeBooking)}
              onReview={(center) => {
                if (!center.serverId) return;
                setSelectedFeedback({ type: "daycare", id: center.serverId, name: center.name });
              }}
            />
            <CaregiverRecommendations
              caregivers={caregivers}
              savedCaregiverIds={savedCaregiverIds}
              onSaveCaregiver={(id) => void toggleCaregiverWishlist(id)}
              onReviewCaregiver={(caregiver) => setSelectedFeedback({
                type: "caregiver",
                id: caregiver.id,
                name: `${caregiver.name} · ${caregiver.centreName}`,
              })}
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
                <span className="block font-semibold text-[#26384b]">Your family activity</span>
                <span className="mt-1 block text-sm text-[#778691]">Review bookings and manage your parent profile.</span>
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
          onConfirm={(childName, startDate, endDate) =>
            void submitBooking(childName, startDate, endDate)
          }
        />
      )}

      {selectedDetails && (
        <DaycareDetailsDialog
          center={selectedDetails}
          hasActiveBooking={Boolean(activeBooking)}
          isActiveBookingCentre={Boolean(
            activeBooking?.center.serverId &&
            activeBooking.center.serverId === selectedDetails.serverId,
          )}
          cameraAccessStatus={activeBooking?.cameraAccessStatus ?? "not_requested"}
          onRequestCameraAccess={() => void requestCameraAccess()}
          onClose={() => setSelectedDetails(null)}
          onBook={() => {
            setSelectedCenter(selectedDetails);
            setSelectedDetails(null);
          }}
        />
      )}

      {selectedFeedback && (
        <FeedbackDialog
          targetName={selectedFeedback.name}
          onClose={() => setSelectedFeedback(null)}
          onSubmit={sendFeedback}
        />
      )}

    </div>
  );
};

export default ParentDashboard;
