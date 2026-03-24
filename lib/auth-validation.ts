export const NOT_AVAILABLE = "–";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "api",
  "checky",
  "help",
  "login",
  "news",
  "root",
  "solana",
  "support",
  "team",
  "verify"
]);

export type PasswordRuleState = {
  hasMinimumLength: boolean;
  hasUppercase: boolean;
  hasSpecialCharacter: boolean;
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizeEmailInput(value: string) {
  return value.replace(/\s+/g, "").replace(/[^\w.!#$%&'*+/=?^`{|}~@-]/g, "");
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export function normalizeUsername(value: string) {
  return value.trim();
}

export function validateUsername(value: string) {
  const username = normalizeUsername(value);

  if (!username) {
    return { ok: true, reason: null as string | null };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      reason: "Use 3-20 letters, numbers, or underscores."
    };
  }

  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return {
      ok: false,
      reason: "This username is reserved."
    };
  }

  return { ok: true, reason: null as string | null };
}

export function getPasswordRuleState(value: string): PasswordRuleState {
  return {
    hasMinimumLength: value.length >= 8,
    hasUppercase: /[A-Z]/.test(value),
    hasSpecialCharacter: /[^A-Za-z0-9]/.test(value)
  };
}

export function isValidPassword(value: string) {
  const state = getPasswordRuleState(value);
  return state.hasMinimumLength && state.hasUppercase && state.hasSpecialCharacter;
}

export function isUsernameAvailable(value: string) {
  const username = normalizeUsername(value);
  const validation = validateUsername(username);

  if (!validation.ok) {
    return { available: false, reason: validation.reason };
  }

  if (!username) {
    return { available: true, reason: null as string | null };
  }

  const blockedNames = new Set(["newmedia", "checkynews", "solreport"]);

  if (blockedNames.has(username.toLowerCase())) {
    return {
      available: false,
      reason: "That username is already in use."
    };
  }

  return { available: true, reason: null as string | null };
}

export function isValidLoginIdentity(value: string) {
  const identity = value.trim();

  if (!identity) {
    return false;
  }

  return isValidEmail(identity) || validateUsername(identity).ok;
}
