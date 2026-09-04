export function formatPlanLabel(label: string | null | undefined, planId?: string | null | undefined) {
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
        const formattedList = parsed.map(item => {
          const itemVal = String(item).toLowerCase();
          if (itemVal.includes("pro_semi") || itemVal === "platinum") return "Platinum";
          if (itemVal === "premium") return "Premium";
          if (itemVal === "pro") return "Pro";
          if (itemVal.includes("pro_monthly")) return "Premium Monthly";
          if (itemVal.includes("free_trial") || itemVal === "free trial") return "Free Trial";
          
          if (itemVal.includes("whatsapp_pro")) return "WA Pro";
          if (itemVal.includes("whatsapp_premium")) return "WA Premium";
          if (itemVal.includes("telegram_monthly") || itemVal.includes("tg_lite")) return "TG Lite";
          if (itemVal.includes("telegram_quarterly") || itemVal.includes("tg_pro")) return "TG Pro";
          if (itemVal.includes("telegram_half_yearly") || itemVal.includes("tg_max")) return "TG Max";
          if (itemVal.includes("social_pilot_starter") || itemVal.includes("spstarter") || itemVal.includes("slite")) return "SPstarter";
          if (itemVal.includes("social_pilot_growth") || itemVal.includes("spgrowth") || itemVal.includes("sgrowth")) return "SPgrowth";
          if (itemVal.includes("crm_standard")) return "Standard CRM";
          if (itemVal.includes("crm_pro_modules")) return "CRM Pro Modules";
          if (itemVal.includes("telecalling_agent_basic") || itemVal.includes("call_lite")) return "Call Lite";
          
          return String(item)
            .split(/[-_ ]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
  if (val.includes("telegram_monthly") || val.includes("tg_lite")) return "TG Lite";
  if (val.includes("telegram_quarterly") || val.includes("tg_pro")) return "TG Pro";
  if (val.includes("telegram_half_yearly") || val.includes("tg_max")) return "TG Max";
  if (val.includes("social_pilot_starter") || val.includes("spstarter") || val.includes("slite")) return "SPstarter";
  if (val.includes("social_pilot_growth") || val.includes("spgrowth") || val.includes("sgrowth")) return "SPgrowth";
  if (val.includes("crm_standard")) return "Standard CRM";
  if (val.includes("crm_pro_modules")) return "CRM Pro Modules";
  if (val.includes("telecalling_agent_basic") || val.includes("call_lite")) return "Call Lite";
  
  return label || planId;
}
