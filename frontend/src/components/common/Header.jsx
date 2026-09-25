import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import {
  BookOpen,
  Sparkles,
  Layers,
  Shield,
  User,
  LogOut,
  LogIn,
  ChevronDown,
  Bell,
  Check,
  Menu,
  X,
} from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dashboardPath = { admin: '/admin', instructor: '/instructor', reviewer: '/reviewer', student: '/student', mentor: '/mentor' }[user?.role];

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const [list, unread] = await Promise.all([
        api.get('/notifications?limit=8'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(list.data.notifications || []);
      setUnreadCount(unread.data.count || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => { refreshNotifications(); }, [user?._id]);

  const markRead = async (notification) => {
    if (!notification.read) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);
        setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, read: true } : item));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch { /* Keep the notification in the menu for a retry. */ }
    }
    setNotificationsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch { /* The unread count remains visible when the request fails. */ }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Learn<span className="text-brand-600">Hub</span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-100 text-brand-800">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5 text-brand-600" />
                  CAPSTONE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Skill Learning & Assessment Platform</p>
            </div>
          </Link>

          {/* Nav Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-600">
            <Link to="/" className="hover:text-brand-600 transition">
              Home
            </Link>
            <Link to="/courses" className="hover:text-brand-600 transition">Courses</Link>
            {user && <Link to={dashboardPath} className="hover:text-brand-600 transition">Dashboard</Link>}
            {user?.role === 'student' && <><Link to="/student/my-courses" className="hover:text-brand-600 transition">My courses</Link><Link to="/student/certificates" className="hover:text-brand-600 transition">Certificates</Link><Link to="/student/mentor" className="hover:text-brand-600 transition">Mentor</Link></>}
            {user?.role === 'reviewer' && <Link to="/reviewer/courses" className="hover:text-brand-600 transition">Review queue</Link>}
            {user?.role === 'admin' && <Link to="/reviewer/courses" className="hover:text-brand-600 transition">Review queue</Link>}

            {/* Category Management */}
            <Link
              to="/admin/categories"
              className={`flex items-center gap-1.5 hover:text-brand-600 transition ${user?.role === 'admin' ? '' : 'hidden'}`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Categories
              <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">Admin</span>
            </Link>

            {/* Course & Curriculum Management */}
              <Link
                to="/instructor/courses"
                className={`flex items-center gap-1.5 hover:text-brand-600 transition ${user?.role === 'instructor' || user?.role === 'admin' ? '' : 'hidden'}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              Courses & Curriculum
              <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">Instructor</span>
            </Link>
            {(user?.role === 'instructor' || user?.role === 'admin') && <Link to={user.role === 'admin' ? '/admin/analytics' : '/instructor/analytics'} className="hover:text-brand-600 transition">Analytics</Link>}
          </nav>

          <button className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle navigation">{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>

          {/* Right Action / Auth & Role Switcher */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button onClick={() => setNotificationsOpen((open) => !open)} className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold grid place-items-center">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                  </button>
                  {notificationsOpen && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <strong className="text-sm text-slate-800">Notifications</strong>
                      {unreadCount > 0 && <button onClick={markAllRead} className="text-[11px] font-semibold text-brand-700 hover:underline flex items-center gap-1"><Check className="w-3 h-3" /> Mark all read</button>}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length ? notifications.map((notification) => <button key={notification._id} onClick={() => markRead(notification)} className={`block w-full text-left px-4 py-3 hover:bg-slate-50 ${notification.read ? 'bg-white' : 'bg-brand-50/50'}`}>
                        <span className="block text-xs font-bold text-slate-800">{notification.title}</span>
                        <span className="mt-1 block text-[11px] text-slate-600">{notification.message}</span>
                        <time className="mt-1 block text-[10px] text-slate-400">{new Date(notification.createdAt).toLocaleString()}</time>
                      </button>) : <p className="px-4 py-8 text-center text-xs text-slate-500">You’re all caught up.</p>}
                    </div>
                  </div>}
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-bold text-slate-800 block leading-tight truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider block">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
        {mobileMenuOpen && <nav className="lg:hidden border-t border-slate-100 py-3"><div className="grid gap-1 text-sm font-semibold text-slate-700"><Link onClick={() => setMobileMenuOpen(false)} to="/courses" className="rounded-lg px-3 py-2 hover:bg-slate-50">Browse courses</Link>{user && <Link onClick={() => setMobileMenuOpen(false)} to={dashboardPath} className="rounded-lg px-3 py-2 hover:bg-slate-50">Dashboard</Link>}{user?.role === 'student' && <><Link onClick={() => setMobileMenuOpen(false)} to="/student/my-courses" className="rounded-lg px-3 py-2 hover:bg-slate-50">My courses</Link><Link onClick={() => setMobileMenuOpen(false)} to="/student/certificates" className="rounded-lg px-3 py-2 hover:bg-slate-50">Certificates</Link><Link onClick={() => setMobileMenuOpen(false)} to="/student/mentor" className="rounded-lg px-3 py-2 hover:bg-slate-50">Mentor support</Link></>}{user?.role === 'instructor' && <><Link onClick={() => setMobileMenuOpen(false)} to="/instructor/courses" className="rounded-lg px-3 py-2 hover:bg-slate-50">Courses and curriculum</Link><Link onClick={() => setMobileMenuOpen(false)} to="/instructor/analytics" className="rounded-lg px-3 py-2 hover:bg-slate-50">Analytics</Link></>}{user?.role === 'admin' && <><Link onClick={() => setMobileMenuOpen(false)} to="/admin/categories" className="rounded-lg px-3 py-2 hover:bg-slate-50">Categories</Link><Link onClick={() => setMobileMenuOpen(false)} to="/admin/analytics" className="rounded-lg px-3 py-2 hover:bg-slate-50">Analytics</Link><Link onClick={() => setMobileMenuOpen(false)} to="/reviewer/courses" className="rounded-lg px-3 py-2 hover:bg-slate-50">Review queue</Link></>}{user?.role === 'reviewer' && <Link onClick={() => setMobileMenuOpen(false)} to="/reviewer/courses" className="rounded-lg px-3 py-2 hover:bg-slate-50">Review queue</Link>}</div></nav>}
      </div>
    </header>
  );
}
