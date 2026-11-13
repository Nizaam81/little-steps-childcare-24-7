import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  History,
} from "lucide-react";
import type { Booking } from "../dashboardTypes";

type BookingsAndSubscriptionProps = {
  bookings: Booking[];
  onManageSubscription: () => void;
};

const BookingsAndSubscription = ({
  bookings,
  onManageSubscription,
}: BookingsAndSubscriptionProps) => {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <section className="grid min-w-0 grid-cols-1 gap-5">
      <div id="bookings" className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-sans text-lg font-extrabold text-[#26384b]">My Bookings</h2>
          <History size={20} className="text-[#278a70]" />
        </div>
        {bookings.length === 0 ? (
          <p className="rounded-xl bg-[#f6f9f7] p-4 text-sm text-[#687a88]">You do not have any bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, historyOpen ? bookings.length : 1).map((booking) => (
              <div key={booking.id} className="flex items-center gap-4 rounded-xl border border-[#dcece5] bg-[#f0f8f4] p-4">
                <div className="rounded-xl bg-white p-3 text-[#278a70]"><CheckCircle2 size={24} /></div>
                <div className="flex-1">
                  <h3 className="font-semibold">{booking.center.name}</h3>
                  <p className="mt-1 text-xs text-[#778691]">{booking.plan}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.status === "Active" ? "bg-[#dcefe5] text-[#237960]" : booking.status === "Declined" ? "bg-rose-50 text-rose-700" : "bg-[#fff4df] text-[#8a5a16]"}`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        )}
        <button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8e6e0] py-3 text-sm font-semibold text-[#526777] transition hover:border-[#278a70] hover:bg-[#f6f9f7] hover:text-[#278a70]"
          onClick={() => setHistoryOpen((open) => !open)}
          aria-expanded={historyOpen}
        >
          {historyOpen ? "Hide booking history" : "View booking history"} <ChevronRight size={17} />
        </button>
      </div>

      <div id="subscription" className="overflow-hidden rounded-3xl border border-[#dcece5] bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-[#eaf1ed] bg-gradient-to-r from-[#f0f8f4] to-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e3f3ed] text-[#278a70]">
              <CreditCard size={21} />
            </span>
            <div>
              <h2 className="font-sans text-lg font-extrabold text-[#26384b]">Subscription</h2>
              <p className="mt-0.5 text-xs text-[#778691]">Your care plan at a glance</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cce5d8] bg-white px-3 py-1.5 text-xs font-semibold text-[#237960]">
            <BadgeCheck size={14} /> Demo plan
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#778691]">Current plan</p>
              <h3 className="mt-1 font-sans text-2xl font-extrabold tracking-tight text-[#26384b]">Monthly Care</h3>
              <p className="mt-1 text-sm text-[#687a88]">Flexible monthly childcare plan</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#e3ece7] bg-[#fbfdfc] p-3.5 sm:min-w-48">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f4ee] text-[#278a70]">
                <CalendarDays size={19} />
              </span>
              <div>
                <p className="text-xs text-[#778691]">Next renewal</p>
                <p className="mt-0.5 text-sm font-bold text-[#26384b]">Dec 01, 2026</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[#eaf1ed] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[#778691]">
              Sample plan preview. Subscription details and billing are not connected yet.
            </p>
            <button
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#278a70] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1f755f]"
              onClick={onManageSubscription}
            >
              Manage plan <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingsAndSubscription;
