import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import type { Daycare } from "../dashboardTypes";

type BookingDialogProps = {
  center: Daycare;
  onClose: () => void;
  onConfirm: (childName: string, bookingStartDate: string, bookingEndDate: string) => void;
};

const BookingDialog = ({ center, onClose, onConfirm }: BookingDialogProps) => {
  const today = new Date().toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ childName: string; bookingStartDate: string; bookingEndDate: string }>({
    mode: "onTouched",
    defaultValues: { childName: "", bookingStartDate: today, bookingEndDate: today },
  });
  const startDate = watch("bookingStartDate");

  return (
  <div
    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#26384b]/45 p-4 sm:items-center"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <div
      className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-[#e3ece7] bg-white p-6 text-[#26384b] shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-dialog-title"
    >
      <form
        onSubmit={handleSubmit(({ childName, bookingStartDate, bookingEndDate }) =>
          onConfirm(
            childName.trim(),
            new Date(`${bookingStartDate}T00:00:00`).toISOString(),
            new Date(`${bookingEndDate}T23:59:59`).toISOString(),
          )
        )}
        noValidate
      >
      <div className="mb-4 flex items-center justify-between">
        <h2 id="booking-dialog-title" className="text-xl font-bold">Start your booking</h2>
        <button onClick={onClose} className="rounded-lg p-2 text-[#687a88] hover:bg-[#f1f7f4]" aria-label="Close booking dialog"><X /></button>
      </div>
      <img src={center.image} alt={center.name} className="mb-4 h-36 w-full rounded-xl object-cover" />
      <h3 className="font-bold">{center.name}</h3>
      <p className="mt-1 text-sm text-[#778691]">{center.location}</p>
      {center.price > 0 && (
        <p className="mt-4 text-sm">
          Monthly plans start from <strong>₹{center.price.toLocaleString("en-IN")}</strong>.
        </p>
      )}
      {center.pricePlans &&
        (center.pricePlans.hourly > 0 || center.pricePlans.daily > 0) && (
          <p className="mt-1 text-xs text-[#778691]">
            {center.pricePlans.hourly > 0 && `Hourly ₹${center.pricePlans.hourly.toLocaleString("en-IN")}`}
            {center.pricePlans.hourly > 0 && center.pricePlans.daily > 0 && " · "}
            {center.pricePlans.daily > 0 && `Daily ₹${center.pricePlans.daily.toLocaleString("en-IN")}`}
          </p>
        )}
      <label className="mt-4 block text-sm font-semibold text-[#526777]" htmlFor="booking-child-name">
        Child&apos;s name
        <input
          id="booking-child-name"
          placeholder="Enter your child’s name"
          aria-invalid={Boolean(errors.childName)}
          aria-describedby={errors.childName ? "booking-child-name-error" : undefined}
          {...register("childName", {
            required: "Enter your child's name.",
            minLength: { value: 2, message: "Name must contain at least 2 characters." },
            maxLength: { value: 80, message: "Name must be 80 characters or fewer." },
            validate: (value) => value.trim().length >= 2 || "Enter a valid name.",
          })}
          className="mt-2 h-11 w-full rounded-xl border border-[#d8e6e0] px-3 text-sm font-normal outline-none focus:border-[#278a70] focus:ring-4 focus:ring-[#278a70]/10"
        />
      </label>
      {errors.childName && <p id="booking-child-name-error" role="alert" className="mt-1 text-xs text-rose-700">{errors.childName.message}</p>}
      <p className="mt-3 rounded-lg border border-[#f1e4c9] bg-[#fff9ed] p-3 text-xs leading-5 text-[#785c31]">
          Your request will be sent securely to the daycare for confirmation.
        </p>
        <label className="mt-4 block text-sm font-semibold text-[#526777]" htmlFor="booking-start-date">
          Booking start date
          <input
            id="booking-start-date"
            type="date"
            min={today}
            aria-invalid={Boolean(errors.bookingStartDate)}
            aria-describedby={errors.bookingStartDate ? "booking-start-error" : undefined}
            {...register("bookingStartDate", { required: "Choose a booking start date." })}
            className="mt-2 h-11 w-full rounded-xl border border-[#d8e6e0] px-3 text-sm font-normal outline-none focus:border-[#278a70] focus:ring-4 focus:ring-[#278a70]/10"
          />
        </label>
        {errors.bookingStartDate && <p id="booking-start-error" role="alert" className="mt-1 text-xs text-rose-700">{errors.bookingStartDate.message}</p>}
        <label className="mt-4 block text-sm font-semibold text-[#526777]" htmlFor="booking-end-date">
          Booking end date
          <input
            id="booking-end-date"
            type="date"
            min={startDate || today}
            aria-invalid={Boolean(errors.bookingEndDate)}
            aria-describedby={errors.bookingEndDate ? "booking-end-error" : undefined}
            {...register("bookingEndDate", {
              required: "Choose a booking end date.",
              validate: (value) => value >= startDate || "The end date must be on or after the start date.",
            })}
            className="mt-2 h-11 w-full rounded-xl border border-[#d8e6e0] px-3 text-sm font-normal outline-none focus:border-[#278a70] focus:ring-4 focus:ring-[#278a70]/10"
          />
        </label>
        {errors.bookingEndDate && <p id="booking-end-error" role="alert" className="mt-1 text-xs text-rose-700">{errors.bookingEndDate.message}</p>}
      <button
        type="submit"
        className="mt-6 w-full rounded-xl bg-[#278a70] py-3 font-semibold text-white shadow-sm transition hover:bg-[#1f755f]"
      >
        Send booking request
      </button>
      </form>
    </div>
  </div>
  );
};

export default BookingDialog;
