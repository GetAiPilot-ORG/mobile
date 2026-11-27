import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface PhoneAuthResponse {
  success: boolean;
  error?: string;
  user?: User | null;
  session?: Session | null;
}

const RESEND_COOLDOWN_MS = 45000;
const STORAGE_PREFIX = "@gap_otp_rate_";
const memoryCooldownMap = new Map<string, number>();

function getPhoneKey(phone: string): string {
  return `${STORAGE_PREFIX}${phone.replace(/\D/g, "")}`;
}

/**
 * Checks client-side resend cooldown synchronously from in-memory cache
 */
export function getRemainingCooldown(phone: string): number {
  const key = getPhoneKey(phone);
  const lastSent = memoryCooldownMap.get(key);
  if (!lastSent) return 0;
  const elapsed = Date.now() - lastSent;
  return Math.max(0, Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000));
}

/**
 * Checks client-side resend cooldown from AsyncStorage (persists across app restarts)
 */
export async function getRemainingCooldownAsync(phone: string): Promise<number> {
  const memRemaining = getRemainingCooldown(phone);
  if (memRemaining > 0) return memRemaining;

  try {
    const key = getPhoneKey(phone);
    const lastSentStr = await AsyncStorage.getItem(key);
    if (!lastSentStr) return 0;
    const lastSent = parseInt(lastSentStr, 10);
    if (Number.isNaN(lastSent)) return 0;
    memoryCooldownMap.set(key, lastSent);
    const elapsed = Date.now() - lastSent;
    return Math.max(0, Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000));
  } catch {
    return 0;
  }
}

/**
 * Sets client-side cooldown timestamp
 */
export function recordOtpSent(phone: string): void {
  const key = getPhoneKey(phone);
  const now = Date.now();
  memoryCooldownMap.set(key, now);
  AsyncStorage.setItem(key, String(now)).catch(() => {});
}

/**
 * Translates provider errors into secure, user-friendly messages
 */
export function mapAuthError(err: any): string {
  if (!err) return "An unexpected error occurred. Please try again.";

  const message: string = (err.message || err.error_description || "").toLowerCase();
  const status: number = err.status || 0;

  if (
    message.includes("invalid phone") ||
    message.includes("invalid number") ||
    message.includes("malformed")
  ) {
    return "Please enter a valid phone number.";
  }

  if (
    message.includes("token has expired") ||
    message.includes("otp expired") ||
    message.includes("expired")
  ) {
    return "This verification code has expired. Request a new code.";
  }

  if (
    message.includes("invalid token") ||
    message.includes("token is invalid") ||
    message.includes("incorrect otp") ||
    message.includes("wrong otp") ||
    message.includes("invalid otp")
  ) {
    return "Invalid verification code. Please try again.";
  }

  if (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("over_sms_send_rate_limit") ||
    message.includes("throttle")
  ) {
    return "Too many attempts. Please try again later.";
  }

  if (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("connection") ||
    message.includes("timeout")
  ) {
    return "Connection failed. Please check your internet connection and try again.";
  }

  if (
    message.includes("user already registered") ||
    message.includes("phone number already exists") ||
    message.includes("already associated")
  ) {
    return "This phone number is already associated with another account.";
  }

  if (
    message.includes("signups not allowed for otp") ||
    message.includes("otp_disabled") ||
    message.includes("signup not allowed") ||
    message.includes("signups not allowed")
  ) {
    return "Phone authentication is temporarily unavailable. Please try again or use Email.";
  }

  if (
    message.includes("status 4 is not active") ||
    message.includes("20003") ||
    message.includes("sms_send_failed") ||
    message.includes("twilio")
  ) {
    return "WhatsApp OTP service is temporarily unavailable. Please sign in with Email while WhatsApp credentials are being connected.";
  }

  if (
    message.includes("sms provider") ||
    message.includes("phone provider") ||
    message.includes("unsupported channel") ||
    message.includes("channel not supported")
  ) {
    return "WhatsApp OTP service is temporarily unavailable. Please try again in a few moments or use email sign-in.";
  }

  return "We couldn't send the verification code to your WhatsApp. Please try again.";
}

/**
 * Checks whether a phone number is already associated with an existing account
 */
export async function checkPhoneExists(
  normalizedPhone: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("check_phone_exists", {
      phone_to_check: normalizedPhone,
    });
    if (error) {
      console.warn("[PhoneAuth] check_phone_exists RPC error:", error.message);
      return { exists: false, error: error.message };
    }
    return { exists: Boolean(data) };
  } catch (err: any) {
    console.warn("[PhoneAuth] check_phone_exists exception:", err?.message || err);
    return { exists: false, error: err?.message };
  }
}

/**
 * Sends a WhatsApp OTP using Supabase Auth native phone OTP API.
 * Enforces account existence checks when mode is 'signup' or 'login' so OTP is never
 * dispatched for invalid/duplicate accounts.
 */
export async function sendWhatsAppOtp(
  normalizedPhone: string,
  options?: { mode?: "login" | "signup" }
): Promise<PhoneAuthResponse> {
  try {
    const cooldown = await getRemainingCooldownAsync(normalizedPhone);
    if (cooldown > 0) {
      return {
        success: false,
        error: `Please wait ${cooldown} seconds before requesting a new code.`,
      };
    }

    if (options?.mode) {
      const { exists, error: checkErr } = await checkPhoneExists(normalizedPhone);
      if (checkErr) {
        return {
          success: false,
          error: "Unable to verify phone number right now. Please try again.",
        };
      }
      if (options.mode === "signup" && exists) {
        return {
          success: false,
          error: "This phone number is already associated with an account. Please log in instead.",
        };
      }
      if (options.mode === "login" && !exists) {
        return {
          success: false,
          error: "No account is associated with this phone number. Please create a new account.",
        };
      }
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        channel: "whatsapp",
        shouldCreateUser: options?.mode !== "login",
      },
    });

    if (error) {
      console.warn("[PhoneAuth] Supabase signInWithOtp failed:", error.message || error);
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    recordOtpSent(normalizedPhone);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}

/**
 * Verifies the 6-digit WhatsApp OTP with Supabase Auth
 */
export async function verifyWhatsAppOtp(
  normalizedPhone: string,
  token: string
): Promise<PhoneAuthResponse> {
  try {
    const cleanToken = token.trim().replace(/\D/g, "");
    if (cleanToken.length !== 6) {
      return {
        success: false,
        error: "Please enter the full 6-digit verification code.",
      };
    }

    // Official Supabase SDK specification: MobileOtpType is 'sms' even when delivery channel is WhatsApp
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: cleanToken,
      type: "sms",
    });

    if (error) {
      console.warn("[PhoneAuth] Supabase verifyOtp failed:", error.message || error);
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}
