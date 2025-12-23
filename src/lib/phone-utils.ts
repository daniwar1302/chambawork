// Central America + Mexico phone utilities

export type CountryCode = 
  | "MX"  // Mexico
  | "GT"  // Guatemala
  | "SV"  // El Salvador
  | "HN"  // Honduras
  | "NI"  // Nicaragua
  | "CR"  // Costa Rica
  | "PA"  // Panama
  | "BZ"; // Belize

export interface Country {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  phoneLength: number;
  placeholder: string;
}

export const COUNTRIES: Country[] = [
  { code: "MX", name: "México", dialCode: "52", flag: "🇲🇽", phoneLength: 10, placeholder: "55 1234 5678" },
  { code: "GT", name: "Guatemala", dialCode: "502", flag: "🇬🇹", phoneLength: 8, placeholder: "1234 5678" },
  { code: "SV", name: "El Salvador", dialCode: "503", flag: "🇸🇻", phoneLength: 8, placeholder: "1234 5678" },
  { code: "HN", name: "Honduras", dialCode: "504", flag: "🇭🇳", phoneLength: 8, placeholder: "1234 5678" },
  { code: "NI", name: "Nicaragua", dialCode: "505", flag: "🇳🇮", phoneLength: 8, placeholder: "1234 5678" },
  { code: "CR", name: "Costa Rica", dialCode: "506", flag: "🇨🇷", phoneLength: 8, placeholder: "1234 5678" },
  { code: "PA", name: "Panamá", dialCode: "507", flag: "🇵🇦", phoneLength: 8, placeholder: "1234 5678" },
  { code: "BZ", name: "Belice", dialCode: "501", flag: "🇧🇿", phoneLength: 7, placeholder: "123 4567" },
];

export function getCountryByCode(code: CountryCode): Country {
  return COUNTRIES.find(c => c.code === code) || COUNTRIES[0];
}

export function getCountryByDialCode(dialCode: string): Country | undefined {
  return COUNTRIES.find(c => c.dialCode === dialCode);
}

/**
 * Format phone number for display based on country
 */
export function formatPhoneDisplay(phone: string, country: Country): string {
  const numbers = phone.replace(/\D/g, "");
  
  if (country.code === "MX") {
    // Mexican format: XX XXXX XXXX
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)} ${numbers.slice(2, 6)} ${numbers.slice(6, 10)}`;
  }
  
  if (country.code === "BZ") {
    // Belize format: XXX XXXX
    if (numbers.length <= 3) return numbers;
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 7)}`;
  }
  
  // Central America format (8 digits): XXXX XXXX
  if (numbers.length <= 4) return numbers;
  return `${numbers.slice(0, 4)} ${numbers.slice(4, 8)}`;
}

/**
 * Get full phone number with country dial code (for storage)
 */
export function getFullPhoneNumber(phone: string, country: Country): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `${country.dialCode}${cleanPhone}`;
}

/**
 * Parse a full phone number to extract country and local number
 */
export function parseFullPhoneNumber(fullPhone: string): { country: Country; localNumber: string } | null {
  const cleanPhone = fullPhone.replace(/\D/g, "");
  
  // Try to match country by dial code (longest first)
  const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  
  for (const country of sortedCountries) {
    if (cleanPhone.startsWith(country.dialCode)) {
      return {
        country,
        localNumber: cleanPhone.slice(country.dialCode.length)
      };
    }
  }
  
  return null;
}

/**
 * Validate phone number length based on country
 */
export function isValidPhoneLength(phone: string, country: Country): boolean {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.length === country.phoneLength;
}

/**
 * Get the minimum phone length (for validation across all countries)
 */
export function getMinPhoneLength(): number {
  return Math.min(...COUNTRIES.map(c => c.phoneLength));
}

/**
 * Format a full phone number for display (with country code)
 */
export function formatFullPhoneDisplay(fullPhone: string): string {
  const parsed = parseFullPhoneNumber(fullPhone);
  if (!parsed) return fullPhone;
  
  const formattedLocal = formatPhoneDisplay(parsed.localNumber, parsed.country);
  return `+${parsed.country.dialCode} ${formattedLocal}`;
}

