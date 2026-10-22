import { Link, useLocation } from "react-router-dom";

type InformationPageProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
  showSearch?: boolean;
};

export default function InformationPage({
  title,
  description,
  actionLabel,
  actionTo,
  showSearch = false,
}: InformationPageProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchLocation = searchParams.get("location");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f8f5] px-4 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-white bg-white p-8 shadow-[0_24px_80px_-30px_rgba(24,70,58,0.25)] sm:p-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-bold text-slate-800"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f4f1] text-[#29966f]">
            ls
          </span>
          Little Steps
        </Link>

        <h1 className="mt-10 font-heading text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>

        {showSearch && searchLocation && (
          <p className="mt-4 rounded-xl bg-[#e6f4f1] px-4 py-3 text-sm text-[#277e62]">
            Search location: <strong>{searchLocation}</strong>
          </p>
        )}

        {showSearch && !searchLocation && (
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Enter a location on the home page to start your search.
          </p>
        )}

        <Link
          to={actionTo}
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-teal-800 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-900"
        >
          {actionLabel}
        </Link>
      </section>
    </main>
  );
}
