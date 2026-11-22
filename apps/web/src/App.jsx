import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';

// Role Guard
import RoleGuard from './components/auth/RoleGuard';

// Navigation & Layout Components
import ConsoleHeader from './components/navigation/ConsoleHeader';
import CustomerBottomNav from './components/navigation/CustomerBottomNav';
import ProviderBottomNav from './components/navigation/ProviderBottomNav';
import CustomerDrawer from './components/navigation/CustomerDrawer';

// Authentication Feature Screens
import AuthWelcome from './features/auth/AuthWelcome';
import CustomerAuth from './features/auth/CustomerAuth';
import PartnerAuth from './features/auth/PartnerAuth';
import AdminLogin from './features/admin/AdminLogin';

// Customer Feature Screens
import CustomerHome from './features/customer/CustomerHome';
import CustomerExplore from './features/customer/CustomerExplore';
import ChefProfile from './features/customer/ChefProfile';
import BookingStep1Requirements from './features/booking/BookingStep1Requirements';
import BookingStep2ServiceMode from './features/booking/BookingStep2ServiceMode';
import BookingStep3Quotation from './features/booking/BookingStep3Quotation';
import BookingStep4Payment from './features/booking/BookingStep4Payment';
import BookingStep5Confirmed from './features/booking/BookingStep5Confirmed';
import CustomerLiveTracking from './features/tracking/CustomerLiveTracking';
import HostReviewSubmission from './features/reviews/HostReviewSubmission';
import CustomerBookings from './features/customer/CustomerBookings';
import CustomerFavourites from './features/customer/CustomerFavourites';
import CustomerProfile from './features/customer/CustomerProfile';

// Provider Feature Screens
import ProviderDashboard from './features/provider/ProviderDashboard';
import ProviderOnboardingWizard from './features/provider/ProviderOnboardingWizard';
import ProviderChat from './features/provider/ProviderChat';
import ProviderWallet from './features/provider/ProviderWallet';
import ProviderCalendar from './features/provider/ProviderCalendar';
import ProviderEventDay from './features/provider/ProviderEventDay';
import ProviderAlerts from './features/provider/ProviderAlerts';
import ProviderServices from './features/provider/ProviderServices';
import ProviderBookings from './features/provider/ProviderBookings';
import ProviderProfile from './features/provider/ProviderProfile';

// Platform Admin Feature Screens
import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import AdminVerificationQueue from './features/admin/AdminVerificationQueue';
import AdminBookings from './features/admin/AdminBookings';
import AdminFinance from './features/admin/AdminFinance';
import AdminUsers from './features/admin/AdminUsers';
import AdminAuditLogs from './features/admin/AdminAuditLogs';

function RootRedirect() {
  const { isAuthenticated, userType } = useAuthStore();

  if (!isAuthenticated || !userType) {
    return <Navigate to="/auth/welcome" replace />;
  }
  if (userType === 'CUSTOMER') {
    return <Navigate to="/customer/home" replace />;
  }
  if (userType === 'PROVIDER') {
    return <Navigate to="/provider/dashboard" replace />;
  }
  if (userType === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/auth/welcome" replace />;
}

function AppContent() {
  const location = useLocation();
  const { isAuthenticated, userType } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Authentication & Console path detection
  const isAuthPage = location.pathname.startsWith('/auth') || location.pathname === '/admin/login';
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  const isProviderRoute = location.pathname.startsWith('/provider');
  const isOnboarding = location.pathname.startsWith('/provider/onboarding');
  const isBookingFlow = location.pathname.startsWith('/booking');
  const isTrackingOrReview = location.pathname.startsWith('/tracking') || location.pathname.startsWith('/review');

  // Control Header & Bottom Navigation presentation
  const showHeader = !isAuthPage && !isAdminRoute;
  const showCustomerBottomNav = isAuthenticated && userType === 'CUSTOMER' && !isBookingFlow && !isTrackingOrReview && !isAuthPage;
  const showProviderBottomNav = isAuthenticated && userType === 'PROVIDER' && !isOnboarding && location.pathname !== '/provider/chat' && !isAuthPage;

  return (
    <div className="min-h-screen bg-white text-[#172033] flex flex-col font-sora">
      {showHeader && <ConsoleHeader onOpenDrawer={() => setDrawerOpen(true)} />}

      <CustomerDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className={`flex-1 flex flex-col ${showHeader ? 'pt-16' : ''}`}>
        <Routes>
          {/* Default Root: Automatic Role-Based Redirection */}
          <Route path="/" element={<RootRedirect />} />

          {/* ======================================================== */}
          {/* PUBLIC AUTHENTICATION ROUTES (Section 2 & 3 Mandate)     */}
          {/* ======================================================== */}
          <Route path="/auth/welcome" element={<AuthWelcome />} />
          <Route path="/auth/customer" element={<CustomerAuth />} />
          <Route path="/auth/partner" element={<PartnerAuth />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ======================================================== */}
          {/* CUSTOMER CONSOLE ROUTES (Role-Guarded: CUSTOMER Only)     */}
          {/* ======================================================== */}
          <Route element={<RoleGuard allowedRoles={['CUSTOMER']} />}>
            <Route path="/customer/home" element={<CustomerHome />} />
            <Route path="/customer" element={<Navigate to="/customer/home" replace />} />
            <Route path="/explore" element={<CustomerExplore />} />
            <Route path="/chef/:id" element={<ChefProfile />} />
            <Route path="/booking/step-1" element={<BookingStep1Requirements />} />
            <Route path="/booking/step-2" element={<BookingStep2ServiceMode />} />
            <Route path="/booking/step-3" element={<BookingStep3Quotation />} />
            <Route path="/booking/step-4" element={<BookingStep4Payment />} />
            <Route path="/booking/step-5" element={<BookingStep5Confirmed />} />
            <Route path="/tracking/:id" element={<CustomerLiveTracking />} />
            <Route path="/review/:id" element={<HostReviewSubmission />} />
            <Route path="/bookings" element={<CustomerBookings />} />
            <Route path="/favourites" element={<CustomerFavourites />} />
            <Route path="/profile" element={<CustomerProfile />} />
          </Route>

          {/* ======================================================== */}
          {/* PROVIDER CONSOLE ROUTES (Role-Guarded: PROVIDER Only)     */}
          {/* ======================================================== */}
          <Route element={<RoleGuard allowedRoles={['PROVIDER']} />}>
            <Route path="/provider" element={<Navigate to="/provider/dashboard" replace />} />
            <Route path="/provider/dashboard" element={<ProviderDashboard />} />
            <Route path="/provider/onboarding" element={<Navigate to="/provider/onboarding/step-1" replace />} />
            <Route path="/provider/onboarding/step-:stepNumber" element={<ProviderOnboardingWizard />} />
            <Route path="/provider/chat" element={<ProviderChat />} />
            <Route path="/provider/wallet" element={<ProviderWallet />} />
            <Route path="/provider/calendar" element={<ProviderCalendar />} />
            <Route path="/provider/event-day" element={<ProviderEventDay />} />
            <Route path="/provider/alerts" element={<ProviderAlerts />} />
            <Route path="/provider/services" element={<ProviderServices />} />
            <Route path="/provider/bookings" element={<ProviderBookings />} />
            <Route path="/provider/profile" element={<ProviderProfile />} />
          </Route>

          {/* ======================================================== */}
          {/* ADMINISTRATOR PORTAL ROUTES (Role-Guarded: ADMIN Only)    */}
          {/* ======================================================== */}
          <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="verification" element={<AdminVerificationQueue />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="audit" element={<AdminAuditLogs />} />
            </Route>
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </main>

      {/* 5-Item Persistent Bottom Navigations (Strictly Per Account Role) */}
      {showCustomerBottomNav && <CustomerBottomNav />}
      {showProviderBottomNav && <ProviderBottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
