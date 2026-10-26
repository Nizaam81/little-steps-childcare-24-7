export interface AdminRepository {
  findByEmail(email: string): Promise<{
    id: string;
    email: string;
    passwordHash: string;
    isAdmin: boolean;
  } | null>;
}
