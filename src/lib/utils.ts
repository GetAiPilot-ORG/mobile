import * as Clipboard from "expo-clipboard";
import type { Dispatch, SetStateAction } from "react";
import { Alert } from "react-native";

export function formatPlanLabel(
  label: string | null | undefined,
  planId?: string | null | undefined,
) {
  if (!label && !planId) return null;
  if (label && !label.trim().startsWith("[")) {
    return label.trim();
  }
  const rawVal = label || planId || "";
  const trimmed = rawVal.trim();

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        if (parsed.length > 1) {
          return "Custom Bundle";
        }
        const formattedList = parsed.map((item) => {
          const itemVal = String(item).toLowerCase();
          if (itemVal.includes("pro_semi") || itemVal === "platinum")
            return "Platinum";
          if (itemVal === "premium") return "Premium";
          if (itemVal === "pro") return "Pro";
          if (itemVal.includes("pro_monthly")) return "Premium Monthly";
          if (itemVal.includes("free_trial") || itemVal === "free trial")
            return "Free Trial";

          if (itemVal.includes("whatsapp_pro")) return "WA Pro";
          if (itemVal.includes("whatsapp_premium")) return "WA Premium";
          if (
            itemVal.includes("telegram_monthly") ||
            itemVal.includes("tg_lite")
          )
            return "TG Lite";
          if (
            itemVal.includes("telegram_quarterly") ||
            itemVal.includes("tg_pro")
          )
            return "TG Pro";
          if (
            itemVal.includes("telegram_half_yearly") ||
            itemVal.includes("tg_max")
          )
            return "TG Max";
          if (
            itemVal.includes("social_pilot_starter") ||
            itemVal.includes("spstarter") ||
            itemVal.includes("slite")
          )
            return "SPstarter";
          if (
            itemVal.includes("social_pilot_growth") ||
            itemVal.includes("spgrowth") ||
            itemVal.includes("sgrowth")
          )
            return "SPgrowth";
          if (itemVal.includes("crm_standard")) return "Standard CRM";
          if (itemVal.includes("crm_pro_modules")) return "CRM Pro Modules";
          if (
            itemVal.includes("telecalling_agent_basic") ||
            itemVal.includes("call_lite")
          )
            return "Call Lite";

          return String(item)
            .split(/[-_ ]+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        });
        return formattedList.join(" + ");
      }
    } catch (e) {
      // Fall through to normal formatting if JSON parsing fails
    }
  }

  const val = rawVal.toLowerCase();
  if (val.includes("pro_semi") || val === "platinum") return "Platinum";
  if (val === "premium") return "Premium";
  if (val === "pro") return "Pro";
  if (val.includes("pro_monthly")) return "Premium Monthly";
  if (val.includes("free_trial") || val === "free trial") return "Free Trial";

  if (val.includes("whatsapp_pro")) return "WA Pro";
  if (val.includes("whatsapp_premium")) return "WA Premium";
  if (val.includes("telegram_monthly") || val.includes("tg_lite"))
    return "TG Lite";
  if (val.includes("telegram_quarterly") || val.includes("tg_pro"))
    return "TG Pro";
  if (val.includes("telegram_half_yearly") || val.includes("tg_max"))
    return "TG Max";
  if (
    val.includes("social_pilot_starter") ||
    val.includes("spstarter") ||
    val.includes("slite")
  )
    return "SPstarter";
  if (
    val.includes("social_pilot_growth") ||
    val.includes("spgrowth") ||
    val.includes("sgrowth")
  )
    return "SPgrowth";
  if (val.includes("crm_standard")) return "Standard CRM";
  if (val.includes("crm_pro_modules")) return "CRM Pro Modules";
  if (val.includes("telecalling_agent_basic") || val.includes("call_lite"))
    return "Call Lite";

  return label || planId;
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; // Avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

export const handleCopyToClipboard = async (
  getQRValue: any,
  qrShareUrl: any,
  qrType: string,
  setCopied?: Dispatch<SetStateAction<boolean>>,
) => {
  try {
    const qrValue = getQRValue();
    if (!qrValue) {
      Alert.alert(
        "Validation Error",
        qrType === "wifi"
          ? "Please enter Wi-Fi name and password."
          : "Please enter text or a URL to generate a QR code.",
      );
      return;
    }

    await Clipboard.setStringAsync(qrShareUrl);

    setCopied?.(true);

    Alert.alert("Copied", "QR code shareable link copied successfully.");

    console.log("Copied QR URL:", qrShareUrl);
  } catch (error) {
    console.error("Copy failed:", error);
  }
};
