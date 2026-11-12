import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0C] text-[#F7F5F0] w-full max-w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
