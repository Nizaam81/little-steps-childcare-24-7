
import { Router } from "express";

import { ParentController } from "../controllers/parent.controller.js";
import { RegisterParentDetailsUseCase } from "../../application/use-cases/register-parent-details.usecase.js";
import { ParentRegistrationRepositoryImpl } from "../../infrastructure/repositories/parent-registration.repository.impl.js";

const parentRoutes = Router();


const parentRegistrationRepository =
  new ParentRegistrationRepositoryImpl();


const registerParentDetailsUseCase =
  new RegisterParentDetailsUseCase(parentRegistrationRepository);


const parentController =
  new ParentController(registerParentDetailsUseCase);


parentRoutes.post("/register", parentController.register);

export default parentRoutes;
