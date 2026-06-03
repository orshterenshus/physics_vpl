import { randomBytes } from "crypto";

export function generateLoginCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}
