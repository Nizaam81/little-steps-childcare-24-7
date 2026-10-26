import type { AdminRepository } from "../../Domain/repositories/admin.repository.js";
import { AdminModel } from "../persistence/admin.model.js";

export class AdminRepositoryImpl implements AdminRepository {
  async findByEmail(email: string): Promise<{
    id: string;
    email: string;
    passwordHash: string;
    isAdmin: boolean;
  } | null> {
    const admin = await AdminModel.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash _id email isAdmin");

    if (!admin) {
      return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      passwordHash: admin.passwordHash,
      isAdmin: admin.isAdmin,
    };
  }
}
