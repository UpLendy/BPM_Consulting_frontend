'use client';

import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/app/services/authService';
import { useEffect, useState } from 'react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  transitionEnabled?: boolean;
}

// Menu Items Configuration
const MENU_ITEMS = [
  // Admin Routes
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    path: '/admin-dashboard', // Assuming specific dashboard paths
    roles: ['admin', 'administrador']
  },
  {
    key: 'gestion-usuarios',
    label: 'Gestión de usuarios',
    icon: '👥',
    path: '/gestion-usuarios',
    roles: ['admin', 'administrador']
  },
  {
    key: 'registrar-usuarios',
    label: 'Registrar usuarios',
    icon: '👤',
    path: '/registrar-usuarios',
    roles: ['admin', 'administrador']
  },
  {
    key: 'registrar-empresa',
    label: 'Registrar empresa',
    icon: '🏢',
    path: '/registrar-empresa',
    roles: ['admin', 'administrador']
  },
  {
    key: 'reportes',
    label: 'Reportes/Estadísticas',
    icon: '📈',
    path: '/reportes',
    roles: ['admin', 'administrador']
  },

  // Shared Routes (Admin & Engineer & Company potentially different views but same menu name concept)
  // Adjusted per request specifics:
  
  // "Gestión de citas" -> Admin, Engineer, Company
  {
    key: 'gestion-citas',
    label: 'Gestión de citas',
    icon: '📅',
    path: '/gestion-citas',
    roles: ['admin', 'administrador', 'engineer', 'ingeniero', 'company', 'empresa', 'empresario']
  },

  // "Documentos empresa" -> Admin, Engineer
  {
    key: 'documentos-empresa',
    label: 'Documentos empresa',
    icon: '📄',
    path: '/documentos-empresa',
    roles: ['admin', 'administrador', 'engineer', 'ingeniero']
  },

  // Engineer specific
  {
    key: 'registro-visita',
    label: 'Registro de visita',
    icon: '📋',
    path: '/registro-visita',
    roles: ['engineer', 'ingeniero']
  },
  {
    key: 'generar-acta',
    label: 'Generar acta',
    icon: '📋',
    path: '/generar-acta',
    roles: ['engineer', 'ingeniero']
  },

  // Company specific
  {
    key: 'visualizar-documentos',
    label: 'Visualizar documentos',
    icon: '📑',
    path: '/visualizar-documentos',
    roles: ['company', 'empresa', 'empresario']
  }
];

export default function Sidebar({ isOpen = true, onClose, transitionEnabled = true }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter(); // Initialize router
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get user role from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Supports both scalar role string or object role { name: 'admin' }
        const roleName = user.role?.name || user.role || '';
        setUserRole(roleName.toLowerCase());
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  // Handle menu item click
  const handleMenuClick = (path: string) => {
    if (onClose) onClose();
    router.push(path); // Use Next.js client-side navigation
  };

  const handleLogout = () => {
    authService.logout();
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Filter menu items based on role
  const allowedMenuItems = MENU_ITEMS.filter(item => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 w-64 lg:w-20'}
        h-full bg-[#3f4771] flex flex-col justify-between text-white 
        transition-all ${transitionEnabled ? 'duration-300' : 'duration-0'} 
        overflow-hidden
      `}>
        {/* Top Section */}
        <div>
          <div className="p-6 border-b border-[#4a5180] min-h-[81px] flex items-center justify-between">
            {isOpen ? (
              <div className="w-full flex justify-center">
                <img src="/logoBPM.png" alt="BPM Consulting" className="h-10 w-auto" />
              </div>
            ) : (
               <div className="w-[26px] h-8 relative overflow-hidden hidden lg:block">
                 <img 
                   src="/logoBPM.png" 
                   alt="BPM" 
                   className="h-[16px] w-auto max-w-none absolute left-0 top-1/2 -translate-y-1/2" 
                 />
              </div>
            )}
            
            {/* Mobile Close Button */}
            <button 
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-[#4a5180] rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="mt-6 px-3">
            {allowedMenuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
                  isActive(item.path) ? 'bg-[#4a5180]' : ''
                }`}
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                {isOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-[#4a5180]">
          {/* Cerrar Sesión */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors hover:bg-red-600"
          >
            <span className="text-2xl shrink-0">🚪</span>
            {isOpen && <span className="text-sm font-medium truncate">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
