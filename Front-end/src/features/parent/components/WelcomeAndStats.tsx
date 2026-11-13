import {
  ArrowRight,
  Bell,
  CalendarDays,
  Heart,
  MapPin,
} from "lucide-react";

type WelcomeAndStatsProps = {
  profileName: string;
  nearbyCount: number;
  savedCount: number;
  bookingCount: number;
  unreadNotifications: number;
};

const WelcomeAndStats = ({
  profileName,
  nearbyCount,
  savedCount,
  bookingCount,
  unreadNotifications,
}: WelcomeAndStatsProps) => (
  <>
    <section className="overflow-hidden rounded-3xl border border-[#dcece5] bg-gradient-to-r from-[#e5f4ee] to-[#f3f9f6] p-6 text-[#26384b] shadow-sm sm:p-9">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-semibold text-[#278a70]">Your child's care starts here</p>
          <h1 className="font-sans text-2xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {profileName.split(" ")[0] || "Parent"}!
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#617b76] sm:text-base">
            Discover trusted daycare centers around you. Find the right care for your little one's needs.
          </p>
          <a href="#discover" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#278a70] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1f755f]">
            Explore daycare <ArrowRight size={17} />
          </a>
        </div>
        <div className="text-7xl sm:text-8xl" aria-hidden="true">🧸</div>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Dashboard summary">
      {[
        { title: "Nearby centers", value: String(nearbyCount).padStart(2, "0"), icon: MapPin },
        { title: "Active bookings", value: String(bookingCount).padStart(2, "0"), icon: CalendarDays },
        { title: "Saved centers", value: String(savedCount).padStart(2, "0"), icon: Heart },
        { title: "Notifications", value: String(unreadNotifications).padStart(2, "0"), icon: Bell },
      ].map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.title} className="rounded-2xl border border-[#e3ece7] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f4ee] text-[#278a70]">
              <Icon size={21} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-[#778691] sm:text-sm">{stat.title}</p>
          </div>
        );
      })}
    </section>
  </>
);

export default WelcomeAndStats;
