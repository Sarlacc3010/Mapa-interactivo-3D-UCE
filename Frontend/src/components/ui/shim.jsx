import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to merge classes
export function cn(...inputs) { return twMerge(clsx(inputs)); }

// --- BUTTON ---
export const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  const variants = {
    default: "bg-[#D9232D] text-white hover:bg-[#b81d26] shadow-sm",
    outline: "border border-gray-200 bg-white text-[#1e3a8a] hover:bg-gray-50",
    ghost: "hover:bg-gray-100 text-gray-700",
  };
  return <button ref={ref} className={cn("inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none disabled:opacity-50 active:scale-95", variants[variant || "default"], className)} {...props} />;
});

// --- INPUT (Text field) ---
export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D9232D] transition-shadow", className)} {...props} />
));

// --- LABEL (Text label) - NEW! ---
export const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
));

// --- BADGE ---
export const Badge = ({ className, variant, ...props }) => {
  const variants = {
    default: "bg-[#D9232D] text-white border-transparent",
    outline: "border border-gray-200 text-gray-700 bg-transparent",
    secondary: "bg-gray-100 text-gray-900 border-transparent hover:bg-gray-200",
  };
  return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant || "default"], className)} {...props} />;
};

// --- SCROLL AREA ---
export const ScrollArea = ({ className, children }) => (
  <div className={cn("relative overflow-auto custom-scrollbar", className)}>{children}</div>
);

// --- CARD ---
export const Card = ({ className, children }) => <div className={cn("rounded-xl border bg-white shadow-sm", className)}>{children}</div>;