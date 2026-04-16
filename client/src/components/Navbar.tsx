import { useAuthStore } from '../store/useAuthStore.js';
import { UserButton, useClerk } from '@clerk/react';
import { Shield, Menu, X, Sparkles, Command } from 'lucide-react';
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
    `relative rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-primary-500/10 text-primary-500 shadow-sm shadow-primary-500/10'
        : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100'
    }`;

  const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-primary-500/10 text-primary-500'
        : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100'
    }`;

  return (
    <nav className="sticky top-0 z-40 nav-gradient-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3 transition-all duration-200 hover:opacity-90">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl shadow-glow-sm"
                 style={{ background: 'var(--gradient-primary)' }}>
              <Sparkles className="h-4.5 w-4.5 text-white" />
              <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                   style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }} />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-none text-foreground font-heading tracking-tight">
                Intelligent Support
              </div>
              <div className="mt-1 text-[11px] text-surface-500">
                AI-powered workspace
              </div>
            </div>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center gap-1 rounded-2xl border border-border/50 bg-card/50 p-1 backdrop-blur-sm">
              {primaryLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={desktopNavClass}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Command Palette Hint */}
            <button className="hidden lg:flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-3 py-1.5 text-xs text-surface-400 backdrop-blur-sm transition-colors hover:border-primary-500/30 hover:text-surface-600">
              <Command className="w-3 h-3" />
              <span>Search</span>
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-200 text-primary-400 hover:text-primary-300"
                style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)' }}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}

            {/* Clerk User Button with Profile & Logout */}
            <div className="hidden sm:block">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 ring-2 ring-primary-500/20 ring-offset-2 ring-offset-background rounded-full",
                    userButtonPopoverCard: "shadow-xl border border-border/50 backdrop-blur-xl",
                    userButtonPopoverActionButton: "hover:bg-primary/10",
                    userButtonTrigger: "focus:shadow-none"
                  }
                }}
              />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 transition-all duration-200 hover:bg-surface-100 md:hidden"
              aria-label="Toggle mobile navigation"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-surface-600" />
              ) : (
                <Menu className="w-5 h-5 text-surface-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="animate-slide-down space-y-2 border-t border-border/30 pb-4 pt-3 md:hidden">
            <div className="rounded-2xl border border-border/50 bg-card/80 p-2 backdrop-blur-sm">
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
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-500 transition-colors hover:bg-primary-500/10"
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
