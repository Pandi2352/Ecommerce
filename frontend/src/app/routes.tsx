import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Dashboard } from '@/pages/Dashboard';
import { KitchenSink } from '@/pages/KitchenSink';
import { Login } from '@/pages/Login';
import { Placeholder } from '@/pages/Placeholder';
import { CategoriesPage } from '@/features/categories/CategoriesPage';
import {
  RouteErrorBoundary,
  NotFound,
  Forbidden,
  BadRequest,
  ServerError,
} from '@/pages/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'kitchen-sink', element: <KitchenSink /> },
      
      // Main
      { path: 'analytics', element: <Placeholder title="Analytics" /> },
      { path: 'orders', element: <Placeholder title="Orders" /> },
      { path: 'products', element: <Placeholder title="All Products" /> },
      { path: 'products/new', element: <Placeholder title="Add Product" /> },
      { path: 'collections', element: <Placeholder title="Collections" /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'inventory', element: <Placeholder title="Inventory" /> },
      { path: 'inventory/low', element: <Placeholder title="Low Stock" /> },
      { path: 'inventory/warehouses', element: <Placeholder title="Warehouses" /> },
      { path: 'orders/returns', element: <Placeholder title="Returns" /> },
      { path: 'orders/abandoned', element: <Placeholder title="Abandoned Carts" /> },
      { path: 'pages', element: <Placeholder title="Pages" /> },
      { path: 'customers', element: <Placeholder title="Customers" /> },
      { path: 'marketing', element: <Placeholder title="Marketing" /> },
      { path: 'discounts', element: <Placeholder title="Discounts" /> },
      
      // Sales Channels
      { path: 'online-store', element: <Placeholder title="Online Store" /> },
      { path: 'mobile-app', element: <Placeholder title="Mobile App" /> },
      { path: 'pos-terminal', element: <Placeholder title="POS Terminal" /> },
      
      // Apps & Tools
      { path: 'reviews', element: <Placeholder title="Reviews" /> },
      { path: 'reports', element: <Placeholder title="Reports" /> },
      { path: 'ai-studio', element: <Placeholder title="AI Studio" /> },
      { path: 'automation', element: <Placeholder title="Automation" /> },
      
      // Settings
      { path: 'settings', element: <Placeholder title="Settings" /> },
      { path: 'users-roles', element: <Placeholder title="Users & Roles" /> },
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
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [{ path: 'login', element: <Login /> }],
  },
]);
