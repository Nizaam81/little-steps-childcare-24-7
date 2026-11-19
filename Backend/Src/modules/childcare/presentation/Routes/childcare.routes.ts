import { Router } from "express";
import { RegistrationEmailServiceImpl } from "../../../parents/infrastructure/Services/registration-email.service.js";
import { authTokenService } from "../../../../shared/services/auth-token.service.js";
import { LoginProviderUseCase } from "../../application/use-cases/login-provider.usecase.js";
import { SendProviderEmailOtpUseCase } from "../../application/use-cases/send-provider-email-otp.usecase.js";
import { SubmitProviderRegistrationUseCase } from "../../application/use-cases/submit-provider-registration.usecase.js";
import { VerifyProviderEmailOtpUseCase } from "../../application/use-cases/verify-provider-email-otp.usecase.js";
import { ProviderRegistrationRepositoryImpl } from "../../infrastructure/repositories/provider-registration.repository.impl.js";
import { ProviderEmailVerificationStoreImpl } from "../../infrastructure/services/provider-email-verification.store.impl.js";
import { ProviderRegistrationController } from "../controllers/provider-registration.controller.js";
import { ProviderLoginController } from "../controllers/provider-login.controller.js";
import { providerDocumentUpload } from "../middleware/upload-provider-documents.js";
import { requireRole } from "../../../../shared/middlewares/require-auth.middleware.js";
import { providerWorkspaceRoutes } from "./provider-workspace.routes.js";
import { providerSubscriptionRoutes } from "../../../subscriptions/presentation/Routes/provider-subscription.routes.js";

const childcareRoutes = Router();
const verificationStore = new ProviderEmailVerificationStoreImpl();
const emailService = new RegistrationEmailServiceImpl();
const registrationRepository = new ProviderRegistrationRepositoryImpl();
const controller = new ProviderRegistrationController(
  new SendProviderEmailOtpUseCase(verificationStore, emailService),
  new VerifyProviderEmailOtpUseCase(verificationStore),
  new SubmitProviderRegistrationUseCase(
    registrationRepository,
    verificationStore,
  ),
);
const loginController = new ProviderLoginController(
  new LoginProviderUseCase(registrationRepository),
  authTokenService,
);

childcareRoutes.post("/login", loginController.login);
childcareRoutes.post("/logout", requireRole("provider"), loginController.logout);
childcareRoutes.post(
  "/registrations/email-verification/send",
  controller.sendOtp,
);
childcareRoutes.post(
  "/registrations/email-verification/verify",
  controller.verifyOtp,
);
childcareRoutes.post(
  "/registrations",
  (request, response, next) => {
    providerDocumentUpload.fields([
      { name: "tradeLicense", maxCount: 1 },
      { name: "supportingDocuments", maxCount: 10 },
    ])(request, response, (error: unknown) => {
      if (error) {
        controller.handleUploadError(error, request, response);
        return;
      }

      next();
    });
  },
  controller.submit,
);
childcareRoutes.use(
  "/workspace",
  requireRole("provider"),
  providerWorkspaceRoutes,
);
childcareRoutes.use(
  "/subscription",
  requireRole("provider"),
  providerSubscriptionRoutes,
);

export default childcareRoutes;