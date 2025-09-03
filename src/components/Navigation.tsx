import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logoSrc } from '../lib/logo';

export default function Navigation() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const fetchUserEmail = async () => {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        setUserEmail(session?.user?.email || null);
      }
    };
    fetchUserEmail();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const goBack = () => {
    router.back();
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Back button and Logo */}
          <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-3">
              <img src={logoSrc} onClick={() => navigateTo('/cma')} alt="CMAi" className="h-11 w-11" />
              <span className="text-white font-semibold text-lg">CMAi</span>
            </div>
          </div>

          {/* Right side - Navigation Menu */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigateTo('/cma')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                router.pathname === '/cma'
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              CMA
            </button>
            
            <button
              onClick={() => navigateTo('/dashboard')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                router.pathname === '/dashboard'
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Dashboard
            </button>
            
            <button
              onClick={() => navigateTo('/properties')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                router.pathname === '/properties'
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Properties
            </button>
            
            {/* User Icon with Dropdown */}
            <div className="relative user-dropdown">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                onMouseEnter={() => setShowUserDropdown(true)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 group"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              
              {/* User Email Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none max-w-[260px] md:max-w-[360px] break-all">
                {userEmail}
              </div>
              
              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div 
                  className="absolute top-full right-0 mt-2 w-[260px] md:w-[360px] bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50"
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-white/60 text-sm border-b border-white/10 truncate">
                      {userEmail}
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-white hover:bg-white/20 rounded-lg transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigateTo('/cma')}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 text-left ${
                  router.pathname === '/cma'
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                CMA
              </button>
              
              <button
                onClick={() => navigateTo('/dashboard')}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 text-left ${
                  router.pathname === '/dashboard'
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Dashboard
              </button>
              
              <button
                onClick={() => navigateTo('/properties')}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 text-left ${
                  router.pathname === '/properties'
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Properties
              </button>
              
              {userEmail && (
                <div className="px-4 py-3 text-white/60 text-sm border-t border-white/10">
                  {userEmail}
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="px-4 py-3 bg-red-500/80 hover:bg-red-500 text-white font-medium rounded-xl transition-all duration-300 text-left hover:shadow-lg"
              >
                
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

