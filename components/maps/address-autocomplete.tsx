"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import type { GeoLocation } from "@/lib/types";

export type AddressSelection = GeoLocation;

interface AddressAutocompleteProps {
  value?: string;
  onChange: (selection: AddressSelection | null) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value = "",
  onChange,
  placeholder = "Enter address...",
  required = false,
  className,
  disabled = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          const val = e.target.value;
          setInputValue(val);
          if (val.trim()) {
            onChange({
              formatted: val,
            });
          } else {
            onChange(null);
          }
        }}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          "w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground text-sm",
          className
        )}
      />
    </div>
  );
}
