"use client";

import { motion } from "framer-motion";
import {
  X,
  Truck,
  User,
  Loader2,
  ArrowRight,
  Building2,
  Copy,
  Upload,
  CheckCircle2,
  FileText,
  Package,
  MapPin,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import type { DeliveryMethod, DeliveryZone, DeliveryPaymentOption } from "@/lib/types";
import { CustomSelect } from "@/components/ui/custom-select";

interface CheckoutModalProps {
  product: any;
  store: any;
  onClose: () => void;
}

export function CheckoutModal({ product, store, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userPickedMethod = useRef(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<string | "on_delivery" | null>(null);

  const pickupEnabled = !!store.pickup_enabled;
  const dispatchEnabled = store.dispatch_enabled !== false;

  const deliveryZones: DeliveryZone[] = store.delivery_zones || [];
  const deliveryPaymentOption: DeliveryPaymentOption = store.delivery_payment_option || "checkout";

  const manualMode = true;
  const bankDetails = {
    bankName: store.bank_name || "N/A",
    accountName: store.account_name || "N/A",
    accountNumber: store.account_number || "N/A",
  };

  let deliveryFee = 0;
  if (deliveryMethod === "dispatch" && selectedZoneId && selectedZoneId !== "on_delivery") {
    const zone = deliveryZones.find(z => z.id === selectedZoneId);
    if (zone) deliveryFee = zone.fee;
  }

  const checkoutTotal = Number(product.price) + deliveryFee;

  const resolvedCustomerAddress =
    deliveryMethod === "pickup"
      ? store.address_formatted || "Pickup at vendor store"
      : customerAddress.trim() || "";

  useEffect(() => {
    if (userPickedMethod.current) return;
    if (pickupEnabled && !dispatchEnabled) {
      setDeliveryMethod("pickup");
    } else if (!pickupEnabled && dispatchEnabled) {
      setDeliveryMethod("dispatch");
    } else if (pickupEnabled && dispatchEnabled) {
      setDeliveryMethod("dispatch");
    }
  }, [pickupEnabled, dispatchEnabled]);

  const requiresZoneSelection = deliveryMethod === "dispatch" && (
    deliveryPaymentOption === "checkout" ||
    (deliveryPaymentOption === "optional" && deliveryZones.length > 0)
  );

  const hasValidZone = !requiresZoneSelection || !!selectedZoneId;

  const hasValidDelivery =
    (deliveryMethod === "pickup" && pickupEnabled) ||
    (deliveryMethod === "dispatch" && dispatchEnabled && hasValidZone);

  const hasValidAddress =
    deliveryMethod === "pickup" ||
    (deliveryMethod === "dispatch" && !!customerAddress.trim());

  const canPlaceOrder =
    manualMode &&
    receiptFile !== null &&
    hasValidDelivery &&
    hasValidAddress &&
    customerName &&
    customerPhone &&
    customerEmail;

  useEffect(() => {
    if (manualMode) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let suffix = "";
      for (let i = 0; i < 8; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
      }
      setPaymentReference(`GS-${suffix}`);
    }
  }, [manualMode]);

  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreview(null);
      return;
    }
    if (receiptFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(receiptFile);
      setReceiptPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setReceiptPreview(null);
  }, [receiptFile]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload JPG, PNG, WebP, or PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setReceiptFile(file);
  };

  const orderItems = [
    {
      productId: product.id,
      quantity: 1,
      price: product.price,
      name: product.name,
      variants: {
        size_or_length: product.selectedSize || undefined,
        color: product.selectedColor || undefined,
        texture: product.selectedTexture || undefined,
        type: product.selectedType || undefined,
      },
    },
  ];

  const buildOrderPayload = () => ({
    delivery_method: deliveryMethod,
    customer_latitude: null as null,
    customer_longitude: null as null,
  });

  const handleManualCheckout = async () => {
    if (!receiptFile) {
      toast.error("Please upload your payment receipt");
      return;
    }

    const payload = buildOrderPayload();
    const formData = new FormData();
    formData.append("receipt", receiptFile);
    formData.append("store_id", store.id);
    formData.append("store_slug", store.slug);
    formData.append("customer_name", customerName);
    formData.append("customer_phone", customerPhone);
    formData.append("customer_email", customerEmail);
    formData.append("customer_address", resolvedCustomerAddress);
    formData.append("items", JSON.stringify(orderItems));
    formData.append("total", String(checkoutTotal));
    formData.append("delivery_fee", String(deliveryFee));
    formData.append("delivery_method", deliveryMethod || "dispatch");
    if (payload.customer_latitude != null) {
      formData.append("customer_latitude", String(payload.customer_latitude));
    }
    if (payload.customer_longitude != null) {
      formData.append("customer_longitude", String(payload.customer_longitude));
    }
    formData.append(
      "source",
      new URLSearchParams(window.location.search).get("source") || "Direct",
    );
    formData.append("payment_reference", paymentReference);

    const res = await fetch("/api/orders/create", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to place order");
    }

    toast.success("Order placed! Payment is being reviewed.");
    onClose();
    router.push(data.redirectUrl);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupEnabled && !dispatchEnabled) {
      toast.error("This store has no delivery options configured");
      return;
    }

    if (!deliveryMethod) {
      toast.error("Please select a delivery method");
      return;
    }

    if (deliveryMethod === "dispatch" && !customerAddress.trim()) {
      toast.error("Please enter your delivery address");
      return;
    }

    if (manualMode && !receiptFile) {
      toast.error("Please upload your payment receipt to complete checkout");
      return;
    }

    setLoading(true);

    try {
      await handleManualCheckout();
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast.error(message);
      setLoading(false);
    }
  };

  if (!pickupEnabled && !dispatchEnabled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-background p-8 rounded-3xl border border-border max-w-md text-center">
          <p className="text-muted-foreground mb-4">This store has not configured delivery options yet.</p>
          <button onClick={onClose} className="px-6 py-3 rounded-2xl brand-gradient text-primary-foreground font-bold">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-background w-full max-w-lg rounded-t-[32px] sm:rounded-[40px] border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {manualMode ? "Bank Transfer Checkout" : "Secure Checkout"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 no-scrollbar">
          <div className="flex gap-4 p-4 rounded-3xl glass-card">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
              {product.image ? (
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-1">
              <h3 className="font-bold text-sm leading-tight">{product.name}</h3>
              <p className="text-primary font-black">₦{Number(product.price).toLocaleString()}</p>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                  Customer Details
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground text-sm"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground text-sm"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number"
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-primary" />
                <h3 className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                  Delivery Method
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {pickupEnabled && (
                  <button
                    key="pickup"
                    type="button"
                    onClick={() => {
                      userPickedMethod.current = true;
                      setDeliveryMethod("pickup");
                    }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-sm text-left",
                      deliveryMethod === "pickup"
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-muted border-border text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <span className="block">Pickup — Free</span>
                        <span className="text-[10px] font-normal opacity-80">Collect from vendor</span>
                      </div>
                    </div>
                  </button>
                )}
                {dispatchEnabled && (
                  <button
                    key="dispatch"
                    type="button"
                    onClick={() => {
                      userPickedMethod.current = true;
                      setDeliveryMethod("dispatch");
                    }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-sm text-left",
                      deliveryMethod === "dispatch"
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-muted border-border text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <span className="block">Dispatch Delivery</span>
                        <span className="text-[10px] font-normal opacity-80">
                          {deliveryPaymentOption === "checkout"
                            ? "Delivery fee paid online"
                            : deliveryPaymentOption === "optional"
                              ? "Pay online or on arrival"
                              : "Fee paid to rider on arrival"}
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {deliveryMethod === "pickup" && store.address_formatted && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pickup Address</span>
                    <span className="text-sm font-medium text-foreground leading-relaxed">{store.address_formatted}</span>
                  </div>
                </div>
              )}

              {deliveryMethod === "dispatch" && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Enter your delivery address"
                      required
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground text-sm"
                    />
                  </div>

                  {requiresZoneSelection && (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Delivery Zone</h4>
                      <CustomSelect
                        options={[
                          ...deliveryZones.map(zone => ({
                            label: `${zone.name} — ₦${zone.fee.toLocaleString()}`,
                            value: zone.id
                          })),
                          ...(deliveryPaymentOption === "optional" ? [{
                            label: "Pay rider on delivery (₦0 upfront)",
                            value: "on_delivery"
                          }] : [])
                        ]}
                        value={selectedZoneId || ""}
                        onChange={(opt) => setSelectedZoneId(opt.value)}
                        placeholder="Select your location..."
                      />
                    </div>
                  )}

                  {(!requiresZoneSelection || selectedZoneId === "on_delivery") && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
                      Delivery fee is paid directly to the dispatch rider when your order arrives.
                    </p>
                  )}
                </div>
              )}
            </div>

            {manualMode && (
              <>
                <div className="flex flex-col gap-4 p-5 rounded-3xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h3 className="font-bold uppercase text-[10px] tracking-widest text-primary">
                      Transfer to this account
                    </h3>
                  </div>

                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bank</span>
                      <span className="font-bold text-right">{bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Name</span>
                      <span className="font-bold text-right">{bankDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-right">Account Number</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(bankDetails.accountNumber, "Account number")
                        }
                        className="font-bold text-right flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        {bankDetails.accountNumber}
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Amount</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(String(checkoutTotal), "Amount")}
                        className="font-black text-right text-primary flex items-center gap-1.5"
                      >
                        ₦{checkoutTotal.toLocaleString()}
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Reference</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentReference, "Reference")}
                        className="font-mono text-right font-bold flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        {paymentReference}
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Use the reference above in your transfer narration, then upload your receipt below.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    <h3 className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                      Upload Payment Receipt *
                    </h3>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleReceiptChange}
                    className="hidden"
                  />

                  {!receiptFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex flex-col items-center gap-2 transition-all"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm font-bold text-muted-foreground">
                        Tap to upload receipt
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        JPG, PNG, WebP or PDF — max 5MB
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      {receiptPreview ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                          <Image
                            src={receiptPreview}
                            alt="Receipt preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {receiptFile.name}
                        </p>
                        <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Receipt attached
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="p-6 rounded-3xl bg-muted border border-border flex flex-col gap-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Product Total</span>
                <span>₦{Number(product.price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery Fee</span>
                <span>
                  {deliveryMethod === "pickup"
                    ? "Free (pickup)"
                    : deliveryMethod === "dispatch"
                      ? "Paid to rider on arrival"
                      : "—"}
                </span>
              </div>
              <div className="h-[1px] bg-border my-1" />
              <div className="flex justify-between items-center">
                <span className="font-bold">Total to Pay Now</span>
                <span className="text-xl font-black text-primary">
                  ₦{checkoutTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!deliveryMethod || loading || (manualMode && !canPlaceOrder)}
              className="w-full py-5 rounded-[24px] brand-gradient text-primary-foreground font-black text-lg shadow-[0_0_30px_rgba(158,226,55,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : manualMode ? (
                <>
                  Place Order <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Pay Now <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {manualMode && !receiptFile && (
              <p className="text-center text-[11px] text-amber-500 font-medium">
                Upload your payment receipt to enable checkout
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
