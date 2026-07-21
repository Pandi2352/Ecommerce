import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/cart/CartContext';
import { StorefrontConfigProvider } from './StorefrontConfigContext';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter>
      <StorefrontConfigProvider>
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
      </StorefrontConfigProvider>
    </BrowserRouter>
  );
}
