"use client";

import { useEffect, Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { fetchSettingsOnce } from "@/lib/settingsCache";
import { Lock, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: OTP, 2: New Password
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [company, setCompany] = useState({ name: "Enzymatica", logoUrl: "/media/logo.png" });

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (step === 1) {
      inputRefs[0].current?.focus();
    }
    fetchSettingsOnce().then(data => {
      if (data?.company) setCompany(data.company);
    });
  }, [step]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

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
    if (!/^\d+$/.test(pastedData)) return;
    
    const digits = pastedData.slice(0, 6).split("");
    const newOtp = [...otp];
    digits.forEach((digit, i) => { if (i < 6) newOtp[i] = digit; });
    setOtp(newOtp);
    const nextIndex = Math.min(digits.length, 5);
    inputRefs[nextIndex].current?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join("");

    if (!email || token.length < 6) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setStep(2);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ett fel uppstod.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage("Lösenorden matchar inte.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("Lösenordet måste vara minst 6 tecken.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage("Ditt lösenord har uppdaterats!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ett fel uppstod.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-slate-950">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-800 p-12 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-brand-teal/10 text-brand-teal rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner overflow-hidden">
          {company.logoUrl ? (
            <Image src={company.logoUrl} alt={company.name} width={60} height={60} className="object-contain" />
          ) : (
            <div className="text-4xl font-black text-brand-teal/40">{company.name.charAt(0)}</div>
          )}
        </div>

        <h1 className="text-3xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter mb-4">
          {step === 1 ? "Återställ lösenord" : "Välj nytt lösenord"}
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 max-w-md mx-auto leading-relaxed">
          {step === 1 
            ? "Ange den sexsiffriga koden vi skickade till din e-post för att bekräfta din identitet."
            : "Din identitet är bekräftad. Ange ditt nya lösenord nedan."}
        </p>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold flex items-center gap-3 animate-shake">
            <span className="shrink-0">⚠️</span>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} />
            {successMessage}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleVerifyOtp} className="space-y-10">
             <div className="space-y-2 text-left max-w-xs mx-auto">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Din e-post</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal outline-none transition-all font-bold"
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
                   className="w-12 h-16 text-center text-2xl font-black bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-teal focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none transition-all text-brand-dark dark:text-white"
                />
              ))}
            </div>

            <button
              disabled={isProcessing || otp.join("").length < 6 || !email}
              type="submit"
              className="w-full py-6 bg-brand-teal hover:bg-brand-dark text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-teal/20 transition-all flex items-center justify-center gap-3"
            >
              {isProcessing && <Loader2 className="animate-spin" size={18} />}
              Verifiera kod
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-6 text-left max-w-md mx-auto">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nytt lösenord</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-3xl bg-gray-50 dark:bg-slate-800 border-transparent focus:border-brand-teal outline-none transition-all font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Bekräfta lösenord</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-3xl bg-gray-50 dark:bg-slate-800 border-transparent focus:border-brand-teal outline-none transition-all font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              disabled={isProcessing || !newPassword || newPassword !== confirmPassword}
              type="submit"
              className="w-full py-6 bg-brand-teal hover:bg-brand-dark text-white rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-teal/20 transition-all mt-6 flex items-center justify-center gap-3"
            >
              {isProcessing && <Loader2 className="animate-spin" size={18} />}
              Uppdatera lösenord
            </button>
          </form>
        )}

        <button 
          onClick={() => router.push("/login")}
          className="mt-12 flex items-center gap-2 text-[10px] font-black text-brand-teal uppercase tracking-widest hover:gap-4 transition-all mx-auto"
        >
          <ArrowLeft size={14} /> Tillbaka till inloggning
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-teal" size={32} /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
