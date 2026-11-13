import type { Booking, Daycare } from "./dashboardTypes";

export const daycares: Daycare[] = [
  {
    id: 1,
    name: "Little Stars Daycare",
    location: "Kochi, Kerala",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
    rating: 4.9,
    reviews: 128,
    price: 3500,
    ages: ["Infant", "Toddler", "Preschool"],
    timings: ["Day", "Night"],
    available24: true,
    verified: true,
    description: "Safe and nurturing childcare with experienced caregivers.",
  },
  {
    id: 2,
    name: "Happy Kids Crèche",
    location: "Edappally, Kochi",
    image: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800",
    rating: 4.7,
    reviews: 86,
    price: 2800,
    ages: ["Toddler", "Preschool"],
    timings: ["Day"],
    available24: false,
    verified: true,
    description: "Play-based learning and spacious indoor activities.",
  },
  {
    id: 3,
    name: "Tiny Tots Childcare",
    location: "Kakkanad, Kochi",
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800",
    rating: 4.8,
    reviews: 94,
    price: 4200,
    ages: ["Infant", "Toddler"],
    timings: ["Day", "Night", "Emergency"],
    available24: true,
    verified: true,
    description: "Flexible childcare with trained staff and secure facilities.",
  },
];

export const initialBookings: Booking[] = [
  {
    id: "demo-active-booking",
    center: daycares[0],
    status: "Active",
    plan: "Monthly plan · November",
  },
];
