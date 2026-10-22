
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  MapPin,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
  Star,
} from "lucide-react";

const centers = [
  {
    name: "Willow & Co. Childcare",
    area: "Mueller",
    distance: "1.2 miles",
    rating: "4.9",
    reviews: 128,
    price: 18,
    available: 4,
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Bright Nest Learning",
    area: "Hyde Park",
    distance: "2.4 miles",
    rating: "4.8",
    reviews: 94,
    price: 16,
    available: 6,
    image:
      "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Little Oak House",
    area: "Cherrywood",
    distance: "1.8 miles",
    rating: "4.9",
    reviews: 76,
    price: 20,
    available: 2,
    image:
      "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?auto=format&fit=crop&w=900&q=85",
  },
];

const careTypes = [
  {
    title: "Everyday care",
    description: "A nurturing place to learn, play, and grow.",
    Icon: Sun,
  },
  {
    title: "Evenings & overnight",
    description: "Reassuring care when your day runs late.",
    Icon: Moon,
  },
  {
    title: "Flexible & occasional",
    description: "A few hours of support, whenever life happens.",
    Icon: CalendarDays,
  },
];

const steps = [
  {
    number: "01",
    title: "Find your fit",
    description:
      "Filter by age, location, schedule, and budget. Compare the details that matter.",
  },
  {
    number: "02",
    title: "Get to know your care",
    description:
      "Meet caregivers, read family reviews, and see what verification covers.",
  },
  {
    number: "03",
    title: "Book with confidence",
    description:
      "Choose your child and schedule. Review every fee before you confirm.",
  },
];

const inputClass =
  "mt-2 w-full min-w-0 rounded-xl border border-[#e1e9e5] bg-white px-3 py-3 text-sm text-[#243649] outline-none transition focus:border-[#29966f] focus:ring-2 focus:ring-[#29966f]/15";

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [careDate, setCareDate] = useState("");
  const [childAge, setChildAge] = useState("3 years");
  const [searchMessage, setSearchMessage] = useState("");

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!location.trim()) {
      setSearchMessage("Please enter a location to find childcare.");
      return;
    }

    const searchParams = new URLSearchParams({
      location: location.trim(),
      childAge,
    });
    if (careDate) searchParams.set("careDate", careDate);
    navigate(`/centers?${searchParams.toString()}`);
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f7faf9] text-[#243649]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#e7eeeb] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="Little Steps home"
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f4f1] text-[#29966f]">
              <span className="text-xl font-bold">ls</span>
            </span>
            <span className="text-lg font-bold tracking-tight">
              Little Steps
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <a className="text-sm text-slate-600 transition hover:text-[#29966f]" href="#centers">
              Find childcare
            </a>
            <a className="text-sm text-slate-600 transition hover:text-[#29966f]" href="#how-it-works">
              How it works
            </a>
            <a className="text-sm text-slate-600 transition hover:text-[#29966f]" href="#trust">
              Trust & safety
            </a>
            <a className="text-sm text-slate-600 transition hover:text-[#29966f]" href="#providers">
              For providers
            </a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-[#f0f6f3]"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-[#243649] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#344c63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29966f] focus-visible:ring-offset-2"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e1e9e5] sm:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="grid gap-1 border-t border-[#e7eeeb] bg-white p-4 sm:hidden">
            {[
              ["Find childcare", "#centers"],
              ["How it works", "#how-it-works"],
              ["Trust & safety", "#trust"],
              ["For providers", "#providers"],
              ["Log in", "/login"],
              ["Get started", "/register"],
            ].map(([label, href]) => (
              href.startsWith("#") ? (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-[#e6f4f1]"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  to={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-[#e6f4f1]"
                >
                  {label}
                </Link>
              )
            ))}
          </nav>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="bg-white">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e6f4f1] px-3.5 py-2 text-xs font-semibold text-[#277e62]">
              <Sparkles size={15} />
              Care that fits your real life
            </div>

            <h1 className="max-w-xl text-4xl font-semibold leading-[1.13] tracking-tight sm:text-5xl lg:text-[58px]">
              A little help.
              <br />
              A lot of peace of mind.
            </h1>

            <p className="mt-5 text-base font-semibold text-[#29966f] sm:text-lg">
              Safe care. Happy children. Peace of mind.
            </p>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              Find trusted childcare around the corner, around your schedule.
              Discover verified centers for everyday care, evenings, and
              everything in between.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-slate-600 sm:text-sm">
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#29966f]" />
                Verified providers
              </span>
              <span className="flex items-center gap-2">
                <Clock3 size={16} className="text-[#29966f]" />
                Flexible care
              </span>
              <span className="flex items-center gap-2">
                <Heart size={16} className="text-[#29966f]" />
                Family-first support
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[570px]">
            <img
              src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1200&q=85"
              alt="Children enjoying a creative activity in a childcare setting"
              fetchPriority="high"
              className="aspect-[5/4] w-full rounded-[28px] object-cover shadow-sm sm:aspect-[1.12/1]"
            />

            <div className="absolute -bottom-5 left-3 flex max-w-[calc(100%-24px)] items-center gap-3 rounded-2xl border border-[#e8eeeb] bg-white p-3.5 shadow-lg sm:bottom-7 sm:-left-7 sm:max-w-[290px] sm:p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f4f1] text-[#29966f]">
                <ShieldCheck size={24} />
              </span>
              <div>
                <p className="text-sm font-semibold">Trust starts with care</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Learn what each provider&apos;s verification covers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search form */}
        <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-7 sm:px-6 sm:pt-8 lg:px-8 lg:pb-14">
          <form
            onSubmit={handleSearch}
            className="grid gap-3 rounded-2xl border border-[#e4ece8] bg-white p-4 shadow-[0_8px_35px_rgba(36,54,73,0.05)] sm:p-5 lg:grid-cols-[1.2fr_1fr_0.8fr_auto] lg:items-end lg:gap-4"
          >
            <label className="block min-w-0 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-2">
                <MapPin size={15} className="text-[#29966f]" />
                Where do you need care?
              </span>
              <input
                className={inputClass}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City or neighborhood"
                autoComplete="address-level2"
                aria-label="Childcare location"
              />
            </label>

            <label className="block min-w-0 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-2">
                <CalendarDays size={15} className="text-[#29966f]" />
                When?
              </span>
              <input
                type="date"
                className={inputClass}
                value={careDate}
                min={new Date().toLocaleDateString("en-CA")}
                onChange={(event) => setCareDate(event.target.value)}
                aria-label="Date childcare is needed"
              />
            </label>

            <label className="block min-w-0 text-xs font-semibold text-slate-600">
              Child&apos;s age
              <select
                className={inputClass}
                value={childAge}
                onChange={(event) => setChildAge(event.target.value)}
              >
                <option>Infant</option>
                <option>1 year</option>
                <option>2 years</option>
                <option>3 years</option>
                <option>4 years</option>
                <option>5+ years</option>
              </select>
            </label>

            <button
              type="submit"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#243649] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#344c63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29966f] focus-visible:ring-offset-2 lg:mb-0.5"
            >
              <Search size={17} />
              Find childcare
            </button>

            {searchMessage && (
              <p
                role="status"
                className="text-sm text-[#277e62] sm:col-span-2 lg:col-span-4"
              >
                {searchMessage}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Care types */}
      <section className="bg-[#e6f4f1] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Every family&apos;s rhythm is different.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            From everyday routines to the occasional late night, find care that
            works for your family.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {careTypes.map(({ title, description, Icon }) => (
              <a
                href="#centers"
                key={title}
                className="group rounded-2xl border border-white bg-white p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29966f] sm:p-6"
              >
                <Icon className="text-[#29966f]" size={24} />
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#29966f]">
                  Explore care
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Childcare centers */}
      <section id="centers" className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                A good place to start, close to home.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Explore a few example childcare profiles.
              </p>
            </div>
            <Link
              to="/centers"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#dce6e1] bg-white px-4 py-3 text-sm font-semibold transition hover:bg-[#e6f4f1]"
            >
              Explore all centers <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {centers.map((center) => (
              <article
                key={center.name}
                className="overflow-hidden rounded-2xl border border-[#e4ece8] bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={center.image}
                  alt={`Childcare setting for ${center.name}`}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                />

                <div className="p-4 sm:p-5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4f1] px-2.5 py-1 text-[11px] font-semibold text-[#277e62]">
                    <Check size={12} />
                    Sample profile
                  </span>

                  <h3 className="mt-3 text-base font-semibold">
                    {center.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {center.area} · {center.distance}
                  </p>

                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                    <Star
                      size={15}
                      className="fill-amber-400 text-amber-400"
                    />
                    <span className="font-semibold">{center.rating}</span>
                    <span>({center.reviews} reviews)</span>
                  </p>

                  <div className="my-4 border-t border-[#edf1ef]" />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      ${center.price}
                      <span className="font-normal text-slate-500"> / hour</span>
                    </p>
                    <span className="text-xs font-medium text-[#29966f]">
                      {center.available} example spots
                    </span>
                  </div>

                  <Link
                    to="/centers"
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#dce6e1] px-4 py-2 text-sm font-semibold transition hover:border-[#29966f] hover:bg-[#e6f4f1]"
                  >
                    View center <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Illustrative sample listings only. Prices, reviews, availability,
            and verification must come from real provider data before launch.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            From looking to booked, without the guesswork.
          </h2>

          <div className="mt-9 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {steps.map((step) => (
              <div key={step.number}>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f4f1] text-xs font-bold text-[#277e62]">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="bg-[#f0f6f3] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
          <div>
            <span className="text-sm font-semibold text-[#29966f]">
              Care with clarity
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Little ones deserve big peace of mind.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              Learn about provider checks, qualifications, care policies, and
              the information available to families before they book.
            </p>
            <Link
              to="/trust-and-safety"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#243649] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#344c63]"
            >
              Our trust & safety standards <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Provider verification",
                description:
                  "Show families which checks have actually been completed.",
                Icon: ShieldCheck,
              },
              {
                title: "Clear care details",
                description:
                  "Make policies, schedules, and pricing easier to understand.",
                Icon: Check,
              },
              {
                title: "Secure family accounts",
                description:
                  "Protect family information and child profiles.",
                Icon: Heart,
              },
              {
                title: "Helpful support",
                description:
                  "Give families a clear way to ask questions and get help.",
                Icon: Clock3,
              },
            ].map(({ title, description, Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#e3ebe7] bg-white p-5"
              >
                <Icon size={22} className="text-[#29966f]" />
                <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider CTA */}
      <section id="providers" className="bg-[#243649] py-12 text-white sm:py-16 lg:py-20">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Do what you do best. We&apos;ll help with the rest.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Help families discover your childcare service and manage
              inquiries, availability, and bookings in one place.
            </p>
          </div>
          <Link
            to="/provider/register"
            className="inline-flex min-h-12 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-[#29966f] px-5 py-3 text-sm font-semibold transition hover:bg-[#29966f]"
          >
            Become a provider <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f4f1] text-[#29966f]">
                ls
              </span>
              Little Steps
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
              A little help finding care. A lot more room for family life.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">For families</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-500">
              <a href="#centers" className="hover:text-[#29966f]">Find childcare</a>
              <a href="#how-it-works" className="hover:text-[#29966f]">How it works</a>
              <Link to="/login" className="hover:text-[#29966f]">Family login</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">For providers</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-500">
              <Link to="/provider/register" className="hover:text-[#29966f]">Join Little Steps</Link>
              <Link to="/provider/login" className="hover:text-[#29966f]">Provider login</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Need help?</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-500">
              <Link to="/trust-and-safety" className="hover:text-[#29966f]">Trust & safety</Link>
              <Link to="/privacy" className="hover:text-[#29966f]">Privacy policy</Link>
              <Link to="/contact" className="hover:text-[#29966f]">Contact us</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e7eeeb]">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} Little Steps. All rights reserved.</p>
            <p>Thoughtful care for growing families.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
