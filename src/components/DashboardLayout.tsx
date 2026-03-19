import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '@/components/AppSidebar';
import { Menu } from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile && !collapsed) {
      setCollapsed(true);
    }
  }, [isMobile, collapsed]);

  // Handle sidebar state persistence
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    }
  }, [collapsed, isMobile]);

  return (
    <div className="flex min-h-screen bg-background">

      {/* ────────────────────────────────────────────
          MOBILE: backdrop overlay when drawer is open
          ──────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-background/85 backdrop-blur-md z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────
          MOBILE: fixed slide-in drawer
          ──────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed top-0 left-0 h-screen w-72 z-50 transition-transform duration-300 ease-out lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <AppSidebar
          collapsed={false}
          onToggleCollapse={() => {}}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ────────────────────────────────────────────
          DESKTOP: sidebar is a FLEX SIBLING
          → never overlaps the content area
          Width animates between 80px (collapsed)
          and 288px (expanded) via CSS transition.
          ──────────────────────────────────────────── */}
      <div
        className={cn(
          'hidden lg:block flex-shrink-0 transition-all duration-300 ease-out',
          collapsed ? 'w-20' : 'w-72'
        )}
      >
        {/* sticky so it stays in view while content scrolls */}
        <div className="sticky top-0 h-screen">
          <AppSidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(prev => !prev)}
            onClose={() => {}}
          />
        </div>
      </div>

      {/* ────────────────────────────────────────────
          MAIN CONTENT
          flex-1 automatically fills the remaining
          width — content always stays to the right
          of the sidebar.
          ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top header */}
        <motion.div
          className="lg:hidden sticky top-0 z-30 h-16 flex items-center gap-4 px-6 border-b border-border/20 bg-card/90 backdrop-blur-xl"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl hover:bg-primary/10 transition-all duration-200 border border-border/20 hover:border-primary/30 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.button>
          <motion.span
            className="font-bold text-lg bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Tradient
          </motion.span>
        </motion.div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

      </div>
    </div>
  );
}