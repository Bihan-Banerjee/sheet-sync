"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  variant?: "icon-only" | "full";
}

export const Logo = ({ className = "", variant = "full" }: LogoProps) => {
  const logoSrc = "/image.png"; 

  if (variant === "full") {
    return (
      <Link href="/" className={`flex items-center transition-opacity hover:opacity-80 ${className}`}>
        <div className="h-8 flex items-center justify-start relative">
          <Image 
            src={logoSrc}
            alt="SheetSync Logo"
            width={160} 
            height={32} 
            priority 
            className="h-full w-auto object-contain" 
          />
        </div>
      </Link>
    );
  }

  return (
    <Link href="/" className={`flex items-center group ${className}`}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
        <Image 
          src={logoSrc}
          alt="SheetSync Icon"
          width={32} 
          height={32}
          priority
          className="w-full h-full object-contain" 
        />
      </div>
    </Link>
  );
};