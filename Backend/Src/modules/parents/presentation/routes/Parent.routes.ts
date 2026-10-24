import { Router } from "express";
import { RegisterParentDetailsUseCase } from "../../application/use-cases/register-parent-details.usecase.js";
import { SendRegistrationOtpUseCase } from "../../application/use-cases/send-registration-otp.usecase.js";
import { VerifyRegistrationOtpUseCase } from "../../application/use-cases/verify-registration-otp.usecase.js";
import { LoginParentUseCase } from "../../application/use-cases/login-parent.usecase.js";
import { ParentSessionTokenService } from "../../application/services/parent-session-token.service.js";
import { RegistrationEmailServiceImpl } from "../../infrastructure/Services/registration-email.service.js";
import { RegistrationOtpStoreImpl } from "../../infrastructure/Services/registration-otp.store.impl.js";
import { ParentRegistrationRepositoryImpl } from "../../infrastructure/repositories/parent-registration.repository.impl.js";
import { ParentController } from "../controllers/parent.controller.js";
import { ParentLoginController } from "../controllers/parent-login.controller.js";
import { SendOtpController } from "../controllers/send-otp.controller.js";
import { VerifyOtpController } from "../controllers/verify-otp.controller.js";

const parentRoutes = Router();

const parentRegistrationRepository = new ParentRegistrationRepositoryImpl();

const registrationOtpStore = new RegistrationOtpStoreImpl();

const registrationEmailService = new RegistrationEmailServiceImpl();

const parentController = new ParentController(
  new RegisterParentDetailsUseCase(parentRegistrationRepository),
);

const sendOtpController = new SendOtpController(
  new SendRegistrationOtpUseCase(
    parentRegistrationRepository,
    registrationOtpStore,
    registrationEmailService,
  ),
);

const verifyOtpController = new VerifyOtpController(
  new VerifyRegistrationOtpUseCase(
    parentRegistrationRepository,
    registrationOtpStore,
  ),
);

const parentLoginController = new ParentLoginController(
  new LoginParentUseCase(parentRegistrationRepository),
  new ParentSessionTokenService(),
);

parentRoutes.post("/register", parentController.register);
parentRoutes.post("/register/send-otp", sendOtpController.sendOtp);
parentRoutes.post("/register/verify-otp", verifyOtpController.verifyOtp);
parentRoutes.post("/login", parentLoginController.login);

export default parentRoutes;
