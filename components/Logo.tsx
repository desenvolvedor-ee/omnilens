
import React from 'react';

export const LogoIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="100" height="100" rx="24" fill="#0F172A"/>
    <path d="M50 20L76 35V65L50 80L24 65V35L50 20Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="50" cy="50" r="12" fill="#6366F1" className="animate-pulse" style={{ animationDuration: '3s' }}/>
    <path d="M50 35V42M50 58V65M37 43.5L43 47M57 53L63 56.5M37 56.5L43 53M57 47L63 43.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const LogoFull = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-col items-center gap-6 ${className}`}>
    <div className="relative">
      <div className="absolute inset-0 bg-indigo-500 blur-[40px] opacity-20 animate-pulse"></div>
      <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
        <rect width="100" height="100" rx="28" fill="#0F172A" shadow-xl="true"/>
        <path d="M50 15L80.3 32.5V67.5L50 85L19.7 67.5V32.5L50 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" opacity="0.3"/>
        <path d="M50 25L71.6 37.5V62.5L50 75L28.4 62.5V37.5L50 25Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
        <circle cx="50" cy="50" r="14" fill="#6366F1" className="animate-pulse" style={{ animationDuration: '4s' }}/>
        <g opacity="0.8">
          <path d="M50 25V35M50 65V75M28.5 37.5L37 42.5M63 57.5L71.5 62.5M28.5 62.5L37 57.5M63 42.5L71.5 37.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </g>
      </svg>
    </div>
    <div className="text-center">
      <h1 className="text-5xl font-[900] tracking-tighter text-slate-900 leading-none">OMNILENS</h1>
      <div className="flex items-center justify-center gap-2 mt-2">
        <div className="h-px w-8 bg-slate-200"></div>
        <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-600">PRO INTELLIGENCE</span>
        <div className="h-px w-8 bg-slate-200"></div>
      </div>
    </div>
  </div>
);
