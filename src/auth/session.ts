export const ACCESS_TOKEN_KEY = "refertrm.native.access-token.v1";
const MAX_ACCESS_TOKEN_LENGTH = 16_384;

export type SecureSessionStorage = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

let secureStorage: SecureSessionStorage | null = null;

export class SessionStorageUnavailableError extends Error {
  constructor() {
    super("secure_session_storage_unavailable");
    this.name = "SessionStorageUnavailableError";
  }
}

export function configureSecureSessionStorage(storage: SecureSessionStorage): void {
  secureStorage = storage;
}

function storage(): SecureSessionStorage {
  if (!secureStorage) throw new SessionStorageUnavailableError();
  return secureStorage;
}

function validateAccessToken(value: string): string {
  if (!value || value.length > MAX_ACCESS_TOKEN_LENGTH || /\s/.test(value)) {
    throw new Error("invalid_access_token");
  }
  return value;
}

export async function getAccessToken(): Promise<string | null> {
  const token = await storage().getItemAsync(ACCESS_TOKEN_KEY);
  if (token === null) return null;
  try {
    return validateAccessToken(token);
  } catch {
    await storage().deleteItemAsync(ACCESS_TOKEN_KEY);
    return null;
  }
}

export async function saveAccessToken(accessToken: string): Promise<void> {
  await storage().setItemAsync(ACCESS_TOKEN_KEY, validateAccessToken(accessToken));
}

export async function clearAccessToken(): Promise<void> {
  await storage().deleteItemAsync(ACCESS_TOKEN_KEY);
}
