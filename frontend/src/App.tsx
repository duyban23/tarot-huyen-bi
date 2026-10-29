import { lazy, Suspense, useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import PhoneFrame from "./components/PhoneFrame";
import StarField from "./components/StarField";
import FloatingCTA from "./components/FloatingCTA";
import FloatingContact from "./components/FloatingContact";
import BookingPage from "./pages/BookingPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import RecruitPage from "./pages/RecruitPage";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));

/* ── Scroll to top on route change ── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

/* ── 404 page ── */
function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-7xl font-display text-candle-gold mb-4">404</h1>
      <p className="font-body text-arcane text-xl">Trang này không tồn tại trong vũ trụ...</p>
      <Link to="/" className="mt-8 px-6 py-3 rounded-full bg-candle-gold text-void font-display text-sm tracking-wider hover:opacity-90 transition-opacity">
        VỀ TRANG CHỦ
      </Link>
    </div>
  );
}

/* ── Admin fallback loader ── */
function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-candle-gold font-display text-xl">Đang tải...</div>
    </div>
  );
}

export default function App() {
  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />
      <ScrollToTop />
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/phone" element={<PhoneFrame><BookingPage /></PhoneFrame>} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/recruit" element={<RecruitPage />} />
          <Route path="/admin/login" element={
            <Suspense fallback={<AdminFallback />}>
              <AdminLogin />
            </Suspense>
          } />
          <Route path="/admin" element={
            <Suspense fallback={<AdminFallback />}>
              <AdminDashboard />
            </Suspense>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <FloatingCTA />
      <FloatingContact />
    </div>
  );
}
