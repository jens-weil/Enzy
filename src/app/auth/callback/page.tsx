"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { fetchSettingsOnce } from "@/lib/settingsCache";

// Module-level variable to track across re-renders/Strict Mode
let processedCode: string | null = null;

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Verifying your email...");
  const [waitingForClick, setWaitingForClick] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ query: any, hash: string } | null>(null);
  const [company, setCompany] = useState({ name: "Enzymatica", logoUrl: "/media/logo.png" });

  useEffect(() => {
    fetchSettingsOnce().then(data => {
      if (data?.company) {
        setCompany({
          name: data.company.name || "Enzymatica",
          logoUrl: data.company.logoUrl || "/media/logo.png"
        });
      }
    });
  }, []);

  const navigateToPortal = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      let redirectPath = "/";
      if (profile?.role === "Partner") redirectPath = "/partner";
      else if (profile?.role === "Admin" || profile?.role === "Editor") redirectPath = "/admin";
      
      router.replace(redirectPath);
    } catch (err) {
      router.replace("/");
    }
  };

  const performExchange = async (code: string) => {
    if (processedCode === code) return;
    processedCode = code;
    setIsProcessing(true);
    setWaitingForClick(false);

    try {
      setStatusText("Synchronizing account...");
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        setErrorMessage(`Link expired or invalid: ${exchangeError.message}`);
        return;
      }

      if (data.session) {
        try {
          await fetch("/api/auth/confirm", {
            method: "POST",
            headers: { "Authorization": `Bearer ${data.session.access_token}` }
          });
        } catch (e) {}

        setStatusText("Welcome! Entering portal...");
        await navigateToPortal(data.user.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "A technical error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const handleAuth = async () => {
      // Collect debug info
      const queryParams: any = {};
      searchParams.forEach((value, key) => { queryParams[key] = value; });
      const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
      
      if (isMounted) {
        setDebugInfo({ query: queryParams, hash: currentHash });
      }

      // 1. Check for errors (immediate)
      const queryError = searchParams.get("error_description") || searchParams.get("error");
      let hashError = null;
      if (currentHash.includes("error_description=")) {
        const params = new URLSearchParams(currentHash.substring(1));
        hashError = params.get("error_description") || params.get("error");
      }

      const finalError = queryError || hashError;
      if (finalError) {
        if (isMounted) setErrorMessage(decodeURIComponent(finalError.replace(/\+/g, ' ')));
        return;
      }

      // 2. Check for immediate session
      const { data: { session: instantSession } } = await supabase.auth.getSession();
      if (instantSession) {
        if (isMounted) {
          setStatusText("Inloggad! Dirigerar om...");
          await navigateToPortal(instantSession.user.id);
        }
        return;
      }

      // 3. Polling for session (Implicit flow/Fragments)
      let attempts = 0;
      while (attempts < 5) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (isMounted) {
            setStatusText("Välkommen tillbaka!");
            await navigateToPortal(session.user.id);
          }
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 600));
        attempts++;
      }

      // 4. PKCE Code check
      const code = searchParams.get("code");
      if (code) {
        // ANTI-SCANNER PROTECTION:
        // We do NOT exchange automatically. We show a button.
        if (isMounted) {
          setWaitingForClick(true);
          setStatusText(`Välkommen till ${company.name}!`);
        }
      } else {
        if (isMounted) setErrorMessage("Ingen verifieringskod hittades i länken. Kontrollera att länken är komplett eller försök logga in igen.");
      }
    };

    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        if (isMounted && !isProcessing && !waitingForClick) {
          navigateToPortal(session.user.id);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams, router]);

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-red-100 dark:border-red-900/20 p-10 text-center">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-8">!</div>
          <h1 className="text-2xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter mb-4">
            Verifiering misslyckades
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 leading-relaxed">
            {errorMessage}
          </p>
          
          <button 
            onClick={() => window.location.replace("/")}
            className="w-full py-5 bg-brand-dark text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-teal transition-all mb-4"
          >
            Gå till startsidan
          </button>

          {/* Hidden Debug Info */}
          <details className="mt-8 text-left group">
            <summary className="text-[10px] font-black uppercase tracking-widest text-gray-300 cursor-pointer hover:text-gray-400 text-center list-none outline-none">
              Teknisk information (Debug)
            </summary>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-[10px] font-mono text-gray-400 overflow-x-auto">
              <p className="mb-2 text-brand-teal font-bold">Query Params:</p>
              <pre>{JSON.stringify(debugInfo?.query, null, 2)}</pre>
              <p className="mt-4 mb-2 text-brand-teal font-bold">URL Hash:</p>
              <pre className="whitespace-pre-wrap break-all">{debugInfo?.hash || "(tom)"}</pre>
            </div>
          </details>
        </div>
      </div>
    );
  }

  if (waitingForClick) {
    const code = searchParams.get("code");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 p-10 text-center animate-in zoom-in-95 duration-500">
           <div className="w-20 h-20 bg-brand-teal/10 text-brand-teal rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner">
             {company.logoUrl && company.logoUrl.trim() !== "" ? (
               <Image src={company.logoUrl} alt={company.name} width={40} height={40} className="opacity-80 object-contain" />
             ) : (
               <div className="text-3xl font-black text-brand-teal/40">{company.name.charAt(0)}</div>
             )}
           </div>
           <h1 className="text-3xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter mb-4">
            Välkommen!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 leading-relaxed">
            Klicka på knappen nedan för att bekräfta din e-postadress och logga in i portalen.
          </p>
          
          <button 
            disabled={isProcessing}
            onClick={() => code && performExchange(code)}
            className="w-full py-5 bg-brand-teal hover:bg-brand-dark text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-teal/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : null}
            Slutför registrering & Logga in
          </button>

          <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-gray-300">
            Säker verifiering av {company.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-950 text-center">
      <div className="w-20 h-20 border-4 border-brand-teal/10 border-t-brand-teal rounded-full animate-spin mb-10" />
      <h1 className="text-3xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter animate-pulse">
        {statusText}
      </h1>
      <p className="text-gray-400 font-medium mt-4 tracking-widest uppercase text-[10px]">Etablerar säker anslutning...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-950">
        <div className="w-16 h-16 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin mb-8" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
