import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const NAV = [
  { path: "/", label: "Trang chủ" },
  { path: "/about", label: "Giới thiệu" },
  { path: "/services", label: "Dịch vụ" },
  { path: "/recruit", label: "Đào tạo" },
  { path: "/booking", label: "Đặt lịch" },
  { path: "/contact", label: "Liên hệ" },
];

export default function Navbar() {
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  // Hide nav on admin routes
  if (loc.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-md border-b border-velvet/50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo size="bar" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV.map((n) => (
            <Link
              key={n.path}
              to={n.path}
              className={`font-body text-base tracking-wide transition-colors ${
                loc.pathname === n.path
                  ? "text-arcane border-b border-arcane pb-0.5"
                  : "text-lilac/70 hover:text-mist"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-lilac p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Menu"
          aria-expanded={open}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-velvet/95 backdrop-blur-md border-t border-velvet">
          <div className="px-4 py-4 space-y-3">
            {NAV.map((n) => (
              <Link
                key={n.path}
                to={n.path}
                onClick={() => setOpen(false)}
                className={`block font-body text-base tracking-wide ${
                  loc.pathname === n.path ? "text-arcane" : "text-lilac/70 hover:text-mist"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
