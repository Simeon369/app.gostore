"use client";

import { useRef } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { validateLogoFile } from "@/lib/store-logo";
import { toast } from "sonner";

interface StoreLogoUploadProps {
  preview: string | null;
  onFileSelect: (file: File, previewUrl: string) => void;
  onClear?: () => void;
  className?: string;
  compact?: boolean;
}

export function StoreLogoUpload({
  preview,
  onFileSelect,
  onClear,
  className,
  compact = false,
}: StoreLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateLogoFile(file);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onFileSelect(file, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer overflow-hidden",
          compact ? "h-32" : "h-40",
          preview && "border-solid border-border",
        )}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Store logo preview"
              fill
              className="object-cover"
              unoptimized={preview.startsWith("data:")}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white font-bold text-sm">Change Logo</p>
            </div>
            {onClear && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  onClear();
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
                aria-label="Remove logo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm font-bold text-muted-foreground">Upload store logo</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP (max 2MB)</p>
          </>
        )}
      </div>
    </div>
  );
}
