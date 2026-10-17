'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  href?: string | null;
}

export function BrandLogo({
  variant = 'full',
  size = 'md',
  showTagline = true,
  className = '',
  href = '/',
}: BrandLogoProps) {
  const iconDimensions = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }[size];

  const titleSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Official 3D Cart + Price Tag + Magnifying Glass Logo Mark */}
      <div
        className={`relative ${iconDimensions} rounded-xl overflow-hidden bg-[#0B0D10] border border-stone-800/80 shadow-xs shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}
      >
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/images/brand/logo.png`}
          alt="Price Checker Logo"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {variant !== 'icon' && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-extrabold tracking-tight text-[var(--text-primary)] ${titleSizes}`}>
              Price <span className="text-[#16A34A] dark:text-[#4ADE80]">Checker</span>
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono-tabular font-bold uppercase rounded bg-[#123524] text-[#A7F3D0] border border-[#177245]/30">
              SK
            </span>
          </div>

          {showTagline && (
            <span className="text-[11px] font-medium text-[var(--text-muted)] mt-1 tracking-tight leading-none">
              Inteligentné porovnanie potravín
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none block">
        {content}
      </Link>
    );
  }

  return content;
}
