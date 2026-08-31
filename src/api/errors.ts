export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly payload: unknown;

  constructor(status: number, code: string, payload: unknown) {
    super(`refertrm_${status}_${code}`);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export class AuthRequiredError extends HttpError {
  constructor(payload: unknown = null) {
    super(401, "auth_required", payload);
    this.name = "AuthRequiredError";
  }
}
