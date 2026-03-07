"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useAppUser } from "@/hooks/useAuth";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();
  const { appUser } = useAppUser();

  const handleShare = async () => {
    // 1. Validate User
    if (!appUser || (appUser as any).isAnonymous) {
      addToast("Only registered users can generate shareable links.", "error");
      return;
    }

    const url = window.location.href;

    try {
      // 2. Try modern Clipboard API (Works in HTTPS & localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // 3. Try legacy execCommand (Works in insecure HTTP networks)
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0"; // Make it invisible
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand("copy");
        textArea.remove();
        
        if (!successful) {
          throw new Error("execCommand returned false");
        }
      }
      
      // 4. Trigger UI Success
      setCopied(true);
      addToast("Link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);

    } catch (err) {
      console.error("Clipboard copy completely failed:", err);
      
      // 🚨 ULTIMATE FALLBACK: If the browser refuses to copy to clipboard, 
      // forcefully show the user the link so they can copy it manually.
      alert(`Your browser blocked the auto-copy.\n\nPlease copy this link manually:\n\n${url}`);
    }
  };

  return (
    <button
      onClick={handleShare}
      type="button" // Ensures it doesn't accidentally trigger forms
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm flex-shrink-0 ${
        copied
          ? "bg-success/10 text-success border border-success/30"
          : "bg-accent text-white hover:bg-accent-hover hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="hidden sm:inline">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="hidden sm:inline">Share</span>
        </>
      )}
    </button>
  );
}