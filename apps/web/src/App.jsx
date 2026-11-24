import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import Guard, { MarketplaceOnly } from './components/layout/Guard';
import CustomerLayout from './components/layout/CustomerLayout';
import ProviderLayout from './components/layout/ProviderLayout';
import { Spinner } from './components/ui';
import Home from './features/customer/Home';
import Explore from './features/customer/Explore';

// Code-split everything except the landing screens.
const AuthPage = lazy(() => import('./features/auth/AuthPage'));
const CompleteAccount = lazy(() => import('./features/auth/CompleteAccount'));
const ProviderProfile = lazy(() => import('./features/customer/ProviderProfile'));
const BookingRequest = lazy(() => import('./features/customer/BookingRequest'));
const Favourites = lazy(() => import('./features/customer/Favourites'));
const Profile = lazy(() => import('./features/customer/Profile'));
const BookingList = lazy(() => import('./features/bookings/BookingList'));
const BookingDetail = lazy(() => import('./features/bookings/BookingDetail'));
const Notifications = lazy(() => import('./features/notifications/Notifications'));
const ProviderDashboard = lazy(() => import('./features/provider/ProviderDashboard'));
const ProviderSetup = lazy(() => import('./features/provider/ProviderSetup'));
const ProviderServicesPage = lazy(() => import('./features/provider/ProviderPages').then((m) => ({ default: m.ProviderServicesPage })));
const ProviderProfilePage = lazy(() => import('./features/provider/ProviderPages').then((m) => ({ default: m.ProviderProfilePage })));
const ProviderCalendarPage = lazy(() => import('./features/provider/ProviderPages').then((m) => ({ default: m.ProviderCalendarPage })));
const ProviderPromotions = lazy(() => import('./features/provider/ProviderPromotions'));
const promo = (name) => lazy(() => import('./features/admin/AdminPromotions').then((m) => ({ default: m[name] })));
const AdminCampaigns = promo('AdminCampaigns');
const AdminProviderPromotions = promo('AdminProviderPromotions');
const AdminFeatured = promo('AdminFeatured');
const AdminBannerAnalytics = promo('AdminBannerAnalytics');
const AdminMedia = promo('AdminMedia');
const admin = (name) => lazy(() => import('./features/admin/AdminConsole').then((m) => ({ default: m[name] })));
const AdminLayout = admin('AdminLayout');
const AdminDashboard = admin('AdminDashboard');
const AdminProviders = admin('AdminProviders');
const AdminCustomers = admin('AdminCustomers');
const AdminBookings = admin('AdminBookings');
const AdminFinance = admin('AdminFinance');
const AdminTeam = admin('AdminTeam');
const AdminSettings = admin('AdminSettings');
const AdminAudit = admin('AdminAudit');

function LegacyProviderRedirect() {
  const { id } = useParams();
  return <Navigate to={`/p/${id}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner className="min-h-[50vh]" />}>
        <Routes>
          {/* Authentication */}
          <Route path="/auth/customer" element={<AuthPage role="CUSTOMER" />} />
          <Route path="/auth/partner" element={<AuthPage role="PROVIDER" />} />
          <Route path="/admin/login" element={<AuthPage role="ADMIN" />} />
          <Route path="/auth/complete" element={<CompleteAccount />} />
          <Route path="/auth/*" element={<Navigate to="/auth/customer" replace />} />

          {/* Customer marketplace: browsing is public, personal pages require a customer account */}
          <Route element={<CustomerLayout />}>
            <Route element={<MarketplaceOnly />}>
              <Route index element={<Home />} />
              <Route path="explore" element={<Explore />} />
              <Route path="p/:id" element={<ProviderProfile />} />
            </Route>
            <Route element={<Guard roles={['CUSTOMER']} />}>
              <Route path="book/:providerId" element={<BookingRequest />} />
              <Route path="bookings" element={<BookingList viewer="CUSTOMER" />} />
              <Route path="bookings/:id" element={<BookingDetail viewer="CUSTOMER" />} />
              <Route path="favourites" element={<Favourites />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Route>

          {/* Service provider console */}
          <Route path="provider" element={<Guard roles={['PROVIDER']} />}>
            <Route element={<ProviderLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ProviderDashboard />} />
              <Route path="setup" element={<ProviderSetup />} />
              <Route path="bookings" element={<BookingList viewer="PROVIDER" />} />
              <Route path="bookings/:id" element={<BookingDetail viewer="PROVIDER" />} />
              <Route path="services" element={<ProviderServicesPage />} />
              <Route path="calendar" element={<ProviderCalendarPage />} />
              <Route path="profile" element={<ProviderProfilePage />} />
              <Route path="promotions" element={<ProviderPromotions />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>

          {/* Platform administration (invite-only) */}
          <Route path="admin" element={<Guard roles={['ADMIN']} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="providers" element={<AdminProviders />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="campaigns" element={<AdminCampaigns />} />
              <Route path="promotions" element={<AdminProviderPromotions />} />
              <Route path="featured" element={<AdminFeatured />} />
              <Route path="banner-analytics" element={<AdminBannerAnalytics />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>

          {/* Old URLs */}
          <Route path="/customer/*" element={<Navigate to="/" replace />} />
          <Route path="/chef/:id" element={<LegacyProviderRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
