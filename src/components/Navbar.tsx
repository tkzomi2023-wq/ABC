import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, CreditCard, Bell, BellOff, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import DarkModeToggle from './DarkModeToggle';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/notices', label: 'Notices' },
  { to: '/blog', label: 'Blog' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/teachers', label: 'Faculty' },
  { to: '/board', label: 'Board' },
  { to: '/academics', label: 'Academics' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, adminUnreadMessages, totalBadge, markAllRead, pushSupported, pushEnabled, enablePush } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (mobileNotifRef.current && !mobileNotifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleBadge = (role: string) => {
    const classes: Record<string, string> = {
      admin: 'badge-admin',
      faculty: 'badge-faculty',
      student: 'badge-student',
      finance: 'badge-finance',
      standard: 'badge-standard',
    };
    return <span className={classes[role] || classes.standard}>{role}</span>;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-navy-950/95 backdrop-blur-md shadow-lg' : 'bg-navy-950'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/logo.png" alt="Aizawl Bible College" className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-gold-400" />
            <div className="hidden sm:block">
              <span className="font-serif font-bold text-white text-sm md:text-base">Aizawl Bible College</span>
              <p className="text-[10px] text-slate-400 leading-none">Assemblies of God Mizoram</p>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-gold-400 bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <DarkModeToggle />
            {user ? (
              <>
                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    className="relative p-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
                    aria-label={`Notifications (${totalBadge} unread)`}
                    title={`${totalBadge} unread notification${totalBadge !== 1 ? 's' : ''}`}
                  >
                    <Bell className="w-4 h-4" />
                    {totalBadge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 animate-pulse">
                        {totalBadge > 9 ? '9+' : totalBadge}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-navy-600 dark:text-amber-400 hover:underline">Mark all read</button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 && adminUnreadMessages === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No notifications yet</p>
                          </div>
                        ) : (
                          <>
                            {adminUnreadMessages > 0 && profile?.role === 'admin' && (
                              <Link to="/admin" className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{adminUnreadMessages} unread contact message{adminUnreadMessages !== 1 ? 's' : ''}</p>
                                <p className="text-xs text-slate-400">Click to view in admin panel</p>
                              </Link>
                            )}
                            {notifications.slice(0, 10).map((n) => (
                              <div key={n.id} className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700 ${!n.is_read ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                      {pushSupported && !pushEnabled && (
                        <button onClick={() => enablePush()} className="w-full px-4 py-2.5 bg-navy-900 text-white text-xs font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2">
                          <Bell className="w-3.5 h-3.5" /> Enable push notifications on this device
                        </button>
                      )}
                      {pushSupported && pushEnabled && (
                        <div className="px-4 py-2 bg-green-50 text-green-700 text-xs text-center flex items-center justify-center gap-1.5">
                          <Bell className="w-3.5 h-3.5" /> Push notifications enabled
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gold-400 text-navy-950 flex items-center justify-center text-xs font-bold">
                        {(profile?.full_name || user.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-slate-200 max-w-[100px] truncate hidden lg:block">{profile?.full_name || 'User'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <div className="mt-1">{roleBadge(profile?.role || 'standard')}</div>
                      </div>
                      <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      {profile?.role === 'admin' && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      )}
                      {(profile?.role === 'admin' || profile?.role === 'faculty' || profile?.role === 'finance' || profile?.role === 'student') && (
                        <Link to="/transactions" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <CreditCard className="w-4 h-4" /> Transactions
                        </Link>
                      )}
                      <Link to="/downloads" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <Download className="w-4 h-4" /> Downloads
                      </Link>
                      {(profile?.role === 'admin' || profile?.role === 'faculty') && (
                        <Link to="/admin/blog/new" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Write Blog Post
                        </Link>
                      )}
                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-slate-200 dark:border-slate-700"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="px-4 py-2 text-sm text-slate-200 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="px-4 py-2 rounded-lg bg-gold-500 text-navy-950 text-sm font-medium hover:bg-gold-400 transition-colors">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile: Dark mode toggle + Notification bell (logged in only) + Hamburger */}
          <div className="relative flex md:hidden items-center gap-1 flex-shrink-0" ref={mobileNotifRef}>
            <DarkModeToggle />
            {user && (
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
                aria-label={`Notifications (${totalBadge} unread)`}
                title={`${totalBadge} unread`}
              >
                <Bell className="w-5 h-5" />
                {totalBadge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 animate-pulse">
                    {totalBadge > 9 ? '9+' : totalBadge}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-950 border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-gold-400 bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {!user && (
              <div className="pt-2 flex items-center gap-2">
                <Link to="/login" className="flex-1 text-center px-4 py-2.5 rounded-lg border border-slate-600 text-slate-200 text-sm font-medium">Login</Link>
                <Link to="/register" className="flex-1 text-center px-4 py-2.5 rounded-lg bg-gold-500 text-navy-950 text-sm font-medium">Register</Link>
              </div>
            )}
            {user && (
              <div className="pt-2 border-t border-white/10 space-y-1">
                <Link to="/profile" className="block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5">My Profile</Link>
                {profile?.role === 'admin' && <Link to="/admin" className="block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5">Admin Dashboard</Link>}
                <Link to="/downloads" className="block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5">Downloads</Link>
                <button onClick={() => signOut()} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-white/5">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile notification dropdown */}
      {notifOpen && user && (
        <div className="md:hidden absolute top-16 right-0 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Notifications</h3>
            {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-navy-600 dark:text-amber-400 hover:underline">Mark all read</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.filter((n) => !n.is_read).length === 0 && adminUnreadMessages === 0 ? (
              <div className="px-3 py-6 text-center">
                <BellOff className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400">No new notifications</p>
              </div>
            ) : (
              <>
                {adminUnreadMessages > 0 && profile?.role === 'admin' && (
                  <Link to="/admin" className="block px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{adminUnreadMessages} unread contact message{adminUnreadMessages !== 1 ? 's' : ''}</p>
                  </Link>
                )}
                {notifications.slice(0, 8).map((n) => (
                  <div key={n.id} className={`px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 ${!n.is_read ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </>
            )}
          </div>
          {pushSupported && !pushEnabled && (
            <button onClick={() => enablePush()} className="w-full px-3 py-2 bg-navy-900 text-white text-xs font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-1.5">
              <Bell className="w-3 h-3" /> Enable push notifications
            </button>
          )}
          {pushSupported && pushEnabled && (
            <div className="px-3 py-1.5 bg-green-50 text-green-700 text-xs text-center flex items-center justify-center gap-1">
              <Bell className="w-3 h-3" /> Push enabled
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
