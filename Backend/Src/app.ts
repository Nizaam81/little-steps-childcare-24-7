import "dotenv/config";
import cors from "cors";
import express, { type Express } from "express";
import adminRoutes from "./modules/Admin/presentation/Routes/admin.routes.js";
import childcareRoutes from "./modules/childcare/presentation/Routes/childcare.routes.js";
import parentRoutes from "./modules/parents/presentation/routes/Parent.routes.js";

class App {
  private readonly app: Express;

  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
  }

  private setupMiddlewares(): void {
    this.app.use(
      cors({
        origin: (origin, callback) => {
          const configuredOrigins = (
            process.env.FRONTEND_URL ?? "http://localhost:5173"
          )
            .split(",")
            .map((value) => value.trim());
          const isLocalDevelopmentOrigin =
            process.env.NODE_ENV !== "production" &&
            /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin ?? "");

          if (
            !origin ||
            configuredOrigins.includes(origin) ||
            isLocalDevelopmentOrigin
          ) {
            callback(null, true);
            return;
          }

          callback(new Error("Origin not allowed by CORS"));
        },
        credentials: true,
      }),
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    this.mountParentRoutes();
    this.mountChildcareRoutes();
    this.mountProviderRoutes();
    this.mountAdminRoutes();

   
  }

  private mountParentRoutes(): void {
    this.app.use("/api/parent", parentRoutes);
  }

  private mountChildcareRoutes(): void {
    this.app.use("/api/childcare", childcareRoutes);
  }

  private mountAdminRoutes(): void {
    this.app.use("/api/admin", adminRoutes);
  }

  private mountProviderRoutes(): void {
    this.app.use("/api/providers", childcareRoutes);
  }

  get instance(): Express {
    return this.app;
  }
}

export default new App();
