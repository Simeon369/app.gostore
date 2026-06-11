"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/utils/cn";

export type BankAccountFields = {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
};

type BankOption = {
  label: string;
  value: string;
  code: string;
};

type BankAccountVerificationProps = {
  value: BankAccountFields;
  onChange: (value: BankAccountFields) => void;
};

function BankSelect({
  options,
  value,
  onChange,
  disabled,
}: {
  options: BankOption[];
  value: string;
  onChange: (opt: BankOption) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground flex items-center justify-between text-left shadow-sm disabled:opacity-50"
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground/50"}>
          {selectedOption ? selectedOption.label : "Search bank name"}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="relative w-full mt-2 bg-muted/30 border border-border rounded-2xl shadow-inner max-h-64 overflow-hidden flex flex-col z-20">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search bank..."
              className="w-full bg-transparent outline-none text-xs font-bold text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="overflow-y-auto flex-1 py-1 max-h-48">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={`${opt.value}-${opt.code}`}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full px-5 py-3.5 text-left text-xs font-black flex items-center justify-between hover:bg-muted/50 transition-colors uppercase tracking-wider",
                    opt.value === value ? "text-primary bg-primary/5" : "text-foreground",
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

export function BankAccountVerification({ value, onChange }: BankAccountVerificationProps) {
  const [bankList, setBankList] = useState<BankOption[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBanks() {
      setLoadingBanks(true);
      setBanksError(null);
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data.error || "Failed to load banks");
        }
        const sorted = data
          .map((bank: { name: string; code: string }) => ({
            label: bank.name,
            value: bank.name,
            code: bank.code,
          }))
          .sort((a: BankOption, b: BankOption) => a.label.localeCompare(b.label));
        setBankList(sorted);
      } catch (err) {
        setBanksError(err instanceof Error ? err.message : "Failed to load banks");
      } finally {
        setLoadingBanks(false);
      }
    }
    loadBanks();
  }, []);

  const verifyAccount = async (
    accountNumber: string,
    bankCode: string,
    bankName: string,
  ) => {
    if (accountNumber.length !== 10 || !bankCode) return;

    setVerifying(true);
    setVerifyError(null);
    onChange({
      bankName,
      bankCode,
      accountNumber,
      accountName: "",
      isVerified: false,
    });

    try {
      const res = await fetch(
        `/api/banks/validate?accountNumber=${accountNumber}&bankCode=${bankCode}`,
      );
      const data = await res.json();

      if (!res.ok || !data.accountName) {
        throw new Error(data.error || "Could not verify this account");
      }

      onChange({
        bankName,
        bankCode,
        accountNumber,
        accountName: data.accountName,
        isVerified: true,
      });
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed");
      onChange({
        bankName,
        bankCode,
        accountNumber,
        accountName: "",
        isVerified: false,
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!value.bankCode || value.accountNumber.length !== 10) return;

    const timer = setTimeout(() => {
      verifyAccount(value.accountNumber, value.bankCode, value.bankName);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.bankCode, value.accountNumber]);

  const handleBankSelect = (opt: BankOption) => {
    onChange({
      bankName: opt.value,
      bankCode: opt.code,
      accountNumber: value.accountNumber,
      accountName: "",
      isVerified: false,
    });
    setVerifyError(null);
  };

  const handleAccountNumberChange = (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 10);
    onChange({
      ...value,
      accountNumber: clean,
      accountName: "",
      isVerified: false,
    });
    setVerifyError(null);
  };

  return (
    <div className="flex flex-col gap-6">
      

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
          <Building2 className="w-3 h-3" /> Bank Name
        </label>
        {loadingBanks ? (
          <div className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-xs font-bold text-muted-foreground/60 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading banks...
          </div>
        ) : banksError ? (
          <div className="flex items-center gap-3 text-red-500 text-xs font-medium bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" /> {banksError}
          </div>
        ) : (
          <BankSelect
            options={bankList}
            value={value.bankName}
            onChange={handleBankSelect}
            disabled={verifying}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
          Account Number
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={value.accountNumber}
          onChange={(e) => handleAccountNumberChange(e.target.value)}
          maxLength={10}
          placeholder="0123456789"
          disabled={!value.bankCode || loadingBanks}
          className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50 shadow-sm disabled:opacity-50"
        />
      </div>

      {verifying && (
        <div className="flex items-center gap-3 text-primary text-xs font-black uppercase tracking-widest bg-primary/10 p-4 rounded-2xl border border-primary/20 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" /> Verifying ...
        </div>
      )}

      {verifyError && !verifying && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-red-500 text-xs font-medium bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" /> {verifyError}
          </div>
          {value.accountNumber.length === 10 && value.bankCode && (
            <button
              type="button"
              onClick={() =>
                verifyAccount(value.accountNumber, value.bankCode, value.bankName)
              }
              className="text-xs font-black uppercase tracking-widest text-primary hover:underline w-fit"
            >
              Retry verification
            </button>
          )}
        </div>
      )}

      {value.isVerified && value.accountName && !verifying && (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1">
            Verified
          </label>
          <div className="w-full px-5 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-black flex items-center justify-between shadow-sm">
            <span>{value.accountName}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      )}
    </div>
  );
}
