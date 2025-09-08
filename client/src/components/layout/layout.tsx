import { ReactNode } from "react";
import Footer from "@/components/layout/footer";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  className?: string;
}

export default function Layout({ 
  children, 
  showFooter = true, 
  className = "" 
}: LayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {/* Main content area - grows to fill available space */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      {/* Footer anchored to bottom */}
      {showFooter && <Footer />}
    </div>
  );
}

// Specialized layout for authentication pages
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Layout className="bg-gradient-to-br from-background via-card to-background">
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        {children}
      </div>
    </Layout>
  );
}

// Specialized layout for dashboard pages
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Layout>
      {children}
    </Layout>
  );
}

// Specialized layout for full-screen pages (no footer)
export function FullScreenLayout({ children }: { children: ReactNode }) {
  return (
    <Layout showFooter={false}>
      {children}
    </Layout>
  );
}