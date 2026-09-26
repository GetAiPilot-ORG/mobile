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

export const generateReferralCode = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';

  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
};

const handleSubmit = async () => {
  if (
    accountType === "business" &&
    formData.business_email &&
    !isValidEmail(formData.business_email)
  ) {
    alert(
      "Please enter a valid business email ending in .com or .yolo"
    );
    return;
  }

  console.log("handleSubmit triggered");
  console.log("accountType:", accountType);
  console.log("formData:", formData);
  console.log("cityQuery:", cityQuery);

  setLoading(true);



  try {
    // ---------------------------------------------
    // Get authenticated user
    // ---------------------------------------------
    let { data: userData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !userData?.user) {
      console.log("getUser failed, trying getSession...");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        userData = {
          user: session.user,
        };
      } else {
        console.error("Auth error or session missing");
        throw new Error(
          "Auth session missing! Please log in again."
        );
      }
    }

    if (!userData?.user) {
      throw new Error("No user found. Please log in.");
    }

    const user = userData.user;

    // ---------------------------------------------
    // Location fallback
    // ---------------------------------------------
    let finalCity = formData.city;
    let finalState = formData.state;
    let finalCountry = formData.country;

    if (!finalCity && cityQuery) {
      finalCity = cityQuery;
    }

    // ---------------------------------------------
    // Generate referral code
    // ---------------------------------------------
    const referralCode = generateReferralCode();

    console.log("Generated referral code:", referralCode);

    // ---------------------------------------------
    // Prepare profile data
    // ---------------------------------------------
    const updateData: any = {
      id: user.id,
      account_type: accountType,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),

      // User's own referral code
      referral_code: referralCode,
    };

    // ---------------------------------------------
    // Personal account
    // ---------------------------------------------
    if (accountType === "personal") {
      updateData.first_name = formData.first_name;
      updateData.last_name = formData.last_name;

      updateData.full_name = `${formData.first_name} ${formData.last_name}`.trim();

      updateData.country = finalCountry || null;
      updateData.state = finalState || null;
      updateData.city = finalCity || null;

      updateData.category = formData.category || null;
      updateData.mobile_number = formData.mobile_number || null;
    }

    // ---------------------------------------------
    // Business account
    // ---------------------------------------------
    else {
      updateData.full_name = formData.full_name || null;
      updateData.business_name = formData.business_name || null;
      updateData.business_email = formData.business_email || null;

      updateData.country = finalCountry || null;
      updateData.state = finalState || null;
      updateData.city = finalCity || null;

      updateData.team_size = formData.team_size || null;
      updateData.category = formData.category || null;
      updateData.mobile_number = formData.mobile_number || null;
    }

    console.log(
      "Updating profile with data:",
      updateData
    );
    // ---------------------------------------------
    // Create/update profile
    // ---------------------------------------------
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(updateData, {
        onConflict: "id",
      });

    if (profileError) {
      console.error(
        "Supabase profile update error:",
        profileError
      );

      throw profileError;
    }

    console.log("Profile updated successfully");

    // ---------------------------------------------
    // Activate free trial
    // ---------------------------------------------
    try {
      const { error: trialError } = await supabase.rpc(
        "activate_free_trial"
      );

      if (
        trialError &&
        !trialError.message
          ?.toLowerCase()
          .includes("already active") &&
        !trialError.message
          ?.toLowerCase()
          .includes("already used")
      ) {
        console.warn(
          "Free trial activation notice:",
          trialError
        );
      }
    } catch (trialErr) {
      console.warn(
        "Free trial RPC exception:",
        trialErr
      );
    }

    // ---------------------------------------------
    // Automatically setup CRM organization
    // ---------------------------------------------
    try {
      autoProvisionCRM(user as any, {
        full_name: updateData.full_name,
        business_name: formData.business_name,
        category: formData.category,
        account_type: accountType,
      }).catch((e) =>
        console.warn(
          "CRM auto-provision background error:",
          e
        )
      );
    } catch (crmErr) {
      console.warn(
        "CRM auto-provision notice:",
        crmErr
      );
    }

    // ---------------------------------------------
    // Refresh auth/onboarding state
    // ---------------------------------------------
    console.log(
      "Profile updated successfully, refreshing auth context..."
    );

    await checkOnboarding();

    // ---------------------------------------------
    // Redirect
    // ---------------------------------------------
    navigate("/", {
      state: {
        newUser: true,
      },
      replace: true,
    });
  } catch (error: any) {
    console.error(
      "Error completing onboarding:",
      error
    );

    alert(
      `Failed: ${error?.message || "Unknown error"}`
    );
  } finally {
    setLoading(false);
  }
};