import { useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface Option {
  label: string;
  value: string;
  code?: string;
}

export function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder,
  searchPlaceholder = "Search...",
  searchable = false,
  className
}: { 
  options: Option[]; 
  value: string; 
  onChange: (opt: Option) => void;
  placeholder: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground flex items-center justify-between text-left shadow-sm text-xs sm:text-sm"
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground/50"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl max-h-64 overflow-hidden flex flex-col z-50">
            {searchable && (
              <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground/60" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent outline-none text-xs font-bold text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            )}
            <div className="overflow-y-auto flex-1 py-1 max-h-48">
              {filtered.length > 0 ? (
                filtered.map(opt => (
                  <button
                    key={`${opt.value}-${opt.code || ""}`}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full px-5 py-3.5 text-left text-xs font-black flex items-center justify-between hover:bg-muted/50 transition-colors uppercase tracking-wider",
                      opt.value === value ? "text-primary bg-primary/5" : "text-foreground"
                    )}
                  >
                    <span>{opt.label}</span>
                    {opt.value === value && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))
              ) : (
                <div className="px-5 py-4 text-xs text-muted-foreground text-center">No results found</div>
              )}
            </div>
          </div>
      )}
    </div>
  );
}
