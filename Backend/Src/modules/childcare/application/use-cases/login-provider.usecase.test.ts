import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword } from "../../../../shared/utils/password.js";
import { LoginProviderUseCase } from "./login-provider.usecase.js";

test("valid provider credentials allow dashboard access before centre approval", async () => {
  const passwordHash = await hashPassword("valid-provider-password");
  const login = new LoginProviderUseCase({
    async findForLogin() {
      return {
        id: "provider-id",
        ownerName: "Provider",
        ownerEmail: "provider@example.com",
        centreName: "Little Steps",
        passwordHash,
        status: "pending_verification",
        reviewNotes: "",
        isActive: true,
      };
    },
  });

  const result = await login.execute({
    email: "PROVIDER@example.com",
    password: "valid-provider-password",
  });

  assert.equal(result.dashboardAccess, true);
  assert.equal(result.provider.status, "pending_verification");
});
