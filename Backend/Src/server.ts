import app from "./app.js";
import DatabaseConnection from "./config/database.js";
import { RegistrationEmailServiceImpl } from "./modules/parents/infrastructure/Services/registration-email.service.js";
import { ProviderSubscriptionExpiryReminderService } from "./modules/subscriptions/application/services/provider-subscription-expiry-reminder.service.js";

const port = Number(process.env.PORT ?? 3000);



const startServer = async (): Promise<void> => {
  await DatabaseConnection.connect();
  new ProviderSubscriptionExpiryReminderService(
    new RegistrationEmailServiceImpl(),
  ).start();

  app.instance.listen(port, () => {
    console.info(`Server is running on http://localhost:${port}`);
  });
};

startServer().catch((error: unknown) => {
  console.error("Failed to start server", error);
  process.exitCode = 1;
});
