// ============================================
// API Request Types
// ============================================

export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  name: string;
  tenantName?: string; // Optional: if provided, creates/joins tenant
}
