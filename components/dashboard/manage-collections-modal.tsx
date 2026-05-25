"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Loader2, FolderOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface ManageCollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageCollectionsModal({
  isOpen,
  onClose,
  onSuccess,
}: ManageCollectionsModalProps) {
  const supabase = createClient();
  const [collections, setCollections] = useState<string[]>([]);
  const [newCollectionInput, setNewCollectionInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null); // To track which collection is currently being deleted
  const [storeId, setStoreId] = useState<string | null>(null);

  // Fetch store collections on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchCollections = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: store, error } = await supabase
          .from("stores")
          .select("id, collections")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (store) {
          setStoreId(store.id);
          setCollections(store.collections || []);
        }
      } catch (err: any) {
        console.error("Error fetching collections:", err);
        toast.error("Failed to load collections");
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [isOpen]);

  const handleAddCollection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = newCollectionInput.trim();
    if (!val) return;

    if (collections.includes(val)) {
      toast.error("Collection already exists");
      return;
    }

    if (!storeId) {
      toast.error("Store not loaded properly");
      return;
    }

    setLoading(true);
    try {
      const updatedCollections = [...collections, val];
      
      const { error } = await supabase
        .from("stores")
        .update({ collections: updatedCollections })
        .eq("id", storeId);

      if (error) throw error;

      setCollections(updatedCollections);
      setNewCollectionInput("");
      toast.success(`Collection "${val}" added!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to add collection");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async (collectionName: string) => {
    if (!storeId) return;

    setActionId(collectionName);
    try {
      // 1. Remove from store collections
      const updatedCollections = collections.filter(c => c !== collectionName);
      const { error: storeError } = await supabase
        .from("stores")
        .update({ collections: updatedCollections })
        .eq("id", storeId);

      if (storeError) throw storeError;

      // 2. Remove this collection from all products in this store
      // First, get all products containing this collection
      const { data: products } = await supabase
        .from("products")
        .select("id, collections")
        .eq("store_id", storeId);

      if (products) {
        const updatePromises = products
          .filter(p => p.collections && p.collections.includes(collectionName))
          .map(async p => {
            const filtered = p.collections.filter((c: string) => c !== collectionName);
            return supabase
              .from("products")
              .update({ collections: filtered })
              .eq("id", p.id);
          });

        await Promise.all(updatePromises);
      }

      setCollections(updatedCollections);
      toast.success(`Collection "${collectionName}" deleted and removed from all products`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete collection");
    } finally {
      setActionId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/85 backdrop-blur-md"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full max-w-lg bg-card border-border shadow-2xl rounded-[32px] overflow-hidden relative z-10 flex flex-col p-6 gap-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Manage Collections</h2>
                  <p className="text-xs text-muted-foreground">Create and organize storefront categories.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Input form to add a new collection */}
            <form onSubmit={handleAddCollection} className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="New collection name (e.g. Summer wear)"
                value={newCollectionInput}
                onChange={(e) => setNewCollectionInput(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-muted border border-border focus:border-primary/50 text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground/45"
              />
              <button
                type="submit"
                disabled={loading || !newCollectionInput.trim()}
                className="w-full justify-center py-3 rounded-2xl brand-gradient text-primary-foreground font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(158,226,55,0.15)] disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </form>

            <div className="h-px bg-border w-full" />

            {/* Collections list */}
            <div className="flex-1 overflow-y-auto max-h-[300px] flex flex-col gap-2 pr-1 no-scrollbar">
              {loading && collections.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center gap-3">
                  <FolderOpen className="w-10 h-10 text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground font-bold">No collections created yet</p>
                </div>
              ) : (
                collections.map((c) => (
                  <motion.div
                    key={c}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-border hover:border-primary/20 hover:bg-white/[0.03] transition-all group"
                  >
                    <span className="text-sm font-bold text-foreground capitalize tracking-wide">{c}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCollection(c)}
                      disabled={actionId !== null}
                      className="p-2 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-xl transition-all opacity-85 hover:opacity-100 disabled:opacity-30"
                      title="Delete Collection"
                    >
                      {actionId === c ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
