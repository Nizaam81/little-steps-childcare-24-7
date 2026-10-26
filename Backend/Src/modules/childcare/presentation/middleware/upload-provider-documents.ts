import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";

const documentDirectory = resolve(
  process.env.PROVIDER_DOCUMENTS_DIR ??
    resolve(process.cwd(), "storage", "provider-applications"),
);
const mimeExtensions: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};
const mimeSuffixes: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

export const providerDocumentUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      mkdirSync(documentDirectory, { recursive: true });
      callback(null, documentDirectory);
    },
    filename: (_request, file, callback) => {
      callback(null, `${randomUUID()}${mimeSuffixes[file.mimetype] ?? ""}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 11,
    fields: 1,
  },
  fileFilter: (_request, file, callback) => {
    const allowedExtensions = mimeExtensions[file.mimetype];
    const extension = extname(file.originalname).toLowerCase();
    if (!allowedExtensions?.includes(extension)) {
      callback(new Error("INVALID_DOCUMENT_TYPE"));
      return;
    }

    callback(null, true);
  },
});

export const uploadedProviderDocuments = (
  files: Express.Request["files"],
): Express.Multer.File[] => {
  if (Array.isArray(files)) {
    return files;
  }

  return Object.values(files ?? {}).flat();
};
