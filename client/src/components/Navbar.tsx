import { useAuthStore } from '../store/useAuthStore.js';
import { UserButton, useClerk } from '@clerk/react';
import { Shield, Menu, X, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { session } = useClerk();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = (user?.role || '').toUpperCase();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);
  const isSupport = isAdmin || ['SUPPORT_AGENT', 'SUPPORT', 'AGENT'].includes(role);

  // Handle post-signout cleanup
  const handleSignOut = async () => {
    try {
      await logout(); // Call backend logout
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  // Monitor Clerk session changes
  useEffect(() => {
    if (!session && user) {
      // User signed out from Clerk, cleanup backend
      handleSignOut();
    }
  }, [session, user]);

  return (
    <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold text-sm text-foreground leading-none">Intelligent Support</div>
              <div className="text-[11px] text-muted-foreground mt-1">AI + human support workspace</div>
            </div>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Admin Dashboard</Link>
                <Link to="/tickets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Tickets</Link>
                <Link to="/chats" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Chats</Link>
              </>
            ) : isSupport ? (
              <>
                <Link to="/support-queue" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Support Queue</Link>
                <Link to="/tickets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Tickets</Link>
                <Link to="/chats" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Chats</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                <Link to="/tickets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">My Tickets</Link>
                <Link to="/chats" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Recent Chats</Link>
              </>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm border border-primary/10"
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
                    userButtonPopoverActionButton: "hover:bg-primary/10"
                  }
                }}
              />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-card/50 rounded-lg transition-colors"
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
          <div className="md:hidden pb-4 border-t border-border/50 space-y-2">
            <Link
              to={isAdmin ? '/admin/dashboard' : isSupport ? '/support-queue' : '/dashboard'}
              className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {isAdmin ? 'Admin Dashboard' : isSupport ? 'Support Queue' : 'Dashboard'}
            </Link>
            <Link
              to="/tickets"
              className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tickets
            </Link>
            <Link
              to="/chats"
              className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Chats
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="block px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
            {/* Mobile User Button */}
            <div className="px-4 py-2">
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
