import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Dashboard } from '@/pages/Dashboard';
import { KitchenSink } from '@/pages/KitchenSink';
import { Placeholder } from '@/pages/Placeholder';
import { CategoriesPage } from '@/features/categories';
import { BrandsPage } from '@/features/brands';
import { VendorsPage } from '@/features/vendors';
import { ProductsPage, ProductEditorPage } from '@/features/products';
import { CollectionsPage } from '@/features/collections';
import { PagesPage } from '@/features/pages';
import { ProductFieldsPage } from '@/features/attributes';
import { StockPage, LowStockPage, WarehousesPage } from '@/features/inventory';
import { DiscountsPage } from '@/features/discounts';
import { CustomersPage } from '@/features/customers';
import { CartPage } from '@/features/cart';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequirePermission } from '@/features/auth/RequirePermission';
import { LoginPage } from '@/features/auth/LoginPage';
import { AcceptInvitePage } from '@/features/auth/AcceptInvitePage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage';
import { BusinessSettingsPage } from '@/features/settings/BusinessSettingsPage';
import { StorefrontSettingsPage } from '@/features/settings/StorefrontSettingsPage';
import { ProfilePage } from '@/features/profile';
import { UsersPage } from '@/features/users';
import { RolesPage, PermissionsPage } from '@/features/roles';
import { AuditLogPage } from '@/features/audit';
import { OrdersPage, ReturnsPage, AbandonedCartsPage } from '@/features/orders';
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
          { path: 'orders', element: g('orders.read', <OrdersPage />) },
          { path: 'products', element: g('products.read', <ProductsPage />) },
          { path: 'products/new', element: g('products.write', <ProductEditorPage />) },
          { path: 'products/:id/edit', element: g('products.write', <ProductEditorPage />) },
          { path: 'collections', element: g('products.read', <CollectionsPage />) },
          { path: 'categories', element: g('categories.read', <CategoriesPage />) },
          { path: 'brands', element: g('brands.read', <BrandsPage />) },
          { path: 'vendors', element: g('vendors.read', <VendorsPage />) },
          { path: 'product-fields', element: g('attributes.read', <ProductFieldsPage />) },
          { path: 'inventory', element: g('inventory.read', <StockPage />) },
          { path: 'inventory/low', element: g('inventory.read', <LowStockPage />) },
          { path: 'inventory/warehouses', element: g('inventory.read', <WarehousesPage />) },
          { path: 'orders/returns', element: g('orders.read', <ReturnsPage />) },
          { path: 'orders/abandoned', element: g('orders.read', <AbandonedCartsPage />) },
          { path: 'pages', element: g('content.read', <PagesPage />) },
          { path: 'customers', element: g('customers.read', <CustomersPage />) },
          { path: 'marketing', element: g('marketing.read', <Placeholder title="Marketing" />) },
          { path: 'discounts', element: g('discounts.read', <DiscountsPage />) },
          { path: 'cart', element: <CartPage /> },

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
          { path: 'settings/storefront', element: g('settings.read', <StorefrontSettingsPage />) },
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
