import { Clock3, HeartHandshake } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { FormField, StepHeading } from "./OwnerAccountStep";
import type { ProviderRegistrationValues } from "./registrationTypes";
import { registrationInputClass } from "./registrationTypes";

const ageOptions = ["Infants (0–1)", "Toddlers (1–3)", "Preschool (3–5)", "School age (5+)"];
const careOptions = ["Daily care", "Monthly care"];

export default function ServicesStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProviderRegistrationValues>();

  return (
    <section aria-labelledby="step-heading">
      <StepHeading
        icon={<HeartHandshake size={20} />}
        eyebrow="03 / Add services"
        title="What kind of care do you offer?"
        description="Select the age groups and care options that fit your programme, then add your capacity, hours and pricing."
      />
      <div className="mt-7 space-y-6">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">Age groups</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ageOptions.map((age) => (
              <label
                key={age}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-teal-300 has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50"
              >
                <input
                  type="checkbox"
                  value={age}
                  className="h-4 w-4 accent-teal-700"
                  {...register("ageGroups")}
                />
                {age}
              </label>
            ))}
          </div>
          {errors.ageGroups && (
            <p role="alert" className="mt-1.5 text-xs text-rose-600">
              {errors.ageGroups.message}
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">Care options</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {careOptions.map((care) => (
              <label
                key={care}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-teal-300 has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50"
              >
                <input
                  type="checkbox"
                  value={care}
                  className="h-4 w-4 accent-teal-700"
                  {...register("careTypes")}
                />
                {care}
              </label>
            ))}
          </div>
          {errors.careTypes && (
            <p role="alert" className="mt-1.5 text-xs text-rose-600">
              {errors.careTypes.message}
            </p>
          )}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Available places" error={errors.capacity?.message}>
            <input
              type="number"
              min="1"
              placeholder="e.g. 24"
              className={registrationInputClass(!!errors.capacity)}
              {...register("capacity", {
                required: "Enter your available capacity.",
                setValueAs: (value: string) => (value === "" ? "" : Number(value)),
                validate: (value) =>
                  (typeof value === "number" && Number.isInteger(value) && value > 0) ||
                  "Enter a whole number greater than zero.",
              })}
            />
          </FormField>
          <div className="flex items-end gap-3">
            <FormField label="Opening time" error={errors.openingTime?.message}>
              <input
                type="time"
                className={registrationInputClass(!!errors.openingTime)}
                {...register("openingTime", { required: "Set an opening time." })}
              />
            </FormField>
            <FormField label="Closing time" error={errors.closingTime?.message}>
              <input
                type="time"
                className={registrationInputClass(!!errors.closingTime)}
                {...register("closingTime", { required: "Set a closing time." })}
              />
            </FormField>
          </div>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">Pricing</legend>
          <p className="mt-1 text-xs text-slate-500">Enter the rates you offer. At least one is required.</p>
          <div className="mt-2 grid gap-5 sm:grid-cols-2">
            <FormField label="Daily rate" error={errors.dailyPrice?.message}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className={registrationInputClass(!!errors.dailyPrice)}
                {...register("dailyPrice", {
                  setValueAs: (value: string) => (value === "" ? "" : Number(value)),
                  validate: (value) =>
                    value === "" || (typeof value === "number" && value >= 0) ||
                    "Enter a valid daily rate.",
                })}
              />
            </FormField>
            <FormField label="Monthly rate" error={errors.monthlyPrice?.message}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className={registrationInputClass(!!errors.monthlyPrice)}
                {...register("monthlyPrice", {
                  setValueAs: (value: string) => (value === "" ? "" : Number(value)),
                  validate: (value) =>
                    value === "" || (typeof value === "number" && value >= 0) ||
                    "Enter a valid monthly rate.",
                })}
              />
            </FormField>
          </div>
        </fieldset>
        <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
          <Clock3 size={15} className="shrink-0 text-teal-800" aria-hidden="true" />
          Add your usual daily operating hours. You can discuss flexible care options with families later.
        </p>
      </div>
    </section>
  );
}
