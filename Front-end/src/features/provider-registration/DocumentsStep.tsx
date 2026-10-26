import { useState } from "react";
import { FileCheck2, FileUp, X } from "lucide-react";
import { StepHeading } from "./OwnerAccountStep";

type DocumentsStepProps = {
  tradeLicense: File | null;
  supportingDocuments: File[];
  error: string;
  onTradeLicenseChange: (file: File | null) => void;
  onSupportingDocumentsChange: (files: File[]) => void;
};

const maxFileSize = 10 * 1024 * 1024;
const maxSupportingDocuments = 10;
const acceptedTypes = ["application/pdf", "image/jpeg", "image/png"];

function validateFile(file: File): string | undefined {
  if (!acceptedTypes.includes(file.type)) {
    return `${file.name} must be a PDF, JPG or PNG.`;
  }
  if (file.size > maxFileSize) {
    return `${file.name} is larger than 10 MB.`;
  }
  return undefined;
}

export default function DocumentsStep({
  tradeLicense,
  supportingDocuments,
  error,
  onTradeLicenseChange,
  onSupportingDocumentsChange,
}: DocumentsStepProps) {
  const [fileError, setFileError] = useState("");

  const pickTradeLicense = (file: File | undefined) => {
    if (!file) return;
    const validationMessage = validateFile(file);
    if (validationMessage) {
      setFileError(validationMessage);
      return;
    }
    setFileError("");
    onTradeLicenseChange(file);
  };

  const pickSupportingDocuments = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    if (selected.length > maxSupportingDocuments) {
      setFileError(`You can upload up to ${maxSupportingDocuments} supporting documents.`);
      return;
    }
    const validationMessage = selected.map(validateFile).find(Boolean);
    if (validationMessage) {
      setFileError(validationMessage);
      return;
    }
    setFileError("");
    onSupportingDocumentsChange(selected);
  };

  return (
    <section aria-labelledby="step-heading">
      <StepHeading
        icon={<FileCheck2 size={20} />}
        eyebrow="04 / Upload documents"
        title="A few documents help us verify your centre."
        description="Upload a clear copy of your trade licence. You can add other applicable supporting documents too."
      />
      <div className="mt-7 space-y-5">
        <label className="block cursor-pointer rounded-2xl border border-dashed border-teal-300 bg-teal-50/50 p-5 transition hover:bg-teal-50 sm:p-6">
          <span className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-teal-800 shadow-sm">
              <FileUp size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-800">
                Trade licence <span className="text-rose-600">*</span>
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Required · PDF, JPG or PNG · Up to 10 MB
              </span>
              {tradeLicense && (
                <span className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-teal-900">
                  <FileCheck2 size={14} className="shrink-0" />
                  <span className="truncate">{tradeLicense.name}</span>
                </span>
              )}
            </span>
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="sr-only"
            onChange={(event) => pickTradeLicense(event.currentTarget.files?.[0])}
          />
        </label>

        <label className="block cursor-pointer rounded-2xl border border-slate-200 p-5 transition hover:border-teal-300 sm:p-6">
          <span className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
              <FileUp size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-800">
                Supporting documents <span className="font-normal text-slate-400">(optional)</span>
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Add up to 10 applicable certificates or supporting files.
              </span>
              {supportingDocuments.map((file) => (
                <span
                  key={`${file.name}-${file.lastModified}`}
                  className="mt-3 mr-2 inline-flex max-w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <FileCheck2 size={14} className="shrink-0 text-teal-700" />
                  <span className="max-w-[12rem] truncate">{file.name}</span>
                  <button
                    type="button"
                    className="rounded p-0.5 text-slate-500 hover:bg-slate-200"
                    aria-label={`Remove ${file.name}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onSupportingDocumentsChange(
                        supportingDocuments.filter((document) => document !== file),
                      );
                    }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </span>
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="sr-only"
            onChange={(event) => pickSupportingDocuments(event.currentTarget.files)}
          />
        </label>
        <p className="text-xs leading-5 text-slate-500">
          Files are used only to review your application. Accepted formats: PDF, JPG and PNG (10 MB maximum per file).
        </p>
        {(error || fileError) && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {fileError || error}
          </p>
        )}
      </div>
    </section>
  );
}
