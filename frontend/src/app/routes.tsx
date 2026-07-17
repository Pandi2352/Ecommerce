import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Dashboard } from '@/pages/Dashboard';
import { KitchenSink } from '@/pages/KitchenSink';
import { Login } from '@/pages/Login';
import { Placeholder } from '@/pages/Placeholder';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'kitchen-sink', element: <KitchenSink /> },
      { path: 'products', element: <Placeholder title="Products" /> },
      { path: 'orders', element: <Placeholder title="Orders" /> },
      { path: 'customers', element: <Placeholder title="Customers" /> },
      { path: 'reports', element: <Placeholder title="Reports" /> },
      { path: 'settings', element: <Placeholder title="Settings" /> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [{ path: 'login', element: <Login /> }],
  },
]);
