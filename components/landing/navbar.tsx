"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#2E2C28] bg-[#0F0E0C]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">
            <span className="text-[#F59E0B]">Maste</span>
            <span className="text-white">X</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#ranks" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
            Rankings
          </Link>
          <Link href="#pricing" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
            Pricing
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-[#9CA3AF] hover:text-white transition-colors px-4 py-2"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm font-semibold bg-[#F59E0B] hover:bg-[#D97706] text-black px-5 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-[#9CA3AF] hover:text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[#2E2C28] bg-[#0F0E0C] px-4 py-4 space-y-3 animate-fade-in">
          <Link href="#features" className="block text-sm text-[#9CA3AF] hover:text-white py-2" onClick={() => setOpen(false)}>
            Features
          </Link>
          <Link href="#ranks" className="block text-sm text-[#9CA3AF] hover:text-white py-2" onClick={() => setOpen(false)}>
            Rankings
          </Link>
          <Link href="#pricing" className="block text-sm text-[#9CA3AF] hover:text-white py-2" onClick={() => setOpen(false)}>
            Pricing
          </Link>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="block text-center text-sm border border-[#2E2C28] text-white py-2.5 rounded-lg"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="block text-center text-sm font-semibold bg-[#F59E0B] text-black py-2.5 rounded-lg"
              onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
