import React from 'react';

export default function FinPilotEmblem({ className = "h-8 w-8" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 36 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="36" height="36" rx="8" fill="#18191B"/>
      {/* Minimal compass needle / geometric financial precision mark */}
      <path 
        d="M18 7L24 18L18 29L12 18L18 7Z" 
        stroke="#FBFBF9" 
        strokeWidth="1.75" 
        strokeLinejoin="round"
      />
      <circle cx="18" cy="18" r="2.5" fill="#6D28D9"/>
      <line x1="18" y1="12" x2="18" y2="15.5" stroke="#FBFBF9" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="20.5" x2="18" y2="24" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
