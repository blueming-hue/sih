import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser } from '../../firebase/auth';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  MessageCircle, 
  Calendar, 
  Users, 
  BookOpen, 
  FileText,
  Settings,
  Shield,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const isActive = (path) => location.pathname === path;

  // Role-based navigation
  const studentNav = [
    { name: 'Dashboard', path: '/dashboard', icon: User },
    { name: 'AI Chatbot', path: '/chatbot', icon: MessageCircle },
    { name: 'Chat', path: '/chat', icon: MessageCircle },
    { name: 'Book Session', path: '/booking', icon: Calendar },
    { name: 'Peer Forum', path: '/forum', icon: Users },
    { name: 'Resources', path: '/resources', icon: BookOpen },
    { name: 'Journal', path: '/journal', icon: FileText },
  ];
  const counsellorNav = [
    { name: 'Dashboard', path: '/counsellor', icon: Settings },
    { name: 'Bookings', path: '/counsellor/bookings', icon: Calendar },
    { name: 'Availability', path: '/counsellor/availability', icon: Clock },
    { name: 'Resources', path: '/counsellor/resources', icon: BookOpen },
  ];
  const adminNav = [
    { name: 'Admin Panel', path: '/admin', icon: Shield },
    { name: 'Approvals', path: '/admin/counsellors', icon: Users },
  ];
  const navigationItems = userData?.role === 'student' ? studentNav : userData?.role === 'counsellor' ? counsellorNav : userData?.role === 'admin' ? adminNav : [];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MINDLY</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* No extra items; navigation is role-based above */}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="hidden md:block">{userData?.displayName || 'User'}</span>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userData?.displayName}</p>
                      <p className="text-xs text-gray-500">{userData?.email}</p>
                      <p className="text-xs text-primary-600 capitalize">{userData?.role}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {user && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              {userData?.role === 'student' && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/dashboard')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/chatbot"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/chatbot')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>AI Chatbot</span>
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/chat')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </Link>
                  <Link
                    to="/booking"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/booking')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Session</span>
                  </Link>
                  <Link
                    to="/forum"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/forum')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Peer Forum</span>
                  </Link>
                  <Link
                    to="/resources"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/resources')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Resources</span>
                  </Link>
                  <Link
                    to="/journal"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/journal')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Journal</span>
                  </Link>
                </>
              )}
              {userData?.role === 'counsellor' && (
                <>
                  <Link
                    to="/counsellor"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/counsellor')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Counsellor Panel</span>
                  </Link>
                  <Link
                    to="/resources"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/resources')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Resources</span>
                  </Link>
                </>
              )}
              {userData?.role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/admin')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                  <Link
                    to="/admin/counsellors"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/admin/counsellors')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Approvals</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
