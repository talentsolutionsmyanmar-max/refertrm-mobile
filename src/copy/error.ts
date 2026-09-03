import { copy } from "./en";
import { isTimeoutError, isTransportError } from "../api/signal";

export function errorMessage(error: unknown): string {
  if (isTimeoutError(error)) return copy.errors.timeout;
  if (isTransportError(error)) return copy.errors.transport;
  return copy.errors.generic;
}
