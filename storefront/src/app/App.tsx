import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/cart/CartContext';
import { AuthProvider } from '@/auth/AuthContext';
import { StorefrontConfigProvider } from './StorefrontConfigContext';
import { CategoryProvider } from './CategoryContext';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StorefrontConfigProvider>
          <CategoryProvider>
            <CartProvider>
              <AppRoutes />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '13px',
                  },
                }}
              />
            </CartProvider>
          </CategoryProvider>
        </StorefrontConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
