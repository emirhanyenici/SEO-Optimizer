'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Zap, Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#020202]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">SEO Optimizer</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/analyze"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
          >
            Try free
          </Link>
        </div>

        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#020202] px-4 py-4 flex flex-col gap-4">
          <a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#how-it-works" className="text-gray-400 hover:text-white text-sm transition-colors" onClick={() => setMobileOpen(false)}>How it works</a>
          <a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors" onClick={() => setMobileOpen(false)}>FAQ</a>
          <Link
            href="/analyze"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors text-center"
            onClick={() => setMobileOpen(false)}
          >
            Try free
          </Link>
        </div>
      )}
    </nav>
  );
}
