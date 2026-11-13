import { Router } from "express";
import { AdminSessionTokenService } from "../../application/services/admin-session-token.service.js";
import { GetProviderApplicationDocumentUseCase } from "../../application/use-cases/get-provider-application-document.usecase.js";
import { ListProviderApplicationsUseCase } from "../../application/use-cases/list-provider-applications.usecase.js";
import { LoginAdminUseCase } from "../../application/use-cases/login-admin.usecase.js";
import { ReviewProviderApplicationUseCase } from "../../application/use-cases/review-provider-application.usecase.js";
import { AdminRepositoryImpl } from "../../infrastructure/repositories/admin.repository.impl.js";
import { ProviderRegistrationRepositoryImpl } from "../../../childcare/infrastructure/repositories/provider-registration.repository.impl.js";
import { ParentRegistrationRepositoryImpl } from "../../../parents/infrastructure/repositories/parent-registration.repository.impl.js";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/require-admin.middleware.js";

const adminRoutes = Router();
const adminRepository = new AdminRepositoryImpl();
const registrationRepository = new ProviderRegistrationRepositoryImpl();
const parentRepository = new ParentRegistrationRepositoryImpl();
const adminTokens = new AdminSessionTokenService();
const controller = new AdminController(
  new LoginAdminUseCase(adminRepository),
  adminTokens,
  new ListProviderApplicationsUseCase(registrationRepository),
  new ReviewProviderApplicationUseCase(registrationRepository),
  new GetProviderApplicationDocumentUseCase(registrationRepository),
  registrationRepository,
  parentRepository,
);

adminRoutes.post("/login", controller.login);
adminRoutes.use(requireAdmin(adminTokens));
adminRoutes.post("/logout", controller.logout);
adminRoutes.get("/providers", controller.listProviderApplications);
adminRoutes.get("/centres", controller.listApprovedCentres);
adminRoutes.patch("/centres/:applicationId/status", controller.updateCentreStatus);
adminRoutes.delete("/centres/:applicationId", controller.deleteCentre);
adminRoutes.get("/parents", controller.listParents);
adminRoutes.patch("/parents/:parentId/status", controller.updateParentStatus);
adminRoutes.delete("/parents/:parentId", controller.deleteParent);
adminRoutes.patch(
  "/providers/:applicationId/review",
  controller.reviewProviderApplication,
);
adminRoutes.get(
  "/providers/:applicationId/documents",
  controller.downloadProviderDocument,
);

export default adminRoutes;