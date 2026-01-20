'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/app/services/authService';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // 1. Check if token exists
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // 2. Get user info
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        authService.logout(); // No user info found, force logout
        return;
      }

      try {
        const user = JSON.parse(userStr);
        const roleName = (user.role?.name || user.role || '').toLowerCase();

        // 3. Check role permission
        // Normalize roles for comparison
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

        if (normalizedAllowedRoles.includes(roleName)) {
          setAuthorized(true);
        } else {
          // Redirect to appropriate dashboard based on role or 403
          if (['admin', 'administrador'].includes(roleName)) {
            router.push('/admin-dashboard');
          } else if (['engineer', 'ingeniero', 'company', 'empresa', 'empresario'].includes(roleName)) {
            router.push('/gestion-citas');
          } else {
             // Fallback
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="font-inter text-gray-500 animate-pulse">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}
