import { useAuthStore } from '../store/useAuthStore.js';
import { LogOut, User, Shield, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline text-foreground">Support</span>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/kb" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Knowledge Base
            </Link>
            <Link to="/tickets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tickets
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-card/50 transition-colors">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-border/30"
                />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground max-w-[150px] truncate">
                {user?.name}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>

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
          <div className="md:hidden pb-4 border-t border-border/50">
            <Link
              to="/kb"
              className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Knowledge Base
            </Link>
            <Link
              to="/tickets"
              className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tickets
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="block px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
