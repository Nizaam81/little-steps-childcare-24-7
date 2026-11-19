import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  History,
} from "lucide-react";
import type { Booking } from "../dashboardTypes";
import ResponsivePagination from "../../../components/ResponsivePagination";

type BookingsHistoryProps = {
  bookings: Booking[];
};

const BookingsHistory = ({ bookings }: BookingsHistoryProps) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

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
            {bookings.slice(
              0,
              historyOpen ? bookings.length : 1,
            ).slice((page - 1) * pageSize, page * pageSize).map((booking) => (
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
        {historyOpen && (
          <ResponsivePagination
            page={page}
            pageCount={Math.ceil(bookings.length / pageSize)}
            onPageChange={setPage}
          />
        )}
        <button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8e6e0] py-3 text-sm font-semibold text-[#526777] transition hover:border-[#278a70] hover:bg-[#f6f9f7] hover:text-[#278a70]"
          onClick={() => {
            setHistoryOpen((open) => !open);
            setPage(1);
          }}
          aria-expanded={historyOpen}
        >
          {historyOpen ? "Hide booking history" : "View booking history"} <ChevronRight size={17} />
        </button>
      </div>

    </section>
  );
};

export default BookingsHistory;
