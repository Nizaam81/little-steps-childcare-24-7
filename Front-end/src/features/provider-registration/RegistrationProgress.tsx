import { Check } from "lucide-react";
import type { RegistrationStep } from "./registrationTypes";

const stepNames = [
  "Owner account",
  "Centre details",
  "Services",
  "Documents",
  "Review",
  "Verification",
];

type RegistrationProgressProps = {
  currentStep: RegistrationStep;
};

export default function RegistrationProgress({
  currentStep,
}: RegistrationProgressProps) {
  const progress = ((currentStep - 1) / (stepNames.length - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">
          Step {String(currentStep).padStart(2, "0")} of 06
        </p>
        <p className="truncate text-sm font-semibold text-slate-600">
          {stepNames[currentStep - 1]}
        </p>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Provider registration progress"
        aria-valuemin={1}
        aria-valuemax={6}
        aria-valuenow={currentStep}
      >
        <div
          className="h-full rounded-full bg-teal-700 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="mt-5 grid grid-cols-6 gap-2" aria-label="Registration steps">
        {stepNames.map((name, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          return (
            <li
              key={name}
              className={`flex min-w-0 flex-col items-center gap-2 text-center text-[10px] font-semibold sm:text-xs ${
                isCurrent ? "text-teal-800" : "text-slate-400"
              }`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                  isComplete
                    ? "border-teal-700 bg-teal-700 text-white"
                    : isCurrent
                      ? "border-teal-700 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white"
                }`}
              >
                {isComplete ? <Check size={14} aria-hidden="true" /> : stepNumber}
              </span>
              <span className="hidden truncate sm:block">{name}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
