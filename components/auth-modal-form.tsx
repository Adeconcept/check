"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getPasswordRuleState,
  isValidEmail,
  isValidLoginIdentity,
  isValidPassword,
  normalizeEmail,
  normalizeUsername,
  validateUsername
} from "@/lib/auth-validation";

type AuthVariant = "signup-empty" | "signup-filled" | "login-empty" | "login-filled";

type UsernameAvailability =
  | { state: "idle"; message: string | null }
  | { state: "checking"; message: string }
  | { state: "available"; message: string }
  | { state: "unavailable"; message: string };

export function AuthModalForm({
  closeHref,
  variant
}: {
  closeHref?: string;
  variant: AuthVariant;
}) {
  const router = useRouter();
  const isSignup = variant === "signup-empty" || variant === "signup-filled";
  const filled = variant === "signup-filled" || variant === "login-filled";
  const title = isSignup ? "Get started" : "Log in";
  const submitLabel = isSignup ? "Create account" : "Login";
  const closeLabel = isSignup ? "Close modal" : "Close modal";
  const switchHref = isSignup
    ? closeHref === "/" ? "/?modal=log-in" : "/screens/login-empty"
    : closeHref === "/" ? "/?modal=get-started" : "/screens/signup-empty";
  const switchPrefix = isSignup ? "Have an account?" : "New to checky?";
  const switchAction = isSignup ? "Log in" : "Create account";

  const [email, setEmail] = useState(filled ? "johndoe@gmail.com" : "");
  const [username, setUsername] = useState(filled && isSignup ? "johndoe" : "");
  const [password, setPassword] = useState(filled ? "Password@123" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loginTouched, setLoginTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailability>({ state: "idle", message: null });

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
  const passwordRules = getPasswordRuleState(password);
  const usernameValidation = validateUsername(normalizedUsername);
  const emailValid = isValidEmail(normalizedEmail);
  const passwordValid = isValidPassword(password);
  const loginIdentityValid = isValidLoginIdentity(email);

  useEffect(() => {
    if (!isSignup) {
      return;
    }

    if (!normalizedUsername) {
      setUsernameAvailability({ state: "idle", message: null });
      return;
    }

    if (!usernameValidation.ok) {
      setUsernameAvailability({
        state: "unavailable",
        message: usernameValidation.reason ?? "Username is not valid."
      });
      return;
    }

    let isActive = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setUsernameAvailability({
        state: "checking",
        message: "Checking username availability..."
      });

      try {
        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(normalizedUsername)}`, {
          signal: controller.signal
        });
        const payload = (await response.json()) as { available?: boolean; reason?: string };

        if (!isActive) {
          return;
        }

        if (payload.available) {
          setUsernameAvailability({
            state: "available",
            message: "Username is available."
          });
          return;
        }

        setUsernameAvailability({
          state: "unavailable",
          message: payload.reason ?? "That username is not available."
        });
      } catch {
        if (!isActive) {
          return;
        }

        setUsernameAvailability({
          state: "unavailable",
          message: "Could not verify username right now."
        });
      }
    }, 350);

    return () => {
      isActive = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isSignup, normalizedUsername, usernameValidation.ok, usernameValidation.reason]);

  const emailError = useMemo(() => {
    if (isSignup) {
      return emailTouched && normalizedEmail && !emailValid ? "Enter a valid email address." : null;
    }

    return loginTouched && email.trim() && !loginIdentityValid
      ? "Enter a valid email address or username."
      : null;
  }, [emailTouched, emailValid, isSignup, loginIdentityValid, loginTouched, normalizedEmail, email]);

  const usernameMessage = useMemo(() => {
    if (!isSignup) {
      return null;
    }

    if (!normalizedUsername) {
      return usernameTouched ? "Username is optional." : null;
    }

    return usernameAvailability.message;
  }, [isSignup, normalizedUsername, usernameAvailability.message, usernameTouched]);

  const passwordError = passwordTouched && password && !passwordValid ? "Password must pass all requirements below." : null;

  const canSubmit = isSignup
    ? emailValid &&
      passwordValid &&
      (!normalizedUsername ||
        usernameAvailability.state === "available")
    : loginIdentityValid && passwordValid;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setEmailTouched(true);
    setUsernameTouched(true);
    setPasswordTouched(true);
    setLoginTouched(true);

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    const targetHref = isSignup
      ? `/screens/verify-email?email=${encodeURIComponent(normalizedEmail)}`
      : "/";
    router.push(targetHref);
  }

  return (
    <div className={`modal${isSignup ? " signup-modal" : ""}`}>
      <form className="modal-body" noValidate onSubmit={handleSubmit}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 className="modal-title">{title}</h2>
          </div>
          {closeHref ? (
            <Link className="icon-button close-icon" href={closeHref} aria-label={closeLabel}>
              <CloseGlyph />
            </Link>
          ) : (
            <button className="icon-button close-icon" type="button" aria-label={closeLabel}>
              <CloseGlyph />
            </button>
          )}
        </div>

        {isSignup ? (
          <div className="info-banner">
            <span className="info-dot" aria-hidden="true">
              <InfoGlyph />
            </span>
            <span>A wallet address on Solana will be created for you.</span>
          </div>
        ) : null}

        <div className="form-stack">
          {isSignup ? (
            <>
              <TextField
                autoComplete="email"
                error={emailError}
                inputMode="email"
                label="Email"
                onBlur={() => setEmailTouched(true)}
                onChange={(value) => setEmail(value.replace(/\s+/g, ""))}
                placeholder="e.g johndoe@gmail.com"
                type="email"
                value={email}
              />
              <TextField
                autoComplete="username"
                hintTone={
                  usernameAvailability.state === "available"
                    ? "success"
                    : usernameAvailability.state === "checking"
                      ? "muted"
                      : usernameAvailability.state === "unavailable"
                        ? "error"
                        : "muted"
                }
                hint={usernameMessage}
                label="Username (optional)"
                onBlur={() => setUsernameTouched(true)}
                onChange={setUsername}
                placeholder="e.g johndoe"
                type="text"
                value={username}
              />
            </>
          ) : (
            <TextField
              autoComplete="username"
              error={emailError}
              label="Email/Username"
              onBlur={() => setLoginTouched(true)}
              onChange={setEmail}
              placeholder="e.g johndoe"
              type="text"
              value={email}
            />
          )}

          <TextField
            autoComplete={isSignup ? "new-password" : "current-password"}
            error={passwordError}
            label="Password"
            onBlur={() => setPasswordTouched(true)}
            onChange={setPassword}
            password
            placeholder=""
            type={showPassword ? "text" : "password"}
            value={password}
            onTogglePassword={() => setShowPassword((current) => !current)}
          />

          {isSignup ? (
            <div className="password-rules">
              <div className="rule-list">
                <div className="rule-title">
                  <span className="info-dot" aria-hidden="true">
                    <InfoGlyph />
                  </span>
                  <span>Your password:</span>
                </div>
                <RuleItem complete={passwordRules.hasMinimumLength} text="Must be at least 8-digits long" />
                <RuleItem complete={passwordRules.hasUppercase} text="Must include an Upper Case Character" />
                <RuleItem complete={passwordRules.hasSpecialCharacter} text="Mut Special Character" />
              </div>
            </div>
          ) : null}
        </div>

        <button
          className={`gradient-button large${canSubmit ? "" : " dimmed"}`}
          disabled={!canSubmit || isSubmitting}
          type="submit"
        >
          {submitLabel}
        </button>

        <div className="divider-row">
          <span>or</span>
        </div>

        <div className="social-row">
          <div className="auth-option">
            <span className="auth-option-chip" aria-hidden="true">
              <GoogleGlyph />
            </span>
            <span className="auth-option-label">Google</span>
          </div>
          <span className="auth-option-separator" aria-hidden="true" />
          <div className="auth-option">
            <span className="auth-option-chip" aria-hidden="true">
              <WalletGlyph />
            </span>
            <span className="auth-option-label">Connect wallet</span>
          </div>
        </div>

        <div className="auth-switch">
          <span>{switchPrefix} </span>
          <Link href={switchHref}>{switchAction}</Link>
        </div>
      </form>
    </div>
  );
}

function RuleItem({ complete, text }: { complete: boolean; text: string }) {
  return (
    <div className="rule-item">
      <span className={`rule-check${complete ? " done" : ""}`} aria-hidden="true">
        <CheckCircleGlyph />
      </span>
      <span>{text}</span>
    </div>
  );
}

function TextField({
  autoComplete,
  error,
  hint,
  hintTone = "muted",
  inputMode,
  label,
  onBlur,
  onChange,
  onTogglePassword,
  password = false,
  placeholder,
  type,
  value
}: {
  autoComplete?: string;
  error?: string | null;
  hint?: string | null;
  hintTone?: "error" | "muted" | "success";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onTogglePassword?: () => void;
  password?: boolean;
  placeholder: string;
  type: "email" | "password" | "text";
  value: string;
}) {
  const helper = error ?? hint;
  const helperTone = error ? "error" : hintTone;

  return (
    <div className="field">
      <label>{label}</label>
      <div className={`text-input${error ? " field-error" : ""}`}>
        <input
          aria-label={label}
          autoCapitalize="none"
          autoComplete={autoComplete}
          autoCorrect="off"
          inputMode={inputMode}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          type={type}
          value={value}
        />
        {password ? (
          <button className="eye-icon" onClick={onTogglePassword} type="button" aria-label="Toggle password visibility">
            <EyeOpenGlyph />
          </button>
        ) : null}
      </div>
      {helper ? <div className={`field-hint ${helperTone}`}>{helper}</div> : null}
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function InfoGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 7.25v4.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      <circle cx="9" cy="5.25" fill="currentColor" r=".9" />
    </svg>
  );
}

function CheckCircleGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.25 8.2 7.15 10.1 10.85 6.15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

function EyeOpenGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M1.5 8c1.42-2.32 3.57-3.5 6.5-3.5S13.08 5.68 14.5 8c-1.42 2.32-3.57 3.5-6.5 3.5S2.92 10.32 1.5 8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="8" fill="currentColor" r="1.4" />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M17.85 10.23c0-.57-.05-.97-.15-1.38H10v2.77h4.53c-.09.69-.58 1.74-1.67 2.44l-.01.09 2.43 1.84.17.02c1.53-1.37 2.4-3.39 2.4-5.78Z" fill="#4285F4" />
      <path d="M10 18c2.22 0 4.09-.72 5.45-1.96l-2.59-1.95c-.69.47-1.62.8-2.86.8-2.18 0-4.03-1.4-4.69-3.33l-.09.01-2.53 1.91-.03.08A8.24 8.24 0 0 0 10 18Z" fill="#34A853" />
      <path d="M5.31 11.56A4.84 4.84 0 0 1 5.03 10c0-.54.1-1.06.27-1.56l-.01-.1-2.56-1.94-.08.04A7.87 7.87 0 0 0 1.8 10c0 1.28.31 2.49.85 3.56l2.66-2Z" fill="#FBBC05" />
      <path d="M10 5.11c1.57 0 2.63.66 3.24 1.21l2.37-2.25C14.08 2.67 12.22 2 10 2 6.66 2 3.77 3.88 2.65 6.44l2.65 2c.67-1.93 2.51-3.33 4.7-3.33Z" fill="#EA4335" />
    </svg>
  );
}

function WalletGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M3.25 6.25A2.25 2.25 0 0 1 5.5 4h7.25a2 2 0 0 1 1.52.7l1.48 1.73v8.07A1.5 1.5 0 0 1 14.25 16H5.5a2.25 2.25 0 0 1-2.25-2.25v-7.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
      <path d="M3.4 7h12.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="13.1" cy="11.5" fill="currentColor" r="1.1" />
    </svg>
  );
}
