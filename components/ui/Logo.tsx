"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  variant?: "icon-only" | "full";
}

export const Logo = ({ className = "", variant = "full" }: LogoProps) => {
  const logoSrc = "/image.png"; 

  // Option 1: Full Logo with Text (Desktop Header)
  if (variant === "full") {
    return (
      <Link href="/" className={`flex items-center transition-opacity hover:opacity-80 ${className}`}>
        {/* Strictly contained to 32px (h-8) height to prevent blowing up the header */}
        <div className="h-8 flex items-center justify-start relative">
          <Image 
            src={logoSrc}
            alt="SheetSync Logo"
            width={160} // Safe maximum width
            height={32} // Strict height
            priority 
            // w-auto and object-contain force it to scale down proportionally
            className="h-full w-auto object-contain" 
          />
        </div>
      </Link>
    );
  }

  // Option 2: Icon Only (Mobile / Compact Header)
  return (
    <Link href="/" className={`flex items-center group ${className}`}>
      {/* Strictly locked to a 32x32px square box */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
        <Image 
          src={logoSrc}
          alt="SheetSync Icon"
          width={32} 
          height={32}
          priority
          // Ensures the image stays inside the 32x32 box
          className="w-full h-full object-contain" 
        />
      </div>
    </Link>
  );
};