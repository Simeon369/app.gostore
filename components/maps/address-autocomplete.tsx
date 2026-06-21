"use client";

import { useEffect, useRef, useState } from "react";
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

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export function AddressAutocomplete({
  value = "",
  onChange,
  placeholder = "Search address...",
  required = false,
  className,
  disabled = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!inputValue || inputValue === value) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            inputValue
          )}&format=json&limit=5&countrycodes=ng`
        );
        const data = await res.json();
        setSuggestions(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Failed to fetch address suggestions", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, value]);

  const handleSelect = (suggestion: NominatimResult) => {
    setInputValue(suggestion.display_name);
    setIsOpen(false);
    onChange({
      formatted: suggestion.display_name,
      placeId: suggestion.place_id.toString(),
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          if (!e.target.value.trim()) {
            onChange(null);
            setIsOpen(false);
          }
        }}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          "w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground text-sm",
          className
        )}
      />
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-background border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-3 text-sm cursor-pointer hover:bg-muted transition-colors border-b border-border/50 last:border-0"
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
