import { useAuthStore } from '../store/useAuthStore.js';
import { UserButton, useClerk } from '@clerk/react';
import { Shield, Menu, X, Sparkles } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { session } = useClerk();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = (user?.role || '').toUpperCase();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);
  const isSupport = isAdmin || ['SUPPORT_AGENT', 'SUPPORT', 'AGENT'].includes(role);

  const primaryLinks = isAdmin
    ? [
        { to: '/admin/dashboard', label: 'Admin Dashboard' },
        { to: '/tickets', label: 'Tickets' },
        { to: '/chats', label: 'Chats' }
      ]
    : isSupport
    ? [
        { to: '/support-queue', label: 'Support Queue' },
        { to: '/tickets', label: 'Tickets' },
        { to: '/chats', label: 'Chats' }
      ]
    : [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/tickets', label: 'My Tickets' },
        { to: '/chats', label: 'Recent Chats' }
      ];

  // Handle post-signout cleanup
  const handleSignOut = useCallback(async () => {
    try {
      await logout(); // Call backend logout
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  }, [logout, navigate]);

  // Monitor Clerk session changes
  useEffect(() => {
    if (!session && user) {
      // User signed out from Clerk, cleanup backend
      handleSignOut();
    }
  }, [session, user, handleSignOut]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const desktopNavClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-surface-100 hover:text-foreground'
    }`;

  const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-surface-100 hover:text-foreground'
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-sm shadow-primary/20">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-none text-foreground">Intelligent Support</div>
              <div className="mt-1 text-[11px] text-muted-foreground">AI + human support workspace</div>
            </div>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card/70 p-1">
              {primaryLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={desktopNavClass}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}

            {/* Clerk User Button with Profile & Logout */}
            <div className="hidden sm:block">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                    userButtonPopoverCard: "shadow-xl border border-border/50",
                    userButtonPopoverActionButton: "hover:bg-primary/10",
                    userButtonTrigger: "focus:shadow-none"
                  }
                }}
              />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-card/60 md:hidden"
              aria-label="Toggle mobile navigation"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="space-y-2 border-t border-border/50 pb-4 pt-3 md:hidden">
            <div className="rounded-xl border border-border bg-card/80 p-2">
              {primaryLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={mobileNavClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
            {/* Mobile User Button */}
            <div className="px-2 py-2">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                    userButtonPopoverCard: "shadow-xl border border-border/50"
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
