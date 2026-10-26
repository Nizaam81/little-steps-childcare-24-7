import { Building2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { FormField, StepHeading } from "./OwnerAccountStep";
import type { ProviderRegistrationValues } from "./registrationTypes";
import {
  isValidPhoneNumber,
  registrationInputClass,
  sanitizePhoneNumber,
} from "./registrationTypes";

export default function CentreDetailsStep() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<ProviderRegistrationValues>();

  return (
    <section aria-labelledby="step-heading">
      <StepHeading
        icon={<Building2 size={20} />}
        eyebrow="02 / Register daycare centre"
        title="Tell us about your centre."
        description="Share the location and contact details families and our verification team can use."
      />
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <FormField label="Centre name" error={errors.centreName?.message}>
          <input
            placeholder="e.g. Little Acorns Daycare"
            className={registrationInputClass(!!errors.centreName)}
            {...register("centreName", {
              required: "Enter the centre name.",
              minLength: { value: 2, message: "Enter at least 2 characters." },
            })}
          />
        </FormField>
        <FormField label="District" error={errors.district?.message}>
          <input
            placeholder="Your district"
            autoComplete="address-level2"
            className={registrationInputClass(!!errors.district)}
            {...register("district", { required: "Enter the district." })}
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Street address" error={errors.address?.message}>
            <textarea
              rows={3}
              placeholder="Building, street, town or city, postal code"
              autoComplete="street-address"
              className={`${registrationInputClass(!!errors.address)} resize-y`}
              {...register("address", {
                required: "Enter the centre address.",
                validate: (value) =>
                  value.trim().length >= 5 ||
                  "Address must contain at least 5 non-space characters.",
              })}
            />
          </FormField>
        </div>
        <FormField label="Centre contact email" error={errors.centreEmail?.message}>
          <input
            type="email"
            placeholder="hello@yourcentre.com"
            className={registrationInputClass(!!errors.centreEmail)}
            {...register("centreEmail", {
              required: "Enter the centre's contact email.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address.",
              },
            })}
          />
        </FormField>
        <FormField label="Centre contact phone" error={errors.centrePhone?.message}>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            placeholder="10-digit phone number"
            className={registrationInputClass(!!errors.centrePhone)}
            {...register("centrePhone", {
              required: "Enter the centre's contact phone.",
              validate: (value) =>
                isValidPhoneNumber(value) ||
                "Enter exactly 10 digits, without spaces or symbols.",
            })}
            onChange={(event) =>
              setValue(
                "centrePhone",
                sanitizePhoneNumber(event.target.value),
                { shouldValidate: true, shouldDirty: true },
              )
            }
          />
        </FormField>
      </div>
    </section>
  );
}
