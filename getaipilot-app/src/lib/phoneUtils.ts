export interface CountryItem {
  name: string;
  isoCode: string;
  flag: string;
  phonecode: string;
}

export const COUNTRIES: CountryItem[] = [
  { name: "India", isoCode: "IN", flag: "🇮🇳", phonecode: "91" },
  { name: "United States", isoCode: "US", flag: "🇺🇸", phonecode: "1" },
  { name: "United Kingdom", isoCode: "GB", flag: "🇬🇧", phonecode: "44" },
  { name: "United Arab Emirates", isoCode: "AE", flag: "🇦🇪", phonecode: "971" },
  { name: "Canada", isoCode: "CA", flag: "🇨🇦", phonecode: "1" },
  { name: "Australia", isoCode: "AU", flag: "🇦🇺", phonecode: "61" },
  { name: "Singapore", isoCode: "SG", flag: "🇸🇬", phonecode: "65" },
  { name: "Saudi Arabia", isoCode: "SA", flag: "🇸🇦", phonecode: "966" },
  { name: "Germany", isoCode: "DE", flag: "🇩🇪", phonecode: "49" },
  { name: "Qatar", isoCode: "QA", flag: "🇶🇦", phonecode: "974" },
  { name: "Oman", isoCode: "OM", flag: "🇴🇲", phonecode: "968" },
  { name: "Kuwait", isoCode: "KW", flag: "🇰🇼", phonecode: "965" },
  { name: "Bahrain", isoCode: "BH", flag: "🇧🇭", phonecode: "973" },
  { name: "Afghanistan", isoCode: "AF", flag: "🇦🇫", phonecode: "93" },
  { name: "Argentina", isoCode: "AR", flag: "🇦🇷", phonecode: "54" },
  { name: "Austria", isoCode: "AT", flag: "🇦🇹", phonecode: "43" },
  { name: "Bangladesh", isoCode: "BD", flag: "🇧🇩", phonecode: "880" },
  { name: "Belgium", isoCode: "BE", flag: "🇧🇪", phonecode: "32" },
  { name: "Brazil", isoCode: "BR", flag: "🇧🇷", phonecode: "55" },
  { name: "China", isoCode: "CN", flag: "🇨🇳", phonecode: "86" },
  { name: "Colombia", isoCode: "CO", flag: "🇨🇴", phonecode: "57" },
  { name: "Denmark", isoCode: "DK", flag: "🇩🇰", phonecode: "45" },
  { name: "Egypt", isoCode: "EG", flag: "🇪🇬", phonecode: "20" },
  { name: "Finland", isoCode: "FI", flag: "🇫🇮", phonecode: "358" },
  { name: "France", isoCode: "FR", flag: "🇫🇷", phonecode: "33" },
  { name: "Ghana", isoCode: "GH", flag: "🇬🇭", phonecode: "233" },
  { name: "Greece", isoCode: "GR", flag: "🇬🇷", phonecode: "30" },
  { name: "Hong Kong", isoCode: "HK", flag: "🇭🇰", phonecode: "852" },
  { name: "Indonesia", isoCode: "ID", flag: "🇮🇩", phonecode: "62" },
  { name: "Ireland", isoCode: "IE", flag: "🇮🇪", phonecode: "353" },
  { name: "Israel", isoCode: "IL", flag: "🇮🇱", phonecode: "972" },
  { name: "Italy", isoCode: "IT", flag: "🇮🇹", phonecode: "39" },
  { name: "Japan", isoCode: "JP", flag: "🇯🇵", phonecode: "81" },
  { name: "Kenya", isoCode: "KE", flag: "🇰🇪", phonecode: "254" },
  { name: "Malaysia", isoCode: "MY", flag: "🇲🇾", phonecode: "60" },
  { name: "Mexico", isoCode: "MX", flag: "🇲🇽", phonecode: "52" },
  { name: "Nepal", isoCode: "NP", flag: "🇳🇵", phonecode: "977" },
  { name: "Netherlands", isoCode: "NL", flag: "🇳🇱", phonecode: "31" },
  { name: "New Zealand", isoCode: "NZ", flag: "🇳🇿", phonecode: "64" },
  { name: "Nigeria", isoCode: "NG", flag: "🇳🇬", phonecode: "234" },
  { name: "Norway", isoCode: "NO", flag: "🇳🇴", phonecode: "47" },
  { name: "Pakistan", isoCode: "PK", flag: "🇵🇰", phonecode: "92" },
  { name: "Philippines", isoCode: "PH", flag: "🇵🇭", phonecode: "63" },
  { name: "Poland", isoCode: "PL", flag: "🇵🇱", phonecode: "48" },
  { name: "Portugal", isoCode: "PT", flag: "🇵🇹", phonecode: "351" },
  { name: "Russia", isoCode: "RU", flag: "🇷🇺", phonecode: "7" },
  { name: "South Africa", isoCode: "ZA", flag: "🇿🇦", phonecode: "27" },
  { name: "South Korea", isoCode: "KR", flag: "🇰🇷", phonecode: "82" },
  { name: "Spain", isoCode: "ES", flag: "🇪🇸", phonecode: "34" },
  { name: "Sri Lanka", isoCode: "LK", flag: "🇱🇰", phonecode: "94" },
  { name: "Sweden", isoCode: "SE", flag: "🇸🇪", phonecode: "46" },
  { name: "Switzerland", isoCode: "CH", flag: "🇨🇭", phonecode: "41" },
  { name: "Taiwan", isoCode: "TW", flag: "🇹🇼", phonecode: "886" },
  { name: "Thailand", isoCode: "TH", flag: "🇹🇭", phonecode: "66" },
  { name: "Turkey", isoCode: "TR", flag: "🇹🇷", phonecode: "90" },
  { name: "Ukraine", isoCode: "UA", flag: "🇺🇦", phonecode: "380" },
  { name: "Vietnam", isoCode: "VN", flag: "🇻🇳", phonecode: "84" },
];

export const DEFAULT_COUNTRY: CountryItem = COUNTRIES[0];

/**
 * Extracts national digits from user input, intelligently handling whether the user
 * included the country dial code or not.
 */
export function extractNationalDigits(
  rawPhone: string,
  dialCode: string = "91"
): { national: string; dialCode: string } {
  if (!rawPhone) return { national: "", dialCode };

  const cleanDial = dialCode.replace(/\D/g, "") || "91";
  const trimmed = rawPhone.trim();

  if (trimmed.startsWith("+")) {
    const fullDigits = trimmed.replace(/\D/g, "");
    if (fullDigits.startsWith(cleanDial)) {
      return { national: fullDigits.slice(cleanDial.length), dialCode: cleanDial };
    }
    return { national: fullDigits, dialCode: cleanDial };
  }

  let national = trimmed.replace(/\D/g, "");

  if (cleanDial === "91") {
    if (national.length === 12 && national.startsWith("91")) {
      national = national.slice(2);
    } else if (national.length === 11 && national.startsWith("0")) {
      national = national.slice(1);
    }
  } else if (cleanDial === "1") {
    if (national.length === 11 && national.startsWith("1")) {
      national = national.slice(1);
    }
  } else if (cleanDial === "44") {
    if (national.length === 12 && national.startsWith("44")) {
      national = national.slice(2);
    } else if (national.length === 11 && national.startsWith("0")) {
      national = national.slice(1);
    }
  } else if (cleanDial === "971") {
    if (national.length === 12 && national.startsWith("971")) {
      national = national.slice(3);
    } else if (national.length === 10 && national.startsWith("0")) {
      national = national.slice(1);
    }
  } else if (cleanDial === "65") {
    if (national.length === 10 && national.startsWith("65")) {
      national = national.slice(2);
    }
  } else if (cleanDial === "61") {
    if (national.length === 11 && national.startsWith("61")) {
      national = national.slice(2);
    } else if (national.length === 10 && national.startsWith("0")) {
      national = national.slice(1);
    }
  } else {
    if (national.startsWith(cleanDial) && national.length >= cleanDial.length + 8) {
      national = national.slice(cleanDial.length);
    } else if (national.startsWith("0")) {
      national = national.slice(1);
    }
  }

  return { national, dialCode: cleanDial };
}

/**
 * Normalizes input phone string and dial code into strict E.164 format (+<country><digits>)
 */
export function formatToE164(rawPhone: string, dialCode: string = "91"): string {
  const { national, dialCode: cleanDial } = extractNationalDigits(rawPhone, dialCode);
  return national ? `+${cleanDial}${national}` : "";
}

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Validates a phone number according to international and country-specific rules
 */
export function validatePhoneNumber(
  rawPhone: string,
  countryIso: string = "IN",
  dialCode: string = "91"
): PhoneValidationResult {
  if (!rawPhone || !rawPhone.trim()) {
    return {
      isValid: false,
      normalized: "",
      error: "Please enter your phone number.",
    };
  }

  const { national: nationalDigits, dialCode: cleanDial } = extractNationalDigits(
    rawPhone,
    dialCode
  );
  const normalized = `+${cleanDial}${nationalDigits}`;

  if (!nationalDigits || nationalDigits.length < 5) {
    return {
      isValid: false,
      normalized,
      error: "Please enter a valid phone number.",
    };
  }

  if (countryIso === "IN" || cleanDial === "91") {
    if (nationalDigits.length !== 10) {
      return {
        isValid: false,
        normalized,
        error: "Indian phone numbers must be 10 digits.",
      };
    }
    if (!/^[6-9]/.test(nationalDigits)) {
      return {
        isValid: false,
        normalized,
        error: "Indian mobile numbers must start with 6, 7, 8, or 9.",
      };
    }
    return { isValid: true, normalized: `+91${nationalDigits}` };
  }

  if (countryIso === "US" || countryIso === "CA" || cleanDial === "1") {
    if (nationalDigits.length !== 10) {
      return {
        isValid: false,
        normalized,
        error: "Phone number must be 10 digits.",
      };
    }
    if (!/^[2-9]/.test(nationalDigits)) {
      return {
        isValid: false,
        normalized,
        error: "Area code must start with digits 2-9.",
      };
    }
    return { isValid: true, normalized: `+1${nationalDigits}` };
  }

  if (countryIso === "GB" || cleanDial === "44") {
    if (nationalDigits.length < 10 || nationalDigits.length > 11) {
      return {
        isValid: false,
        normalized,
        error: "UK phone number must be 10 or 11 digits.",
      };
    }
    return { isValid: true, normalized: `+44${nationalDigits}` };
  }

  if (countryIso === "AE" || cleanDial === "971") {
    if (nationalDigits.length !== 9) {
      return {
        isValid: false,
        normalized,
        error: "UAE phone number must be 9 digits.",
      };
    }
    return { isValid: true, normalized: `+971${nationalDigits}` };
  }

  if (countryIso === "SG" || cleanDial === "65") {
    if (nationalDigits.length !== 8) {
      return {
        isValid: false,
        normalized,
        error: "Singapore phone number must be 8 digits.",
      };
    }
    return { isValid: true, normalized: `+65${nationalDigits}` };
  }

  const allDigits = `${cleanDial}${nationalDigits}`;
  if (allDigits.length < 7 || allDigits.length > 15) {
    return {
      isValid: false,
      normalized,
      error: "Phone number must be between 7 and 15 digits.",
    };
  }

  return { isValid: true, normalized };
}

/**
 * Formats a phone number for display with partial masking for privacy
 * Example: +919876543210 -> +91 98*** ***10
 */
export function maskPhoneDisplay(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.length <= 6) return cleaned;

  if (cleaned.startsWith("+91") && cleaned.length === 13) {
    const national = cleaned.slice(3);
    return `+91 ${national.slice(0, 2)}*** ***${national.slice(-2)}`;
  }

  const prefix = cleaned.slice(0, 4);
  const suffix = cleaned.slice(-3);
  return `${prefix}******${suffix}`;
}
