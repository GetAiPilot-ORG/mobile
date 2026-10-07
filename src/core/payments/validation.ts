/**
 * Validation utilities for Razorpay payment flows across Mobile client
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates customer full name
 */
export function validateCustomerName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full name is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters.' };
  }
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Name should only contain letters and spaces.' };
  }
  return { isValid: true };
}

/**
 * Validates customer email format
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }
  // Standard RFC 5322 compatible email pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid email address (e.g. user@domain.com).' };
  }
  return { isValid: true };
}

/**
 * Validates 10-digit mobile number
 */
export function validatePhone(phone: string): ValidationResult {
  // Strip all non-numeric characters (spaces, dashes, parens, plus)
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) {
    return { isValid: false, error: 'Mobile number is required.' };
  }
  // Strip country code 91 if 12 digits
  const localDigits = cleaned.length === 12 && cleaned.startsWith('91') ? cleaned.slice(2) : cleaned;
  if (localDigits.length !== 10) {
    return { isValid: false, error: 'Mobile number must be exactly 10 digits.' };
  }
  if (!/^[6-9]\d{9}$/.test(localDigits)) {
    return { isValid: false, error: 'Indian mobile number should start with 6, 7, 8, or 9.' };
  }
  return { isValid: true };
}

/**
 * Validates Virtual Payment Address (VPA) / UPI ID format
 * e.g. username@okhdfcbank, mobile@upi, business@ybl
 */
export function validateUpiId(upiId: string): ValidationResult {
  const trimmed = upiId.trim();
  if (!trimmed) {
    return { isValid: false, error: 'UPI ID is required.' };
  }
  // Standard UPI ID pattern: handle@psp
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z0-9]{2,32}$/;
  if (!upiRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid UPI ID format. Example: yourname@upi or mobile@paytm.' };
  }
  return { isValid: true };
}

/**
 * Performs Luhn algorithm validation for credit/debit card numbers
 */
export function validateLuhn(cardNumberDigits: string): boolean {
  let sum = 0;
  let isEven = false;
  for (let i = cardNumberDigits.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumberDigits.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

export type CardBrand = 'visa' | 'mastercard' | 'rupay' | 'amex' | 'unknown';

/**
 * Detects card brand from prefix digits
 */
export function detectCardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^(508[5-9]|60698[5-9]|607[0-8]|6079[0-7]|608[0-4]|608500|6521[5-9]|652[2-9]|6530|6531[0-4])/.test(digits))
    return 'rupay';
  if (/^3[47]/.test(digits)) return 'amex';
  return 'unknown';
}

/**
 * Validates debit/credit card number
 */
export function validateCardNumber(rawCardNumber: string): ValidationResult & { brand?: CardBrand } {
  const digits = rawCardNumber.replace(/\D/g, '');
  if (!digits) {
    return { isValid: false, error: 'Card number is required.' };
  }
  if (digits.length < 13 || digits.length > 19) {
    return { isValid: false, error: 'Card number must be between 13 and 19 digits.' };
  }
  if (!validateLuhn(digits)) {
    return { isValid: false, error: 'Invalid card number. Please re-check the digits.' };
  }
  const brand = detectCardBrand(digits);
  return { isValid: true, brand };
}

/**
 * Validates card expiration date (MM/YY or MM/YYYY)
 */
export function validateCardExpiry(expiry: string): ValidationResult {
  const trimmed = expiry.replace(/\s/g, '');
  if (!trimmed) {
    return { isValid: false, error: 'Expiry date is required (MM/YY).' };
  }
  const match = trimmed.match(/^(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) {
    return { isValid: false, error: 'Format must be MM/YY (e.g. 08/28).' };
  }

  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);
  if (year < 100) {
    year += 2000;
  }

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Month must be between 01 and 12.' };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false, error: 'Card has expired.' };
  }

  if (year > currentYear + 25) {
    return { isValid: false, error: 'Expiry year is too far in the future.' };
  }

  return { isValid: true };
}

/**
 * Validates card CVV
 */
export function validateCardCvv(cvv: string, isAmex = false): ValidationResult {
  const digits = cvv.replace(/\D/g, '');
  if (!digits) {
    return { isValid: false, error: 'CVV is required.' };
  }
  const expectedLen = isAmex ? 4 : 3;
  if (digits.length !== expectedLen && digits.length !== 3 && digits.length !== 4) {
    return { isValid: false, error: `CVV must be ${expectedLen} digits.` };
  }
  return { isValid: true };
}

/**
 * Validates payment amount
 */
export function validateAmount(amount: number): ValidationResult {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return { isValid: false, error: 'Payment amount must be greater than zero.' };
  }
  return { isValid: true };
}
