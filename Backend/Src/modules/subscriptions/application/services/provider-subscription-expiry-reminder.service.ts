import { ProviderRegistrationModel } from "../../../childcare/infrastructure/persistence/provider-registration.model.js";
import type { RegistrationEmailService } from "../../../parents/application/services/registration-email.service.js";
import { ProviderSubscriptionModel } from "../../infrastructure/persistence/provider-subscription.model.js";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_IN_DAYS = 7;

export class ProviderSubscriptionExpiryReminderService {
  private isRunning = false;

  constructor(private readonly emailService: RegistrationEmailService) {}

  start(): void {
    void this.sendDueReminders();
    setInterval(() => {
      void this.sendDueReminders();
    }, DAY_IN_MILLISECONDS);
  }

  private async sendDueReminders(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();
      const latestReminderDate = new Date(
        now.getTime() + REMINDER_WINDOW_IN_DAYS * DAY_IN_MILLISECONDS,
      );
      const dueSubscriptions = await ProviderSubscriptionModel.find({
        status: { $in: ["active", "trialing"] },
        currentPeriodEnd: { $gt: now, $lte: latestReminderDate },
        $expr: { $ne: ["$expiryReminderSentFor", "$currentPeriodEnd"] },
      }).select("_id providerId currentPeriodEnd");

      for (const subscription of dueSubscriptions) {
        const expiresAt = subscription.currentPeriodEnd;
        if (!expiresAt) continue;

        try {
          const claim = await ProviderSubscriptionModel.updateOne(
            {
              _id: subscription._id,
              currentPeriodEnd: expiresAt,
              status: { $in: ["active", "trialing"] },
              $expr: { $ne: ["$expiryReminderSentFor", "$currentPeriodEnd"] },
            },
            { $set: { expiryReminderSentFor: expiresAt } },
          );
          if (claim.modifiedCount !== 1) continue;

          const provider = await ProviderRegistrationModel.findById(
            subscription.providerId,
          ).select("ownerEmail");
          if (!provider?.ownerEmail) {
            throw new Error("Provider email was not found for a due subscription reminder.");
          }

          await this.emailService.sendSubscriptionExpiryReminder(
            provider.ownerEmail,
            expiresAt,
          );
        } catch (error: unknown) {
          try {
            await ProviderSubscriptionModel.updateOne(
              { _id: subscription._id, expiryReminderSentFor: expiresAt },
              { $unset: { expiryReminderSentFor: 1 } },
            );
          } catch (releaseError: unknown) {
            console.error("Provider subscription reminder claim could not be released:", releaseError);
          }
          console.error("Provider subscription expiry reminder failed:", error);
        }
      }
    } catch (error: unknown) {
      console.error("Provider subscription expiry reminder check failed:", error);
    } finally {
      this.isRunning = false;
    }
  }
}
