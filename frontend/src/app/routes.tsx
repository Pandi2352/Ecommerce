import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Dashboard } from '@/pages/Dashboard';
import { KitchenSink } from '@/pages/KitchenSink';
import { Placeholder } from '@/pages/Placeholder';
import { CategoriesPage } from '@/features/categories';
import { ProductsPage } from '@/features/products';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequirePermission } from '@/features/auth/RequirePermission';
import { LoginPage } from '@/features/auth/LoginPage';
import { AcceptInvitePage } from '@/features/auth/AcceptInvitePage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage';
import { BusinessSettingsPage } from '@/features/settings/BusinessSettingsPage';
import { ProfilePage } from '@/features/profile';
import { UsersPage } from '@/features/users';
import { RolesPage, PermissionsPage } from '@/features/roles';
import { AuditLogPage } from '@/features/audit';
import {
  RouteErrorBoundary,
  NotFound,
  Forbidden,
  BadRequest,
  ServerError,
} from '@/pages/ErrorPage';
import type { ReactNode } from 'react';

/** Wrap a page element in a route-level permission guard (403 if not allowed). */
const g = (permission: string, element: ReactNode): ReactNode => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
);

export const router = createBrowserRouter([
  {
    // Everything under the admin shell requires authentication.
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
      { index: true, element: <Dashboard /> },
      { path: 'kitchen-sink', element: <KitchenSink /> },
      
      // Main
      { path: 'analytics', element: g('reports.read', <Placeholder title="Analytics" />) },
      { path: 'orders', element: g('orders.read', <Placeholder title="Orders" />) },
      { path: 'products', element: g('products.read', <ProductsPage />) },
      { path: 'products/new', element: g('products.write', <Placeholder title="Add Product" />) },
      { path: 'collections', element: g('products.read', <Placeholder title="Collections" />) },
      { path: 'categories', element: g('categories.read', <CategoriesPage />) },
      { path: 'inventory', element: g('inventory.read', <Placeholder title="Inventory" />) },
      { path: 'inventory/low', element: g('inventory.read', <Placeholder title="Low Stock" />) },
      { path: 'inventory/warehouses', element: g('inventory.read', <Placeholder title="Warehouses" />) },
      { path: 'orders/returns', element: g('orders.read', <Placeholder title="Returns" />) },
      { path: 'orders/abandoned', element: g('orders.read', <Placeholder title="Abandoned Carts" />) },
      { path: 'pages', element: <Placeholder title="Pages" /> },
      { path: 'customers', element: g('customers.read', <Placeholder title="Customers" />) },
      { path: 'marketing', element: g('marketing.read', <Placeholder title="Marketing" />) },
      { path: 'discounts', element: g('discounts.read', <Placeholder title="Discounts" />) },
      
      // Sales Channels
      { path: 'online-store', element: <Placeholder title="Online Store" /> },
      { path: 'mobile-app', element: <Placeholder title="Mobile App" /> },
      { path: 'pos-terminal', element: <Placeholder title="POS Terminal" /> },
      
      // Apps & Tools
      { path: 'reviews', element: g('reviews.read', <Placeholder title="Reviews" />) },
      { path: 'reports', element: g('reports.read', <Placeholder title="Reports" />) },
      { path: 'ai-studio', element: <Placeholder title="AI Studio" /> },
      { path: 'automation', element: <Placeholder title="Automation" /> },

      // Account & settings — everything self-service lives on the profile page
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/:id', element: g('users.read', <ProfilePage />) },
      { path: 'settings', element: <Navigate to="/profile" replace /> },
      { path: 'settings/business', element: g('settings.read', <BusinessSettingsPage />) },
      { path: 'users-roles', element: g('users.read', <UsersPage />) },
      { path: 'roles', element: g('roles.read', <RolesPage />) },
      { path: 'permissions', element: g('roles.read', <PermissionsPage />) },
      { path: 'audit', element: g('audit.read', <AuditLogPage />) },
      { path: 'integrations', element: <Placeholder title="Integrations" /> },
      { path: 'billing', element: <Placeholder title="Billing" /> },

      // Error page previews (for QA/design)
      { path: 'errors/403', element: <Forbidden /> },
      { path: 'errors/400', element: <BadRequest /> },
      { path: 'errors/500', element: <ServerError /> },

      // Catch-all 404 (rendered inside the admin shell)
      { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'accept', element: <AcceptInvitePage /> },
      { path: 'forgot', element: <ForgotPasswordPage /> },
      { path: 'reset', element: <ResetPasswordPage /> },
      { path: 'verify', element: <VerifyEmailPage /> },
    ],
  },
]);
