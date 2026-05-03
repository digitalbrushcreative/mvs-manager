import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';
import { AdminLayout } from '../components/Layouts/AdminLayout';
import { ParentLayout } from '../components/Layouts/ParentLayout';
import { Placeholder } from '../components/Placeholder/Placeholder';

import { LoginPage } from '../features/auth/Login';

import { TripsLayout } from '../features/trips/TripsLayout';
import { TripDetailLayout } from '../features/trips/TripDetailLayout';
import { TripsDashboardPage } from '../features/trips/routes/Dashboard';
import { ActiveTripsPage } from '../features/trips/routes/ActiveTrips';
import { PastTripsPage } from '../features/trips/routes/PastTrips';
import { TripOverviewPage } from '../features/trips/routes/TripOverview';
import { TripsRosterPage } from '../features/trips/routes/Roster';
import { TripsItineraryPage } from '../features/trips/routes/Itinerary';
import { TripsActivitiesPage } from '../features/trips/routes/Activities';
import { TripsPaymentsPage } from '../features/trips/routes/Payments';
import { TripsDocumentsPage } from '../features/trips/routes/Documents';
import { TripsBookingsPage } from '../features/trips/routes/Bookings';
import { TripsCommunicationsPage } from '../features/trips/routes/Communications';
import { TripsInterestPage } from '../features/trips/routes/Interest';
import { TripsReportsPage } from '../features/trips/routes/Reports';

import { StaffLayout } from '../features/staff/StaffLayout';
import { StaffDirectoryPage } from '../features/staff/routes/Directory';

import { ClubsLayout } from '../features/clubs/ClubsLayout';
import { ClubsDashboardPage } from '../features/clubs/routes/Dashboard';
import { ClubsListPage } from '../features/clubs/routes/List';
import { ClubsMembersPage } from '../features/clubs/routes/Members';
import { ClubsTripsPage } from '../features/clubs/routes/Trips';
import { ClubDetailPage } from '../features/clubs/routes/Detail';

import { ParentLandingPage } from '../features/parent/routes/Landing';
import { ParentDashboardPage } from '../features/parent/routes/Dashboard';
import { ParentTripDetailPage } from '../features/parent/routes/TripDetail';

import { ForbiddenPage, NotFoundPage } from '../features/error/Forbidden';
import { ErrorBoundary } from '../features/error/ErrorBoundary';

export const router = createBrowserRouter([
  {
    element: <Outlet />,
    errorElement: <ErrorBoundary />,
    children: [
  { path: '/', element: <Navigate to="/admin/trips" replace /> },

  { path: '/auth/login', element: <LoginPage /> },

  // Admin (school staff) area
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="trips" replace /> },

      // Trip Manager — portfolio (Overview · Active Trips · Past Trips)
      {
        path: 'trips',
        element: <TripsLayout />,
        children: [
          { index: true, element: <TripsDashboardPage /> },
          { path: 'active', element: <ActiveTripsPage /> },
          { path: 'past', element: <PastTripsPage /> },
        ],
      },

      // Trip Manager — per-trip detail (own shell with TripBanner + tab strip)
      {
        path: 'trips/:tripId',
        element: <TripDetailLayout />,
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: 'overview', element: <TripOverviewPage /> },
          { path: 'roster', element: <TripsRosterPage /> },
          { path: 'itinerary', element: <TripsItineraryPage /> },
          { path: 'activities', element: <TripsActivitiesPage /> },
          { path: 'payments', element: <TripsPaymentsPage /> },
          { path: 'documents', element: <TripsDocumentsPage /> },
          { path: 'bookings', element: <TripsBookingsPage /> },
          { path: 'communications', element: <TripsCommunicationsPage /> },
          { path: 'interest', element: <TripsInterestPage /> },
          { path: 'reports', element: <TripsReportsPage /> },
        ],
      },

      // Staff Directory
      {
        path: 'staff',
        element: <StaffLayout />,
        children: [
          { index: true, element: <StaffDirectoryPage /> },
          { path: 'new', element: <StaffDirectoryPage creating /> },
          { path: ':staffId', element: <StaffDirectoryPage /> },
        ],
      },

      // Club Manager
      {
        path: 'clubs',
        element: <ClubsLayout />,
        children: [
          { index: true, element: <ClubsDashboardPage /> },
          { path: 'list', element: <ClubsListPage /> },
          { path: 'members', element: <ClubsMembersPage /> },
          { path: 'trips', element: <ClubsTripsPage /> },
          { path: ':clubId', element: <ClubDetailPage /> },
        ],
      },

      // Future modules
      { path: 'facilities', element: <Placeholder title="Facilities" description="Bookings for school venues and resources." /> },
      { path: 'transport', element: <Placeholder title="Transport" description="Vehicle scheduling and driver assignments." /> },
      { path: 'attendance', element: <Placeholder title="Attendance" description="Daily and trip-level attendance tracking." /> },
      { path: 'suppliers', element: <Placeholder title="Suppliers" description="Travel partners, vendors, and contracts." /> },
    ],
  },

  // Parent area
  {
    path: '/parent',
    element: <ParentLayout />,
    children: [
      { index: true, element: <ParentLandingPage /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute roles={['parent', 'admin']}>
            <ParentDashboardPage />
          </ProtectedRoute>
        ),
      },
      { path: 'trip/:tripId', element: <ParentTripDetailPage /> },
    ],
  },

  // Error routes
  { path: '/forbidden', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
