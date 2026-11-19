import api from "./api";
import { setSession, type SessionUser } from "./session";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: SessionUser;
    accessToken: string;
  };
}

export async function loginUser(data: LoginData) {
  const response = await api.post<AuthResponse>("/auth/login", data);

  setSession(response.data.data.accessToken, response.data.data.user);

  return response.data;
}

export async function registerUser(data: RegisterData) {
  const response = await api.post<AuthResponse>("/auth/register", data);

  setSession(response.data.data.accessToken, response.data.data.user);

  return response.data;
}

export { logout, restoreSession } from "./session";
