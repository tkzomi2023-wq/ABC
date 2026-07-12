import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, CreditCard, Bell, BellOff, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  {
    label: 'College',
    children: [
      { label: 'Prologue', path: '/prologue' },
      { label: 'Doctrine', path: '/doctrine' },
      { label: 'Academic Info', path: '/academics' },
      { label: 'Our Faculty', path: '/teachers' },
      { label: 'Board of Management', path: '/board' },
    ],
  },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Blog', path: '/blog' },
  { label: 'Downloads', path: '/downloads' },
  { label: 'Apply', path: '/apply' },
];

const navLinksAuth = [
  { label: 'Notices', path: '/notices' },
  { label: 'Forum', path: '/forum' },
];

const navLinksPublic = [
  { label: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, adminUnreadMessages, markAsRead, markAllAsRead, pushSupported, pushEnabled, enablePush } = useNotifications();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setDropdown('');
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setDropdown('');
      }
      const inDesktopNotif = notifRef.current?.contains(e.target as Node);
      const inMobileNotif = mobileNotifRef.current?.contains(e.target as Node);
      if (!inDesktopNotif && !inMobileNotif) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  function toggleDropdown(label: string) {
    setDropdown((prev) => (prev === label ? '' : label));
  }

  const totalBadge = unreadCount + (profile?.role === 'admin' ? adminUnreadMessages : 0);

  return (
    <header
      ref={navRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-navy-950 shadow-lg' : 'bg-navy-950'
      }`}
    >
      {/* Top bar */}
      <div className="bg-gold-500 py-1 px-2 text-center overflow-hidden">
        <p className="hidden md:block text-navy-950 text-xs font-medium truncate">
          Accredited by Pentecostal Association for Theological Accreditation (PATA) | Member of Evangelical Theological Colleges Association – NEI | Estd. 1998
        </p>
        <div className="md:hidden overflow-hidden">
          <span className="marquee-ticker text-navy-950 text-xs font-medium">
            Accredited by Pentecostal Association for Theological Accreditation (PATA) | Member of Evangelical Theological Colleges Association – NEI | Estd. 1998
          </span>
        </div>
      </div>

      <nav className="w-full max-w-screen-xl mx-auto px-3 md:px-4">
        <div className="flex items-center justify-between h-16 gap-2 min-w-0">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Aizawl Bible College"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-gold-400"
            />
            <div className="hidden lg:block">
              <p className="text-white font-serif font-bold text-sm leading-tight">Aizawl Bible College</p>
              <p className="text-gold-300 text-xs leading-tight">Assemblies of God, Mizoram</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center flex-1 min-w-0 gap-0.5 px-1">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => setDropdown(link.label)}
                  onMouseLeave={() => setDropdown('')}
                >
                  <button
                    onClick={() => setDropdown(link.label)}
                    className="flex items-center gap-0.5 px-1.5 py-1.5 lg:px-2.5 text-slate-200 hover:text-white text-xs lg:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    {link.label}
                    <ChevronDown className={`w-3 h-3 transition-transform ${dropdown === link.label ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdown === link.label && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-[60]">
                      {link.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            `block px-4 py-2.5 text-sm transition-colors ${
                              isActive ? 'text-navy-800 bg-navy-50 font-medium' : 'text-slate-700 hover:bg-slate-50 hover:text-navy-800'
                            }`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={link.path}
                  to={link.path!}
                  className={({ isActive }) =>
                    `flex-shrink-0 px-1.5 py-1.5 lg:px-2.5 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-gold-400 bg-white/10'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              )
            )}
            {user && navLinksAuth.map((link) => (
              <NavLink
                key={link.path}
                to={link.path!}
                className={({ isActive }) =>
                  `flex-shrink-0 px-1.5 py-1.5 lg:px-2.5 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-gold-400 bg-white/10'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {navLinksPublic.map((link) => (
              <NavLink
                key={link.path}
                to={link.path!}
                className={({ isActive }) =>
                  `flex-shrink-0 px-1.5 py-1.5 lg:px-2.5 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-gold-400 bg-white/10'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Desktop: Auth buttons / user menu */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            {user ? (
              <>
                {/* Desktop notification bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    className="relative p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
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
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <span className="font-serif font-bold text-navy-900 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Mark all read</button>
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
                            {profile?.role === 'admin' && adminUnreadMessages > 0 && (
                              <Link
                                to="/admin?tab=messages"
                                onClick={() => setNotifOpen(false)}
                                className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-2 bg-red-50/40"
                              >
                                <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-800">{adminUnreadMessages} unread message{adminUnreadMessages !== 1 ? 's' : ''}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">New contact form submissions</p>
                                </div>
                              </Link>
                            )}
                            {notifications.filter((n) => !n.is_read).slice(0, 5).map((n) => (
                              <button
                                key={n.id}
                                onClick={() => markAsRead(n.id)}
                                className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors bg-amber-50/50"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                    <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                                  </div>
                                </div>
                              </button>
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
                      <Link to="/profile" onClick={() => setNotifOpen(false)} className="block px-4 py-2.5 text-center text-xs text-blue-600 hover:bg-slate-50 font-medium border-t border-slate-100">
                        View all in Profile
                      </Link>
                    </div>
                  )}
                </div>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('user')}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {(profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-white text-xs font-medium max-w-[80px] truncate hidden lg:block">
                      {profile?.full_name ?? 'Account'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-white" />
                  </button>
                  {dropdown === 'user' && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-navy-900">{profile?.full_name}</p>
                        <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      {profile?.role === 'admin' && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                          <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      )}
                      {profile?.role === 'finance' && (
                        <Link to="/transactions" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                          <CreditCard className="w-4 h-4" /> Transactions
                        </Link>
                      )}
                      {profile?.role === 'student' && (
                        <Link to="/transactions" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                          <CreditCard className="w-4 h-4" /> My Payments
                        </Link>
                      )}
                      <button
                        onClick={signOut}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100 mt-1"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-2.5 py-1.5 text-xs lg:text-sm text-white font-medium hover:text-gold-400 transition-colors whitespace-nowrap">
                  Sign In
                </Link>
                <Link to="/register" className="px-2.5 py-1.5 bg-gold-500 hover:bg-gold-600 text-white text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Notification bell (logged in only) + Hamburger */}
          <div className="relative flex md:hidden items-center gap-1 flex-shrink-0" ref={mobileNotifRef}>
            {user && (
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
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
              className="p-2 text-white hover:bg-white/10 rounded-lg"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile notification dropdown — right-anchored to this container */}
            {user && notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
                  <span className="font-serif font-bold text-navy-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.filter((n) => !n.is_read).length === 0 && adminUnreadMessages === 0 ? (
                    <div className="px-3 py-6 text-center">
                      <BellOff className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-400">No new notifications</p>
                    </div>
                  ) : (
                    <>
                      {profile?.role === 'admin' && adminUnreadMessages > 0 && (
                        <Link
                          to="/admin?tab=messages"
                          onClick={() => setNotifOpen(false)}
                          className="w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-2 bg-red-50/40"
                        >
                          <span className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800">{adminUnreadMessages} unread message{adminUnreadMessages !== 1 ? 's' : ''}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Contact form submissions</p>
                          </div>
                        </Link>
                      )}
                      {notifications.filter((n) => !n.is_read).slice(0, 5).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className="w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors bg-amber-50/50"
                        >
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full mt-1 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </button>
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
                <Link to="/profile" onClick={() => setNotifOpen(false)} className="block px-3 py-2 text-center text-xs text-blue-600 hover:bg-slate-50 font-medium border-t border-slate-100">
                  View all in Profile
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-white/10 mt-1">
            <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[calc(100dvh-88px)] pb-4 pt-3">
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label}>
                    <button
                      onClick={() => toggleDropdown(link.label)}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium"
                    >
                      {link.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${dropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdown === link.label && (
                      <div className="ml-4 mt-0.5 flex flex-col gap-0.5">
                        {link.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `px-4 py-2 text-sm rounded-lg transition-colors ${
                                isActive ? 'text-gold-400 bg-white/10 font-medium' : 'text-slate-300 hover:text-white hover:bg-white/10'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    key={link.path}
                    to={link.path!}
                    className={({ isActive }) =>
                      `px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive ? 'text-gold-400 bg-white/10' : 'text-slate-200 hover:text-white hover:bg-white/10'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                )
              )}
              {user && navLinksAuth.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path!}
                  className={({ isActive }) =>
                    `px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-gold-400 bg-white/10' : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {navLinksPublic.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path!}
                  className={({ isActive }) =>
                    `px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-gold-400 bg-white/10' : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1.5">
                {user ? (
                  <>
                    <div className="px-4 py-2">
                      <p className="text-white font-medium text-sm">{profile?.full_name}</p>
                      <p className="text-slate-400 text-xs capitalize">{profile?.role}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg">
                        <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}
                    {profile?.role === 'finance' && (
                      <Link to="/transactions" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg">
                        <CreditCard className="w-4 h-4" /> Transactions
                      </Link>
                    )}
                    {profile?.role === 'student' && (
                      <Link to="/transactions" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg">
                        <CreditCard className="w-4 h-4" /> My Payments
                      </Link>
                    )}
                    <button
                      onClick={signOut}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg font-medium">
                      Sign In
                    </Link>
                    <Link to="/register" className="mx-4 py-2.5 text-sm bg-gold-500 hover:bg-gold-600 text-white text-center rounded-lg font-medium transition-colors">
                      Register
                    </Link>
                  </>
                )}
                {deferredPrompt && (
                  <button
                    onClick={installPWA}
                    className="flex items-center gap-2 mx-4 mt-1 py-2.5 px-4 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20"
                  >
                    <Download className="w-4 h-4 text-gold-400" />
                    Install ABC App
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
