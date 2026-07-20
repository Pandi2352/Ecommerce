import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar/Sidebar';
import { Navbar } from './Navbar';
import { SidebarProvider } from '@/hooks/useSidebar';
import { CartDrawer } from '@/features/cart/components/CartDrawer';

/** Admin shell: Sidebar + Navbar + routed content. */
export function MainLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-bg">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          <main className="flex-1 overflow-auto p-6 scrollbar-custom">
            <Outlet />
          </main>
        </div>
      </div>
      {/* CartDrawer must be inside the router so useNavigate() works */}
      <CartDrawer />
    </SidebarProvider>
  );
}

