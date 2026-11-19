import toast from "react-hot-toast";

export function confirmWithToast(
  message: string,
  confirmLabel = "Remove",
): Promise<boolean> {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div
          role="group"
          aria-label="Confirm action"
          className="flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-lg"
        >
          <p>{message}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  });
}
