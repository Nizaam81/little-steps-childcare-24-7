import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";

const providerDocumentsFolder = "Little_Steps/provider-applications";

const configureCloudinary = (): void => {
  const cloudName = process.env.CLOUD_NAME;
  const apiKey = process.env.API_KEY;
  const apiSecret = process.env.API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("CLOUDINARY_CONFIGURATION_MISSING");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
};

export const uploadProviderDocument = async (
  filePath: string,
): Promise<UploadApiResponse> => {
  configureCloudinary();

  try {
    return await cloudinary.uploader.upload(filePath, {
      folder: providerDocumentsFolder,
      resource_type: "auto",
    });
  } catch (error: unknown) {
    throw new Error("CLOUDINARY_UPLOAD_FAILED", { cause: error });
  }
};

export const uploadDaycarePhoto = async (
  filePath: string,
): Promise<UploadApiResponse> => {
  configureCloudinary();
  try {
    return await cloudinary.uploader.upload(filePath, {
      folder: "Little_Steps/daycare-centres",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 1800, height: 1200, crop: "limit", quality: "auto" }],
    });
  } catch (error: unknown) {
    throw new Error("CLOUDINARY_UPLOAD_FAILED", { cause: error });
  }
};

export const deleteProviderDocument = async (
  publicId: string,
  resourceType: UploadApiResponse["resource_type"],
): Promise<void> => {
  configureCloudinary();

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("CLOUDINARY_DELETE_FAILED");
  }
};
