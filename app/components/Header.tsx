'use client';

import { useState, useEffect } from 'react';
import { mapBackendRoleToFrontend, BackendRole } from '@/app/types/auth';
import { authService } from '@/app/services/authService';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  onMenuToggle?: () => void;
}

export default function Header({ 
  userName: propUserName, 
  userRole: propUserRole,
  userAvatar = '',
  onMenuToggle
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [userData, setUserData] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
        const mappedRole = mapBackendRoleToFrontend(user.role as BackendRole);
        
        // Capitalize role for display
        const displayRole = mappedRole.charAt(0).toUpperCase() + mappedRole.slice(1);
        
        setUserData({
          name: fullName,
          role: displayRole
        });
      }
    } catch (e) {
      console.error('Error loading user data in Header', e);
    }
  }, []);

  const userName = propUserName || userData?.name || 'Cargando...';
  const userRole = propUserRole || userData?.role || '...';

  // Handle search input - Add search logic here
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // TODO: Implement search functionality with backend
  };

  // Handle notifications click - Add notifications logic here
  const handleNotifications = () => {
    // TODO: Implement notifications functionality
    console.log('Notifications clicked');
  };

  // Handle menu toggle - Add sidebar toggle logic here
  const handleMenuToggle = () => {
    if (onMenuToggle) {
      onMenuToggle();
    }
    console.log('Menu toggle clicked');
  };

  // Toggle user dropdown menu
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    // TODO: Add actual dropdown menu options
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left Section - Menu Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleMenuToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Buscador"
            className="pl-10 pr-4 py-2 w-96 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Right Section - Notifications & User Profile */}
      <div className="flex items-center gap-6">
        {/* Notifications Button */}
        <button
          onClick={handleNotifications}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {/* Notification Badge - TODO: Show actual count */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile Section */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span>{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* User Info */}
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>

            {/* Dropdown Icon */}
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${
                showDropdown ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu - TODO: Add actual menu items and logic */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {/* Hidden for now
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                Mi Perfil
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                Configuración
              </button>
              <hr className="my-1 border-gray-200" />
              */}
              <button 
                onClick={() => authService.logout()}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
