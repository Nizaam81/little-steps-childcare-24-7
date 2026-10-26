import type { AdminRepository } from "../../Domain/repositories/admin.repository.js";
import {
  DUMMY_PASSWORD_HASH,
  verifyPassword,
} from "../../../../shared/utils/password.js";

const sessionLifetimeSeconds = 12 * 60 * 60;

export class LoginAdminUseCase {
  constructor(private readonly admins: AdminRepository) {}

  async execute(input: {
    email: string;
    password: string;
  }): Promise<{
    admin: { id: string; email: string; isAdmin: true };
    expiresInSeconds: number;
  }> {
    const email = input.email.trim().toLowerCase();
    const admin = await this.admins.findByEmail(email);
    const passwordMatches = await verifyPassword(
      input.password,
      admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!admin || !admin.isAdmin || !passwordMatches) {
      throw new Error("INVALID_ADMIN_CREDENTIALS");
    }

    return {
      admin: { id: admin.id, email: admin.email, isAdmin: true },
      expiresInSeconds: sessionLifetimeSeconds,
    };
  }
}
