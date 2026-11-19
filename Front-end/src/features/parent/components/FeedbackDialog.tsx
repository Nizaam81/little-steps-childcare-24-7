import { useForm } from "react-hook-form";
import { X } from "lucide-react";

type FeedbackDialogProps = {
  targetName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
};

type FeedbackForm = {
  rating: number;
  comment: string;
};

export default function FeedbackDialog({
  targetName,
  onClose,
  onSubmit,
}: FeedbackDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackForm>({
    mode: "onTouched",
    defaultValues: { rating: 5, comment: "" },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#26384b]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit(({ rating, comment }) => onSubmit(rating, comment.trim()))}
        className="w-full max-w-md rounded-3xl border border-[#e3ece7] bg-white p-6 text-[#26384b] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="feedback-dialog-title" className="text-xl font-bold">Share your feedback</h2>
            <p className="mt-1 text-sm text-[#687a88]">{targetName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#687a88] hover:bg-[#f1f7f4]" aria-label="Close feedback form">
            <X size={20} />
          </button>
        </div>
        <label htmlFor="feedback-rating" className="mt-5 block text-sm font-semibold">
          Rating
          <select
            id="feedback-rating"
            {...register("rating", {
              valueAsNumber: true,
              required: "Choose a rating.",
              min: { value: 1, message: "Choose at least one star." },
              max: { value: 5, message: "Choose at most five stars." },
            })}
            className="mt-2 w-full rounded-xl border border-[#dce8e2] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]"
          >
            <option value={5}>★★★★★ — Excellent</option>
            <option value={4}>★★★★☆ — Very good</option>
            <option value={3}>★★★☆☆ — Good</option>
            <option value={2}>★★☆☆☆ — Needs improvement</option>
            <option value={1}>★☆☆☆☆ — Poor</option>
          </select>
        </label>
        {errors.rating && <p role="alert" className="mt-1 text-xs text-rose-700">{errors.rating.message}</p>}
        <label htmlFor="feedback-comment" className="mt-4 block text-sm font-semibold">
          Your feedback <span className="font-normal text-[#778691]">(optional)</span>
          <textarea
            id="feedback-comment"
            rows={4}
            {...register("comment", { maxLength: { value: 2000, message: "Keep feedback under 2,000 characters." } })}
            className="mt-2 w-full resize-y rounded-xl border border-[#dce8e2] px-4 py-3 text-sm font-normal outline-none focus:border-[#278a70] focus:ring-2 focus:ring-[#d7eee4]"
          />
        </label>
        {errors.comment && <p role="alert" className="mt-1 text-xs text-rose-700">{errors.comment.message}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 w-full rounded-xl bg-[#278a70] py-3 font-semibold text-white transition hover:bg-[#1f755f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting…" : "Submit feedback"}
        </button>
      </form>
    </div>
  );
}
