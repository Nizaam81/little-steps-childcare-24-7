export type Daycare = {
  id: string | number;
  serverId?: string;
  district?: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  ages: string[];
  timings: string[];
  available24: boolean;
  verified: boolean;
  description: string;
  openingTime?: string;
  closingTime?: string;
  pricePlans?: {
    hourly: number;
    daily: number;
    monthly: number;
  };
  availabilitySlots?: { startTime: string; endTime: string }[];
  availableDays?: string[];
  photos?: { id: string; url: string }[];
};

export type Booking = {
  id: string;
  center: Daycare;
  status: "Active" | "Accepted" | "Pending" | "Declined" | "Canceled";
  plan: string;
  bookingStartDate?: string;
  bookingEndDate?: string;
  cameraAccessStatus?: "not_requested" | "pending" | "approved" | "rejected";
};

export type DashboardFilters = {
  search: string;
  location: string;
  age: string;
  timing: string;
  only24: boolean;
  maxPrice: number;
  sort: string;
};

export type CurrentLocation =
  | { status: "requesting" }
  | { status: "detected"; latitude: number; longitude: number; accuracy: number }
  | { status: "error"; message: string };

export type ParentProfile = {
  fullName: string;
  email: string;
  phoneNumber: string;
};
