import { useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  X,
} from "lucide-react";

type Transaction = {
  id: string;
  description: string;
  date: string;
  amount: number;
  status: "Paid" | "Refund requested";
};

const initialTransactions: Transaction[] = [
  {
    id: "demo-payment-01",
    description: "Monthly Care · Little Stars Daycare",
    date: "Nov 01, 2026",
    amount: 3500,
    status: "Paid",
  },
  {
    id: "demo-payment-02",
    description: "Registration fee · Little Stars Daycare",
    date: "Oct 28, 2026",
    amount: 500,
    status: "Paid",
  },
];

const PaymentsAndRefunds = () => {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [refundTransaction, setRefundTransaction] = useState<Transaction | null>(null);

  const confirmRefundRequest = () => {
    if (!refundTransaction) return;
    setTransactions((current) => current.map((transaction) =>
      transaction.id === refundTransaction.id
        ? { ...transaction, status: "Refund requested" }
        : transaction,
    ));
    setRefundTransaction(null);
    toast.success("Demo refund request saved locally. No payment provider was contacted.");
  };

  return (
    <section id="payments" className="space-y-5" aria-labelledby="payments-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[#278a70]">PAYMENTS</p>
          <h2 id="payments-title" className="mt-1 font-sans text-2xl font-extrabold tracking-tight text-[#26384b]">
            Payments & refunds
          </h2>
          <p className="mt-2 text-sm text-[#687a88]">Review sample transactions and preview a refund request.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#dcece5] bg-white px-3 py-1.5 text-xs font-semibold text-[#526777]">
          <CreditCard size={14} className="text-[#278a70]" /> Demo payment history
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e3ece7] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-[#eaf1ed] bg-[#fbfdfc] px-4 py-4 sm:px-5">
          <div>
            <h3 className="font-bold text-[#26384b]">Recent transactions</h3>
            <p className="mt-1 text-xs text-[#778691]">Payment details are sample data; no card information is stored.</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-[#e5f4ee] px-2.5 py-1 text-xs font-semibold text-[#237960] sm:inline-flex">
            <CheckCircle2 size={13} /> Secure checkout planned
          </span>
        </div>

        <div className="divide-y divide-[#eaf1ed]">
          {transactions.map((transaction) => {
            const refundPending = transaction.status === "Refund requested";
            return (
              <article key={transaction.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f4ee] text-[#278a70]">
                  {refundPending ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-[#26384b]">{transaction.description}</h4>
                  <p className="mt-1 text-xs text-[#778691]">{transaction.date}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-bold text-[#26384b]">₹{transaction.amount.toLocaleString("en-IN")}</p>
                    <p className={`mt-0.5 text-xs font-medium ${refundPending ? "text-[#8a651e]" : "text-[#237960]"}`}>
                      {transaction.status}
                    </p>
                  </div>
                  {!refundPending && (
                    <button
                      type="button"
                      onClick={() => setRefundTransaction(transaction)}
                      className="rounded-lg border border-[#d8e6e0] px-3 py-2 text-xs font-semibold text-[#526777] transition hover:border-[#278a70] hover:bg-[#f6faf8] hover:text-[#237960]"
                    >
                      Request refund
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <p className="border-t border-[#eaf1ed] px-4 py-3 text-xs leading-5 text-[#778691] sm:px-5">
          Demo only: refund requests update this page temporarily. No real charge, refund, or payment-provider action occurs.
        </p>
      </div>

      {refundTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#26384b]/45 p-4">
          <section
            className="w-full max-w-md rounded-3xl border border-[#e3ece7] bg-white p-6 text-[#26384b] shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-dialog-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="refund-dialog-title" className="font-sans text-xl font-extrabold">Preview refund request</h3>
                <p className="mt-2 text-sm leading-6 text-[#687a88]">
                  This is a UI demo. It will not contact a payment provider or return money.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefundTransaction(null)}
                className="rounded-lg p-2 text-[#687a88] transition hover:bg-[#f1f7f4]"
                aria-label="Close refund dialog"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-[#e3ece7] bg-[#fbfdfc] p-4">
              <p className="text-sm font-semibold text-[#26384b]">{refundTransaction.description}</p>
              <p className="mt-1 text-xs text-[#778691]">{refundTransaction.date}</p>
              <p className="mt-3 text-lg font-extrabold text-[#237960]">
                ₹{refundTransaction.amount.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRefundTransaction(null)}
                className="rounded-xl border border-[#d8e6e0] px-4 py-3 text-sm font-semibold text-[#526777] hover:bg-[#f6f9f7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRefundRequest}
                className="rounded-xl bg-[#278a70] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f755f]"
              >
                Save demo request
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

export default PaymentsAndRefunds;
