'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X, Sparkles } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
}

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide navigation on Splash or Onboarding screens
  if (pathname === '/' || pathname === '/onboarding') {
    return null;
  }

  const items: NavItem[] = [
    { label: 'HOME', href: '/feed' },
    { label: 'CHATS', href: '/chat' },
    { label: 'GAMES', href: '/games' },
    { label: 'PROFILE', href: '/profile' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo */}
        <Link href="/feed" className="flex items-center gap-2 flex-none">
          <Heart className="w-5 h-5 text-primary fill-primary animate-pulse" />
          <span className="text-base font-black text-dark uppercase tracking-wider" style={{ fontFamily: 'var(--font-headline)' }}>
            Find Your <span className="text-primary font-black">Vibe</span>
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[10px] font-black uppercase tracking-widest transition-all relative py-2 ${
                  isActive
                    ? 'text-primary font-black'
                    : 'text-gray-500 hover:text-dark'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary animate-fadeIn" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Account Indicator */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-secondary/10 px-3 py-1.5 border border-secondary text-[9px] font-black uppercase tracking-wider text-secondary">
            <Sparkles className="w-3 h-3 text-secondary fill-secondary" />
            <span>Vibe Premium</span>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-500 hover:bg-gray-50 hover:text-dark transition-all cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-hairline bg-white animate-fadeIn">
          <nav className="flex flex-col p-4 space-y-2">
            {items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  href={item.href}
                  className={`px-4 py-3 text-xs font-black uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-primary/5 text-primary'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-dark'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navigation;
