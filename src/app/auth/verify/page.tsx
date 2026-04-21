"use client";

import { useEffect, Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { fetchSettingsOnce } from "@/lib/settingsCache";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const [company, setCompany] = useState({ name: "Enzymatica", logoUrl: "/media/logo.png" });

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Create a passive local client
  const [passiveSupabase] = useState(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  ));

  // Auto-focus first field on mount and fetch settings
  useEffect(() => {
    inputRefs[0].current?.focus();

    fetchSettingsOnce().then(data => {
      if (data?.company) setCompany(data.company);
    });
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return; // Only allow digits
    
    const digits = pastedData.slice(0, 6).split("");
    const newOtp = [...otp];
    
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    
    setOtp(newOtp);
    
    // Focus the last filled input or the 6th input
    const nextIndex = Math.min(digits.length, 5);
    inputRefs[nextIndex].current?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = otp.join("");

    if (!email) {
      setErrorMessage("Ange din e-postadress.");
      return;
    }
    if (token.length < 6) {
      setErrorMessage("Ange hela den sexsiffriga koden.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusText("Verifierar kod...");

    try {
      const { data, error } = await passiveSupabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) {
        setErrorMessage(error.message === "Email link is invalid or has expired"
          ? "Koden är ogiltig eller har gått ut. Kontrollera att du angett rätt kod."
          : error.message);
        return;
      }

      if (data.session) {
        setStatusText("Godkänner medlemskap...");
        try {
          await fetch("/api/auth/confirm", {
            method: "POST",
            headers: { "Authorization": `Bearer ${data.session.access_token}` }
          });
        } catch (e) { }

        setStatusText("Välkommen!");
        setTimeout(() => { router.replace("/"); }, 1000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ett oväntat fel uppstod.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-red-100 dark:border-red-900/20 p-10 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-8">!</div>
          <h1 className="text-2xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter mb-4">
            Misslyckades
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={() => setErrorMessage(null)}
            className="w-full py-5 bg-brand-dark text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-teal transition-all"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-slate-950">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-800 p-12 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-brand-teal/10 text-brand-teal rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-inner overflow-hidden rotate-3">
          {company.logoUrl && company.logoUrl.trim() !== "" ? (
            <Image src={company.logoUrl} alt={company.name} width={60} height={60} className="opacity-90 object-contain -rotate-3" />
          ) : (
            <div className="text-4xl font-black text-brand-teal/40 -rotate-3">{company.name.charAt(0)}</div>
          )}
        </div>

        <h1 className="text-4xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter mb-4">
          Bekräfta konto
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 max-w-md mx-auto leading-relaxed">
          Vi har skickat en sexsiffrig kod till din e-post. Ange den nedan för att slutföra din registrering hos {company.name}.
        </p>

        <form onSubmit={handleVerify} className="space-y-8">
          <div className="space-y-2 text-left max-w-xs mx-auto">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Din e-post</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="namn@företag.se"
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-center gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-12 h-16 text-center text-2xl font-black bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-teal focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none transition-all text-brand-dark dark:text-white shadow-sm"
              />
            ))}
          </div>

          <button
            disabled={isProcessing || otp.join("").length < 6 || !email}
            type="submit"
            className="w-full max-w-md py-6 bg-brand-teal hover:bg-brand-dark text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-teal/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3 mx-auto"
          >
            {isProcessing ? (
              <span className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            ) : null}
            {isProcessing ? "Verifierar..." : "Slutför registrering"}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-50 dark:border-slate-800 flex flex-col items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
            Säker portal • {company.name}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-950">
        <div className="w-16 h-16 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
