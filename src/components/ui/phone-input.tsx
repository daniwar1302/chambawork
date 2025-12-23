"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  COUNTRIES, 
  Country, 
  CountryCode, 
  formatPhoneDisplay, 
  getCountryByCode,
  isValidPhoneLength 
} from "@/lib/phone-utils";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: CountryCode;
  onCountryChange: (code: CountryCode) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function PhoneInput({
  value,
  onChange,
  countryCode,
  onCountryChange,
  disabled = false,
  className,
  id,
}: PhoneInputProps) {
  const country = getCountryByCode(countryCode);
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "");
    // Limit to country's phone length
    const limited = numbers.slice(0, country.phoneLength);
    onChange(limited);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={countryCode}
        onValueChange={(value) => onCountryChange(value as CountryCode)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[100px] border-gray-200 focus:border-pink-300 focus:ring-pink-200">
          <SelectValue>
            <span className="flex items-center gap-1">
              <span>{country.flag}</span>
              <span className="text-xs text-gray-500">+{country.dialCode}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                <span>{c.flag}</span>
                <span>{c.name}</span>
                <span className="text-xs text-gray-400">+{c.dialCode}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        id={id}
        type="tel"
        placeholder={country.placeholder}
        value={formatPhoneDisplay(value, country)}
        onChange={handlePhoneChange}
        className={cn(
          "flex-1 border-gray-200 focus:border-pink-300 focus:ring-pink-200",
        )}
        disabled={disabled}
        maxLength={country.phoneLength + 3} // Account for spaces in formatting
      />
    </div>
  );
}

// Hook to manage phone input state
export function usePhoneInput(initialCountry: CountryCode = "MX") {
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState<CountryCode>(initialCountry);
  
  const country = getCountryByCode(countryCode);
  const isValid = isValidPhoneLength(phone, country);
  const fullNumber = `${country.dialCode}${phone}`;
  
  const reset = () => {
    setPhone("");
  };
  
  return {
    phone,
    setPhone,
    countryCode,
    setCountryCode,
    country,
    isValid,
    fullNumber,
    reset,
  };
}

