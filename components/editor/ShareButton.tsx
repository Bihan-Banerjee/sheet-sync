"use client";

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("PURE Share Button clicked!");

    const url = window.location.href;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0"; 
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      
      // 4. Update the UI
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

    } catch (err) {
      console.error("Clipboard copy completely failed:", err);
      alert(`Please copy this link manually:\n\n${url}`);
    }
  };

  return (
    <button
      onClick={handleShare}
      type="button"
      className={`relative z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm flex-shrink-0 cursor-pointer ${
        copied
          ? "bg-success/10 text-success border border-success/30"
          : "bg-accent text-white hover:bg-accent-hover hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="hidden sm:inline pointer-events-none">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="hidden sm:inline pointer-events-none">Share</span>
        </>
      )}
    </button>
  );
}