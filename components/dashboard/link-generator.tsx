"use client";

import { motion } from "framer-motion";
import { Copy, MessageCircle, Share2, Check } from "lucide-react";
import { Instagram } from "../../components/icons";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { getStoreUrl } from "@/lib/urls";

export function LinkGenerator({ storeSlug }: { storeSlug: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const storeUrl = getStoreUrl(storeSlug);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareOptions = [
    { 
      id: "bio", 
      name: "Instagram", 
      icon: Instagram, 
      text: `${storeUrl}?src=ig`,
      caption: `Shop my latest products here! 🛍️: ${storeUrl}?src=ig`,
      description: "Optimized link for your profile bio."
    },
    { 
      id: "whatsapp", 
      name: "WhatsApp", 
      icon: MessageCircle, 
      text: `${storeUrl}?src=wa`,
      caption: `Shop my latest products here! 🛍️: ${storeUrl}?src=wa`,
      description: "Includes a friendly intro for your status."
    },
    { 
      id: "tiktok", 
      name: "TikTok", 
      icon: Share2, 
      text: `${storeUrl}?src=tt`,
      caption: `Shop my latest products here! 🛍️: ${storeUrl}?src=tt`,
      description: "Short and clean for video comments."
    },
  ];

  return (
    <div className="glass-card rounded-2xl lg:rounded-[40px] p-4 lg:p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-black">Smart Link Generator</h3>
        <p className="text-sm text-muted-foreground">Copy links optimized for your social media channels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shareOptions.map((option) => (
          <div
            key={option.id}
            className={cn(
              "p-4 lg:p-6 rounded-2xl lg:rounded-[32px] border transition-all flex flex-col gap-4 relative overflow-hidden",
              copied === option.id || copied === `${option.id}-caption`
                ? "bg-primary/5 border-primary/30" 
                : "bg-card border-border hover:border-primary/20"
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn(
                "p-3 rounded-2xl transition-all",
                copied === option.id || copied === `${option.id}-caption` ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <option.icon className="w-5 h-5" />
              </div>
              {(copied === option.id || copied === `${option.id}-caption`) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-primary text-primary-foreground p-1 rounded-full"
                >
                  <Check className="w-3 h-3" />
                </motion.div>
              )}
            </div>
            
            <div>
              <p className="font-bold text-sm mb-1">{option.name}</p>
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">{option.description}</p>
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-border">
              <button 
                onClick={() => copyToClipboard(option.text, option.id)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-muted transition-all group/btn"
              >
                <span className="text-[11px] font-mono text-muted-foreground truncate pr-4">{option.text}</span>
                <Copy className={cn(
                  "w-3.5 h-3.5 flex-shrink-0 transition-all",
                  copied === option.id ? "text-primary" : "text-muted-foreground group-hover/btn:text-foreground"
                )} />
              </button>
              
              <button 
                onClick={() => copyToClipboard(option.caption, `${option.id}-caption`)}
                className="w-full py-2 rounded-xl bg-muted hover:bg-primary/10 text-xs font-bold text-foreground hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-3 h-3" /> Copy Caption
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
