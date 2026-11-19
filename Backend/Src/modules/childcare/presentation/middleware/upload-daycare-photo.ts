import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { extname, resolve } from "node:path";
import multer from "multer";

const photoDirectory = resolve(
  process.env.PROVIDER_PHOTOS_DIR ??
    resolve(process.cwd(), "storage", "daycare-photos"),
);
const allowedExtensions: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};
const safeExtension: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const daycarePhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      mkdirSync(photoDirectory, { recursive: true });
      callback(null, photoDirectory);
    },
    filename: (_request, file, callback) => {
      callback(null, `${randomUUID()}${safeExtension[file.mimetype] ?? ""}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_request, file, callback) => {
    const extensions = allowedExtensions[file.mimetype];
    if (!extensions?.includes(extname(file.originalname).toLowerCase())) {
      callback(new Error("INVALID_DAYCARE_PHOTO_TYPE"));
      return;
    }
    callback(null, true);
  },
});
