import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Phone,
  User,
  Lock,
  Globe,
  IndianRupee,
  ChevronDown,
} from 'lucide-react';
import { useCart } from '@/cart/CartContext';
import { useAuth } from '@/auth/AuthContext';
import { useStorefrontConfig } from '@/app/StorefrontConfigContext';
import { useCategories } from '@/app/CategoryContext';
import { useState } from 'react';

export function Layout() {
  const { count } = useCart();
  const { user } = useAuth();
  const { config } = useStorefrontConfig();
  const { categories, selectedCategory, setSelectedCategory } = useCategories();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const storeName = config?.storeName || 'MAXSHOP';
  const logoUrl = config?.logoUrl;

  const navItems = [
    { label: 'HOME', id: null },
    { label: 'ALL PRODUCTS', id: null },
    ...categories.slice(0, 6).map((c) => ({ label: c.name.toUpperCase(), id: c.id })),
  ];

  return (
    <div className="flex min-h-full flex-col bg-bg text-text">
      {/* ── 1. TOP UTILITY BAR ────────────────────────────────────────────── */}
      <div className="border-b border-border bg-surface text-xs text-text-secondary">
        <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-between px-2 sm:px-4">
          {/* Ticker Notice */}
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-white font-bold px-1.5 py-0.5 text-[10px] uppercase rounded-xs">
              This Week
            </span>
            <span className="truncate">
              Special deals and new arrivals across all store categories.
            </span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-4 text-[11px] font-medium">
            {user ? (
              <Link to="/account" className="flex items-center gap-1 hover:text-danger">
                <User className="h-3 w-3" /> {user.name.split(' ')[0]}
              </Link>
            ) : (
              <Link to="/auth/login" className="flex items-center gap-1 hover:text-danger">
                <User className="h-3 w-3" /> Sign in
              </Link>
            )}
            <Link to="/checkout" className="flex items-center gap-1 hover:text-danger">
              <Lock className="h-3 w-3" /> Checkout
            </Link>
            <span className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1 hover:text-danger cursor-pointer">
              <Globe className="h-3 w-3" /> English <ChevronDown className="h-3 w-3" />
            </div>
            <div className="flex items-center gap-1 hover:text-danger cursor-pointer">
              <IndianRupee className="h-3 w-3" /> INR <ChevronDown className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN HEADER ───────────────────────────────────────────────── */}
      <header className="bg-surface py-5 border-b border-border">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-2 sm:px-4 gap-6">
          {/* Left: Search with Dynamic DB Category Select */}
          <div className="flex flex-1 max-w-md items-center border-2 border-border rounded-sm overflow-hidden focus-within:border-danger transition-colors">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="bg-surface-2 px-3 py-2 text-xs font-semibold border-r border-border outline-none text-text-secondary cursor-pointer max-w-[140px] truncate"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for products..."
              className="w-full bg-surface px-3 py-2 text-xs outline-none"
            />
            <button className="bg-text text-white p-2.5 hover:bg-danger transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Center: Store Brand Logo */}
          <Link to="/" className="flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-10 max-w-44 object-contain" />
            ) : (
              <div className="text-center">
                <span
                  className="text-3xl font-black tracking-tight uppercase"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span className="text-text">{storeName.slice(0, 3)}</span>
                  <span className="text-danger">{storeName.slice(3) || 'SHOP'}</span>
                </span>
              </div>
            )}
          </Link>

          {/* Right: Phone / Hotline Widget */}
          <div className="flex items-center gap-3 text-right hidden md:flex shrink-0">
            <div className="h-10 w-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
              <Phone className="h-5 w-5 fill-danger text-danger" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                HOTLINE:
              </p>
              <p className="text-xs font-black text-danger tracking-wide">
                {config?.supportPhone || '(801) 2345 - 6789'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── 3. PRIMARY NAVIGATION BAR (Dark bar with Red angled tabs) ────── */}
      <nav className="bg-maxshop-dark border-b-2 border-danger text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-2 sm:px-4">
          {/* Dynamic Nav Links */}
          <div className="flex items-center overflow-x-auto no-scrollbar">
            {navItems.map((item, idx) => {
              const isActive =
                (item.id === null &&
                  selectedCategory === null &&
                  location.pathname === '/' &&
                  idx === 0) ||
                (item.id !== null && selectedCategory === item.id);
              return (
                <button
                  key={item.label}
                  onClick={() => setSelectedCategory(item.id)}
                  className={`maxshop-nav-tab whitespace-nowrap ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Cart Button Ribbon */}
          <Link
            to="/cart"
            className="maxshop-ribbon bg-danger hover:bg-danger/90 text-white flex items-center gap-2 py-2 px-5 cursor-pointer shrink-0"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="font-extrabold text-xs">MY CART</span>
            <span className="bg-white text-danger font-bold rounded-xs px-1.5 py-0.2 text-xs ml-1">
              {count}
            </span>
          </Link>
        </div>
      </nav>

      {/* ── 4. MAIN BODY CONTAINER ───────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-2 sm:px-4 py-6">
        <Outlet />
      </main>

      {/* ── 5. FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface text-xs text-text-secondary mt-12 py-8">
        <div className="mx-auto max-w-[1440px] px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {storeName}. All rights reserved. Powered by Generic Store Engine.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-danger">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-danger">
              Terms of Service
            </Link>
            <Link to="/" className="hover:text-danger">
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
